import { getJsonBody, getStripeClient } from './_lib/stripeServer.js';
import { requireManagementUser } from './_lib/auth.js';
import { applyRateLimit } from './_lib/rateLimit.js';
import { handleCors } from './_lib/cors.js';

export default async function handler(req, res) {
  const corsResult = handleCors(req, res, ['POST']);
  if (corsResult) return corsResult;

  const management = await requireManagementUser(req);
  if (!management.ok) {
    return res.status(management.status || 500).json({ error: management.error || 'Unauthorized.' });
  }

  // Rate limit: 5 requests per 10 minutes per management user
  const rateLimitResult = applyRateLimit(req, res, {
    userId: management.user.id,
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (rateLimitResult) {
    return rateLimitResult;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  try {
    const stripe = getStripeClient();
    const { paymentIntentId, stripeSessionId, reason: rawReason } = getJsonBody(req);

    const ALLOWED_REFUND_REASONS = new Set(['duplicate', 'fraudulent', 'requested_by_customer']);
    const reason = ALLOWED_REFUND_REASONS.has(rawReason) ? rawReason : 'requested_by_customer';

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
