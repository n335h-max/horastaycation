import { getJsonBody, getStripeClient } from './_lib/stripeServer.js';
import { resolveAuthenticatedUser } from './_lib/auth.js';
import { applyRateLimit } from './_lib/rateLimit.js';
import { handleCors } from './_lib/cors.js';
import { fetchPublishedManagementListing } from './_lib/supabaseAdmin.js';
import { calculateBookingAmounts } from './_lib/pricing.js';

function normalizeOrigin(value) {
  const input = String(value || '').trim();
  if (!input) {
    return '';
  }

  try {
    return new URL(input.includes('://') ? input : `https://${input}`).origin;
  } catch {
    return '';
  }
}

function getOrigin(req) {
  const configuredOrigin = normalizeOrigin(process.env.APP_BASE_URL || process.env.VERCEL_URL || '');
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim() || 'https';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return host ? normalizeOrigin(`${protocol}://${host}`) : '';
}

function getHeader(req, name) {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value || '';
}

function buildFallbackIdempotencyKey(authUserId, bookingForm, bookingSummary) {
  const value = [
    String(authUserId || ''),
    String(bookingForm?.property || ''),
    String(bookingForm?.checkin || ''),
    String(bookingForm?.checkout || ''),
    String(bookingForm?.guestEmail || ''),
    String(bookingSummary?.total || ''),
  ].join('|');

  return `checkout-${value}`.slice(0, 255);
}

function scopeIdempotencyKey(authUserId, rawKey) {
  const normalizedKey = String(rawKey || '').trim();
  if (!normalizedKey) {
    return '';
  }

  return `checkout-${String(authUserId || '')}-${normalizedKey}`.slice(0, 255);
}

function sanitizeMetadataValue(value, maxLength = 500) {
  return String(value || '')
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, maxLength);
}

export default async function handler(req, res) {
  const corsResult = handleCors(req, res, ['POST']);
  if (corsResult) return corsResult;

  const auth = await resolveAuthenticatedUser(req);
  if (!auth.ok) {
    return res.status(auth.status || 500).json({ error: auth.error || 'Unauthorized.' });
  }

  // Rate limit: 10 requests per minute per authenticated user
  const rateLimitResult = applyRateLimit(req, res, {
    userId: auth.user.id,
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (rateLimitResult) {
    return rateLimitResult;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const stripe = getStripeClient();
  const { bookingForm, bookingSummary } = getJsonBody(req);
  const requestIdempotencyKey = String(getHeader(req, 'idempotency-key')).trim();

  if (!bookingForm?.property || !bookingForm?.checkin || !bookingForm?.checkout || !bookingForm?.guestEmail) {
    return res.status(400).json({ error: 'Booking details are incomplete.' });
  }

  // Price against the Supabase management_listings table (the same source the
  // client uses), not a static array. Previously this looked up an empty
  // FEATURED_PROPERTIES array, so pricing was always null and every booking
  // was rejected as "incomplete".
  const listing = await fetchPublishedManagementListing(bookingForm.property);
  const pricing = calculateBookingAmounts(listing, bookingForm);
  if (!pricing) {
    return res.status(400).json({ error: 'This staycation is no longer available for booking.' });
  }

  // ── Server-side ingestion guards (M-1 & M-3) ──────────────────────────────
  // Never trust the client for financial or capacity calculations. All checks
  // run against authoritative data (Supabase listing + server clock).

  const checkinDate = new Date(bookingForm.checkin);
  const checkoutDate = new Date(bookingForm.checkout);

  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
    return res.status(400).json({ error: 'Invalid check-in or check-out date.' });
  }

  // 1. Prevent historical check-in dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkinDate < today) {
    return res.status(400).json({ error: 'Check-in date cannot be in the past.' });
  }

  // 2. Enforce operational stay-length limits (1–30 nights)
  const calculatedNights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
  if (calculatedNights < 1 || calculatedNights > 30) {
    return res.status(400).json({ error: 'Invalid stay length. Limits are 1–30 nights.' });
  }

  // 3. Enforce listing guest capacity from Supabase (not the client form)
  const requestedGuests = Number(bookingForm.guests || 1);
  if (listing.max_guests && requestedGuests > listing.max_guests) {
    return res.status(400).json({
      error: `This property accommodates up to ${listing.max_guests} guest(s).`,
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const origin = getOrigin(req);
    if (!origin) {
      return res.status(500).json({ error: 'Unable to determine checkout origin.' });
    }

    const scopedHeaderIdempotencyKey = scopeIdempotencyKey(auth.user.id, requestIdempotencyKey);
    const idempotencyKey =
      scopedHeaderIdempotencyKey || buildFallbackIdempotencyKey(auth.user.id, bookingForm, pricing);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking?checkout=cancelled`,
      customer_email: bookingForm.guestEmail || undefined,
      customer_creation: 'always',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: process.env.STRIPE_CURRENCY || 'myr',
            unit_amount: Math.round(pricing.total * 100),
            product_data: {
              name: `${pricing.property.name} staycation booking`,
              description: `${pricing.nights} night(s) · ${pricing.property.location}`,
            },
          },
        },
      ],
      metadata: {
        clientUserId: sanitizeMetadataValue(auth.user.id, 255),
        clientUserEmail: sanitizeMetadataValue(auth.user.email, 255),
        ownerId: sanitizeMetadataValue(pricing.property.owner_id, 255),
        propertyId: sanitizeMetadataValue(bookingForm.property, 100),
        propertyName: sanitizeMetadataValue(pricing.property.name, 255),
        propertyLocation: sanitizeMetadataValue(pricing.property.location, 255),
        guestName: sanitizeMetadataValue(bookingForm.guestName, 255),
        guestEmail: sanitizeMetadataValue(bookingForm.guestEmail, 255),
        guestPhone: sanitizeMetadataValue(bookingForm.guestPhone, 50),
        checkinDate: sanitizeMetadataValue(bookingForm.checkin, 50),
        checkoutDate: sanitizeMetadataValue(bookingForm.checkout, 50),
        guests: sanitizeMetadataValue(bookingForm.guests, 10),
        nights: sanitizeMetadataValue(pricing.nights, 10),
        subtotal: sanitizeMetadataValue(pricing.subtotal, 20),
        serviceFee: sanitizeMetadataValue(pricing.serviceFee, 20),
        total: sanitizeMetadataValue(pricing.total, 20),
        specialRequests: sanitizeMetadataValue(bookingForm.specialRequests, 500),
      },
      payment_intent_data: {
        receipt_email: bookingForm.guestEmail || undefined,
        metadata: {
          clientUserId: sanitizeMetadataValue(auth.user.id, 255),
          clientUserEmail: sanitizeMetadataValue(auth.user.email, 255),
          propertyId: sanitizeMetadataValue(bookingForm.property, 100),
          propertyName: sanitizeMetadataValue(pricing.property.name, 255),
        },
      },
    }, { idempotencyKey });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Stripe checkout session creation failed.',
    });
  }
}
