import { getStripeClient } from './_lib/stripeServer.js';
import { mapWebhookMetadataToBookingRecord, upsertBookingTransactionAdmin } from './_lib/supabaseAdmin.js';
import { resolveAuthenticatedUser } from './_lib/auth.js';
import { handleCors } from './_lib/cors.js';

export default async function handler(req, res) {
  const corsResult = handleCors(req, res, ['GET']);
  if (corsResult) return corsResult;

  const auth = await resolveAuthenticatedUser(req);
  if (!auth.ok) {
    return res.status(auth.status || 500).json({ error: auth.error || 'Unauthorized.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  const sessionId = req.query.session_id;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing Stripe session id.' });
  }

  const stripe = getStripeClient();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    });
    const latestCharge = session.payment_intent?.latest_charge;
    const cardLast4 = latestCharge?.payment_method_details?.card?.last4 || '';
    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '';
    let persisted = null;

    const metadataUserId = String(session.metadata?.clientUserId || '').trim();
    const metadataEmail = String(session.metadata?.clientUserEmail || '').trim().toLowerCase();
    const authEmail = String(auth.user.email || '').trim().toLowerCase();
    const customerEmail = String(session.customer_details?.email || session.metadata?.guestEmail || '')
      .trim()
      .toLowerCase();

    let ownershipMatches = false;
    if (metadataUserId) {
      ownershipMatches = metadataUserId === auth.user.id;
    } else if (metadataEmail) {
      ownershipMatches = metadataEmail === authEmail;
    } else if (customerEmail && authEmail) {
      ownershipMatches = customerEmail === authEmail;
    } else {
      return res.status(403).json({ error: 'Checkout session ownership metadata is missing.' });
    }

    if (!ownershipMatches) {
      return res.status(403).json({ error: 'You are not authorized to verify this checkout session.' });
    }

    if (session.payment_status === 'paid') {
      const metadata = session.metadata || {};
      const requiredMetadata = ['propertyId', 'guestEmail', 'checkinDate', 'checkoutDate'];
      const missingMetadata = requiredMetadata.filter((key) => !metadata[key]);

      if (missingMetadata.length > 0) {
        persisted = { saved: false, reason: 'missing_booking_metadata', missing: missingMetadata };
      } else {
        const record = mapWebhookMetadataToBookingRecord(metadata, {
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          paymentLast4: cardLast4 || null,
          paymentStatus: session.payment_status,
          bookingStatus: 'confirmed',
          customerReceiptEmail: session.customer_details?.email || metadata.guestEmail || null,
          statusNote: 'Confirmed by Stripe verify session fallback.',
        });

        delete record.stripe_refund_id;
        delete record.refund_status;
        delete record.refunded_at;
        delete record.cancelled_at;

        persisted = await upsertBookingTransactionAdmin(record);
      }
    }

    return res.status(200).json({
      paid: session.payment_status === 'paid',
      status: session.status,
      paymentStatus: session.payment_status,
      sessionId: session.id,
      paymentIntentId,
      customerName: session.customer_details?.name || session.metadata?.guestName || '',
      customerEmail: session.customer_details?.email || session.metadata?.guestEmail || '',
      cardLast4,
      persisted: persisted
        ? { saved: Boolean(persisted.saved), reason: persisted.reason || null, missing: persisted.missing || [] }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Stripe checkout session verification failed.',
    });
  }
}
