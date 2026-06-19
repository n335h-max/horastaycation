import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing Stripe session id.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    });
    const latestCharge = session.payment_intent?.latest_charge;
    const cardLast4 = latestCharge?.payment_method_details?.card?.last4 || '';

    return res.status(200).json({
      paid: session.payment_status === 'paid',
      status: session.status,
      paymentStatus: session.payment_status,
      customerName: session.customer_details?.name || session.metadata?.guestName || '',
      customerEmail: session.customer_details?.email || session.metadata?.guestEmail || '',
      cardLast4,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Stripe checkout session verification failed.',
    });
  }
}
