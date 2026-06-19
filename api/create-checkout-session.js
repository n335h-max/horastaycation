import Stripe from 'stripe';

function getOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}

function getBody(req) {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { bookingForm, bookingSummary } = getBody(req);

  if (!bookingForm?.property || !bookingSummary?.total || !bookingSummary?.name) {
    return res.status(400).json({ error: 'Booking details are incomplete.' });
  }

  try {
    const origin = getOrigin(req);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/booking`,
      customer_email: bookingForm.guestEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: process.env.STRIPE_CURRENCY || 'usd',
            unit_amount: Math.round(Number(bookingSummary.total) * 100),
            product_data: {
              name: `${bookingSummary.name} staycation booking`,
              description: `${bookingSummary.nights} night(s) · ${bookingSummary.location}`,
            },
          },
        },
      ],
      metadata: {
        propertyId: String(bookingForm.property),
        propertyName: String(bookingSummary.name),
        guestName: String(bookingForm.guestName || ''),
        guestEmail: String(bookingForm.guestEmail || ''),
      },
    });

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
