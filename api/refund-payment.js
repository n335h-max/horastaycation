import { getJsonBody, getStripeClient } from './_lib/stripeServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const stripe = getStripeClient();
    const { paymentIntentId, stripeSessionId, reason = 'requested_by_customer' } = getJsonBody(req);

    let resolvedPaymentIntentId = paymentIntentId;

    if (!resolvedPaymentIntentId && stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      resolvedPaymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '';
    }

    if (!resolvedPaymentIntentId) {
      return res.status(400).json({ error: 'Missing Stripe payment intent id.' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: resolvedPaymentIntentId,
      reason,
    });

    return res.status(200).json({
      refundId: refund.id,
      status: refund.status,
      paymentIntentId: resolvedPaymentIntentId,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Stripe refund failed.',
    });
  }
}
