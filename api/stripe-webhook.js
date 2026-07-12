import { mapWebhookMetadataToBookingRecord, updateBookingTransactionAdmin, upsertBookingTransactionAdmin, hasProcessedStripeEvent, recordProcessedStripeEvent } from './_lib/supabaseAdmin.js';
import { getStripeClient, readRawRequestBody } from './_lib/stripeServer.js';
import { getResendClient, getFromEmail } from './_lib/resendServer.js';
import { logger } from './_lib/logger.js';
import {
  bookingConfirmationTemplate,
  ownerBookingAlertTemplate,
  managementBookingAlertTemplate,
} from './_lib/emailTemplates.js';

function getHeader(req, name) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

async function sendEmailViaResend(type, data, to = null) {
  const resend = getResendClient();
  const fromEmail = getFromEmail();

  const TEMPLATE_MAP = {
    booking_confirmation: {
      subject: `Booking Confirmed — ${data.propertyName} with Hora Staycation`,
      html: bookingConfirmationTemplate(data),
      to: data.guestEmail,
    },
    owner_booking_alert: {
      subject: `New Booking Alert — ${data.propertyName}`,
      html: ownerBookingAlertTemplate(data),
      to: to,
    },
    management_booking_alert: {
      subject: `[Management] New Booking — ${data.propertyName}`,
      html: managementBookingAlertTemplate(data),
      to: to,
    },
  };

  const config = TEMPLATE_MAP[type];
  if (!config || !config.to) return;

  await resend.emails.send({
    from: fromEmail,
    to: config.to,
    subject: config.subject,
    html: config.html,
  });
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
    let eventRecorded = false;

    // Idempotency: skip already-processed events
    try {
      const already = await hasProcessedStripeEvent(event.id);
      if (already) {
        return res.status(200).json({ received: true, skipped: 'duplicate_event' });
      }
    } catch (err) {
      // If the dedupe check fails, continue processing but log a warning
      logger.warn('Failed to check dedupe for stripe event', err);
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

      const checkoutRecordResult = await recordProcessedStripeEvent(event.id, event.type);
      eventRecorded = Boolean(checkoutRecordResult?.recorded);
      if (!eventRecorded) {
        logger.warn(
          'Skipping webhook emails because event could not be recorded before dispatch:',
          checkoutRecordResult?.reason || 'stripe_event_record_failed',
        );
      }

      // Send emails via Resend and wait for settlement before acknowledging webhook.
      if (session.metadata && eventRecorded) {
        const m = session.metadata;
        const managementEmail = (process.env.MANAGEMENT_EMAIL || '').trim();
        const emailData = {
          guestName: m.guestName || 'Guest',
          guestEmail: m.guestEmail || session.customer_details?.email || '',
          guestPhone: m.guestPhone || '',
          propertyName: m.propertyName || 'Property',
          propertyLocation: m.propertyLocation || '',
          checkinDate: m.checkinDate || '',
          checkoutDate: m.checkoutDate || '',
          guests: m.guests || '1',
          nights: m.nights || '1',
          subtotal: m.subtotal || '0',
          serviceFee: m.serviceFee || '0',
          total: m.total || '0',
          statusNote: session.payment_status === 'paid' ? 'Payment successful.' : 'Payment pending.',
          bookingId: session.id,
        };

        const emailTasks = [];

        if (emailData.guestEmail) {
          emailTasks.push(sendEmailViaResend('booking_confirmation', emailData));
        }

        if (m.ownerEmail) {
          emailTasks.push(sendEmailViaResend('owner_booking_alert', emailData, m.ownerEmail));
        }

        if (managementEmail) {
          emailTasks.push(sendEmailViaResend('management_booking_alert', emailData, managementEmail));
        } else {
          logger.warn('MANAGEMENT_EMAIL is not configured; skipping management booking alert email.');
        }

        const withTimeout = async (promise, ms) => {
          let timeoutId;
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`Webhook email timed out after ${ms}ms`)), ms);
          });

          try {
            return await Promise.race([promise, timeoutPromise]);
          } finally {
            clearTimeout(timeoutId);
          }
        };

        if (emailTasks.length) {
          const results = await Promise.allSettled(emailTasks.map((task) => withTimeout(task, 3000)));
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              logger.warn(`Failed to send webhook email #${index + 1}:`, result.reason);
            }
          });
        }
      }
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
    // Record that we've processed this Stripe event to avoid duplicates.
    if (!eventRecorded) {
      const result = await recordProcessedStripeEvent(event.id, event.type);
      if (!result?.recorded) {
        logger.warn('Failed to record processed stripe event', result?.reason || 'stripe_event_record_failed');
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Stripe webhook verification failed.',
    });
  }
}
