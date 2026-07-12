import { getJsonBody, getStripeClient } from './_lib/stripeServer.js';
import { resolveAuthenticatedUser } from './_lib/auth.js';
import { applyRateLimit } from './_lib/rateLimit.js';
import { handleCors } from './_lib/cors.js';
import { FEATURED_PROPERTIES } from '../src/data/siteData.js';

const SERVICE_FEE_RATE = 0.12;

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

function getPropertyPricing(propertyId) {
  const property = FEATURED_PROPERTIES.find((item) => item.id === String(propertyId || '').trim());
  if (!property) {
    return null;
  }

  const nightlyRate = Number(property.price);
  if (!Number.isFinite(nightlyRate) || nightlyRate <= 0) {
    return null;
  }

  return property;
}

function calculateBookingAmounts(bookingForm) {
  const property = getPropertyPricing(bookingForm?.property);
  if (!property) {
    return null;
  }

  const checkinDate = new Date(bookingForm.checkin);
  const checkoutDate = new Date(bookingForm.checkout);
  const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

  if (!Number.isFinite(nights) || nights <= 0) {
    return null;
  }

  const subtotal = nights * Number(property.price);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);

  return {
    property,
    nights,
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
  };
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
  const pricing = calculateBookingAmounts(bookingForm);

  if (!bookingForm?.property || !bookingForm?.checkin || !bookingForm?.checkout || !bookingForm?.guestEmail || !pricing) {
    return res.status(400).json({ error: 'Booking details are incomplete.' });
  }

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
