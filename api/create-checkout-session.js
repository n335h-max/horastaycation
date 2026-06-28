import { getJsonBody, getStripeClient } from './_lib/stripeServer.js';
import { resolveAuthenticatedUser } from './_lib/auth.js';

function getOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${protocol}://${host}`;
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const auth = await resolveAuthenticatedUser(req);
  if (!auth.ok) {
    return res.status(auth.status || 500).json({ error: auth.error || 'Unauthorized.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const stripe = getStripeClient();
  const { bookingForm, bookingSummary } = getJsonBody(req);
  const requestIdempotencyKey = String(getHeader(req, 'idempotency-key')).trim();

  if (!bookingForm?.property || !bookingSummary?.total || !bookingSummary?.name) {
    return res.status(400).json({ error: 'Booking details are incomplete.' });
  }

  try {
    const origin = getOrigin(req);
    const scopedHeaderIdempotencyKey = scopeIdempotencyKey(auth.user.id, requestIdempotencyKey);
    const idempotencyKey =
      scopedHeaderIdempotencyKey || buildFallbackIdempotencyKey(auth.user.id, bookingForm, bookingSummary);
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
            unit_amount: Math.round(Number(bookingSummary.total) * 100),
            product_data: {
              name: `${bookingSummary.name} staycation booking`,
              description: `${bookingSummary.nights} night(s) · ${bookingSummary.location}`,
            },
          },
        },
      ],
      metadata: {
        clientUserId: String(auth.user.id || ''),
        clientUserEmail: String(auth.user.email || ''),
        propertyId: String(bookingForm.property),
        propertyName: String(bookingSummary.name),
        propertyLocation: String(bookingSummary.location),
        guestName: String(bookingForm.guestName || ''),
        guestEmail: String(bookingForm.guestEmail || ''),
        guestPhone: String(bookingForm.guestPhone || ''),
        checkinDate: String(bookingForm.checkin || ''),
        checkoutDate: String(bookingForm.checkout || ''),
        guests: String(bookingForm.guests || ''),
        nights: String(bookingSummary.nights || ''),
        subtotal: String(bookingSummary.subtotal || 0),
        serviceFee: String(bookingSummary.serviceFee || 0),
        total: String(bookingSummary.total || 0),
        specialRequests: String(bookingForm.specialRequests || ''),
      },
      payment_intent_data: {
        receipt_email: bookingForm.guestEmail || undefined,
        metadata: {
          clientUserId: String(auth.user.id || ''),
          clientUserEmail: String(auth.user.email || ''),
          propertyId: String(bookingForm.property),
          propertyName: String(bookingSummary.name),
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
