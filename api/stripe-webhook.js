import { mapWebhookMetadataToBookingRecord, updateBookingTransactionAdmin, upsertBookingTransactionAdmin, hasProcessedStripeEvent, recordProcessedStripeEvent } from './_lib/supabaseAdmin.js';
import { getStripeClient, readRawRequestBody } from './_lib/stripeServer.js';

function getHeader(req, name) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(200).json({ received: true, skipped: 'missing_webhook_secret' });
  }

  const signature = getHeader(req, 'stripe-signature');

  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature.' });
  }

  try {
    const stripe = getStripeClient();
    const rawBody = await readRawRequestBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    // Idempotency: skip already-processed events
    try {
      const already = await hasProcessedStripeEvent(event.id);
      if (already) {
        return res.status(200).json({ received: true, skipped: 'duplicate_event' });
      }
    } catch (err) {
      // If the dedupe check fails, continue processing but log a warning
      console.warn('Failed to check dedupe for stripe event', err);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '';

      await upsertBookingTransactionAdmin(
        mapWebhookMetadataToBookingRecord(session.metadata, {
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          paymentStatus: session.payment_status,
          bookingStatus: session.payment_status === 'paid' ? 'confirmed' : 'pending',
          customerReceiptEmail: session.customer_details?.email || session.metadata?.guestEmail || null,
          statusNote: session.payment_status === 'paid' ? 'Confirmed by Stripe webhook.' : 'Stripe checkout completed.',
        }),
      );
    }

    if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await updateBookingTransactionAdmin('stripe_session_id', session.id, {
        payment_status: event.type === 'checkout.session.expired' ? 'expired' : 'failed',
        booking_status: 'payment_issue',
        status_note: event.type === 'checkout.session.expired' ? 'Stripe checkout expired.' : 'Stripe reported an async payment failure.',
      });
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await updateBookingTransactionAdmin('stripe_payment_intent_id', paymentIntent.id, {
        payment_status: 'failed',
        booking_status: 'payment_issue',
        status_note: paymentIntent.last_payment_error?.message || 'Stripe payment failed.',
      });
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      await updateBookingTransactionAdmin('stripe_payment_intent_id', charge.payment_intent, {
        payment_status: 'refunded',
        booking_status: 'refunded',
        stripe_refund_id: charge.refunds?.data?.[0]?.id || null,
        refund_status: charge.refunded ? 'succeeded' : 'pending',
        refunded_at: charge.refunded ? new Date().toISOString() : null,
        status_note: charge.refunded ? 'Stripe refund completed.' : 'Stripe refund update received.',
      });
    }
    // Record that we've processed this Stripe event to avoid duplicates
    try {
      await recordProcessedStripeEvent(event.id, event.type);
    } catch (err) {
      console.warn('Failed to record processed stripe event', err);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Stripe webhook verification failed.',
    });
  }
}
