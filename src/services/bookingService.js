import { loadStore, saveStore, clone, initialBookingDraft } from './localStore';
import { getAuthenticatedUser, insertRemote, updateRemote } from './supabaseClient';
import { MAX_DASHBOARD_PREVIEW_ITEMS } from '../lib/constants';
import { sendBookingConfirmation, sendManagementBookingAlert, sendOwnerBookingAlert } from './emailService';
import { logger } from '../lib/logger';

function formatBookingStatusLabel(status = 'confirmed') {
  return String(status)
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (m) => m.toUpperCase());
}

function refreshBookingDashboard(store) {
  store.dashboardBookings = store.bookingTransactions.slice(0, MAX_DASHBOARD_PREVIEW_ITEMS).map((tx) => ({
    guest: tx.bookingForm.guestName || 'Guest',
    property: `${tx.bookingSummary.name} — ${tx.bookingSummary.nights} night${tx.bookingSummary.nights > 1 ? 's' : ''}`,
    amount: tx.bookingSummary.total,
    status: formatBookingStatusLabel(tx.bookingStatus || 'confirmed'),
    image: '',
  }));
  store.dashboardRevenue = store.bookingTransactions.reduce((total, tx) => {
    if (tx.paymentStatus === 'refunded' || tx.paymentStatus === 'failed') return total;
    return total + (Number(tx.bookingSummary?.total) || 0);
  }, 0);
  return store;
}

function buildLegacyRemoteBookingPayload({ currentUser, bookingForm, bookingSummary, paymentForm }) {
  return {
    client_user_id: currentUser?.id || null,
    owner_id: bookingSummary.ownerId || null,
    property_id: bookingForm.property,
    property_name: bookingSummary.name,
    property_location: bookingSummary.location,
    guest_name: bookingForm.guestName,
    guest_email: bookingForm.guestEmail,
    guest_phone: bookingForm.guestPhone,
    guests: Number(bookingForm.guests),
    checkin_date: bookingForm.checkin,
    checkout_date: bookingForm.checkout,
    nights: bookingSummary.nights,
    subtotal: bookingSummary.subtotal,
    service_fee: bookingSummary.serviceFee,
    total: bookingSummary.total,
    special_requests: bookingForm.specialRequests || null,
    payment_last4: paymentForm.cardLast4 || null,
    booking_status: 'confirmed',
  };
}

function buildExtendedRemoteBookingPayload({ currentUser, bookingForm, bookingSummary, paymentForm, paymentMeta }) {
  return {
    ...buildLegacyRemoteBookingPayload({ currentUser, bookingForm, bookingSummary, paymentForm }),
    payment_provider: paymentMeta.provider || 'manual',
    payment_status: paymentMeta.paymentStatus || 'paid',
    stripe_session_id: paymentMeta.stripeSessionId || null,
    stripe_payment_intent_id: paymentMeta.stripePaymentIntentId || null,
    stripe_refund_id: paymentMeta.refundId || null,
    refund_status: paymentMeta.refundStatus || null,
    refunded_at: paymentMeta.refundedAt || null,
    cancelled_at: paymentMeta.cancelledAt || null,
    customer_receipt_email: paymentMeta.customerReceiptEmail || bookingForm.guestEmail || null,
    status_note: paymentMeta.statusNote || null,
  };
}

export async function submitBooking({ bookingForm, bookingSummary, paymentForm = {}, paymentMeta = {} }) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const guest = bookingForm.guestName || 'Guest';
  const stripeSessionId = paymentMeta.stripeSessionId || '';
  const bookingStatus = paymentMeta.bookingStatus || 'confirmed';
  const paymentStatus = paymentMeta.paymentStatus || 'paid';
  const statusNote = paymentMeta.statusNote || '';
  const customerReceiptEmail = paymentMeta.customerReceiptEmail || bookingForm.guestEmail || '';
  // Owner is identified by id, not email. The owner's current email is resolved
  // server-side when notifications are sent (single source of truth).
  const ownerId = bookingSummary.ownerId || bookingForm.ownerId || null;

  if (stripeSessionId && store.completedStripeSessions.includes(stripeSessionId)) {
    return { store, remote: { saved: true, error: null, alreadyProcessed: true } };
  }

  store.bookingTransactions = [
    {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      bookingStatus,
      paymentStatus,
      ownerId: bookingSummary.ownerId || null,
      bookingForm,
      bookingSummary,
      paymentProvider: paymentMeta.provider || 'manual',
      stripeSessionId,
      stripePaymentIntentId: paymentMeta.stripePaymentIntentId || '',
      refundId: paymentMeta.refundId || '',
      refundStatus: paymentMeta.refundStatus || '',
      refundedAt: paymentMeta.refundedAt || '',
      cancelledAt: paymentMeta.cancelledAt || '',
      customerReceiptEmail,
      statusNote,
      paymentLast4: paymentForm.cardLast4 || '',
    },
    ...store.bookingTransactions,
  ];

  store.dashboardBookings = [
    {
      guest,
      property: `${bookingSummary.name} — ${bookingSummary.nights} night${bookingSummary.nights > 1 ? 's' : ''}`,
      amount: bookingSummary.total,
      status: formatBookingStatusLabel(bookingStatus),
      image: '',
    },
    ...store.dashboardBookings,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);

  store.dashboardEmails = [
    { title: 'Booking Confirmed — Customer', detail: `Sent to ${customerReceiptEmail}`, tone: 'indigo' },
    ...(ownerId
      ? [{ title: 'New Booking Alert — Owner', detail: 'Sent to staycation owner', tone: 'brand' }]
      : []),
    { title: 'New Booking Alert — Management', detail: 'Sent to management inbox', tone: 'accent' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);

  // Derive revenue deterministically so refreshes and realtime Supabase hooks
  // don't double-count (replaces the former `store.dashboardRevenue += total`).
  refreshBookingDashboard(store);
  store.bookingDraft = clone(initialBookingDraft);
  if (stripeSessionId) store.completedStripeSessions = [...store.completedStripeSessions, stripeSessionId];
  saveStore(store);

  let remote = await insertRemote(
    'booking_transactions',
    buildExtendedRemoteBookingPayload({
      currentUser,
      bookingForm,
      bookingSummary,
      paymentForm,
      paymentMeta: { ...paymentMeta, paymentStatus, bookingStatus, customerReceiptEmail, statusNote },
    }),
  );
  if (!remote.saved) {
    remote = await insertRemote(
      'booking_transactions',
      buildLegacyRemoteBookingPayload({ currentUser, bookingForm, bookingSummary, paymentForm }),
    );
  }

  const isStripeFlow = paymentMeta.provider === 'stripe' || Boolean(stripeSessionId);
  if (!isStripeFlow) {
    // Send emails via Resend (fire-and-forget — non-blocking)
    const emailData = {
      guestName: bookingForm.guestName || 'Guest',
      guestEmail: customerReceiptEmail,
      guestPhone: bookingForm.guestPhone || '',
      propertyName: bookingSummary.name || 'Property',
      propertyLocation: bookingSummary.location || '',
      checkinDate: bookingForm.checkin || '',
      checkoutDate: bookingForm.checkout || '',
      guests: String(bookingForm.guests || '1'),
      nights: String(bookingSummary.nights || '1'),
      subtotal: String(bookingSummary.subtotal || '0'),
      serviceFee: String(bookingSummary.serviceFee || '0'),
      total: String(bookingSummary.total || '0'),
      statusNote: statusNote || 'Booking confirmed.',
      bookingId: store.bookingTransactions[0]?.id || '',
    };

    if (customerReceiptEmail) {
      sendBookingConfirmation(emailData).catch((err) =>
        logger.warn('Failed to send booking confirmation email:', err),
      );
    }

    if (ownerId) {
      sendOwnerBookingAlert(emailData, ownerId).catch((err) =>
        logger.warn('Failed to send owner booking alert:', err),
      );
    }

    sendManagementBookingAlert(emailData).catch((err) =>
      logger.warn('Failed to send management booking alert:', err),
    );
  }

  return { store, remote };
}

export async function updateBookingTransactionStatus(bookingId, bookingStatus) {
  const store = loadStore();
  store.bookingTransactions = store.bookingTransactions.map((t) => (t.id === bookingId ? { ...t, bookingStatus } : t));
  refreshBookingDashboard(store);
  saveStore(store);
  const remote = await updateRemote('booking_transactions', { booking_status: bookingStatus }, 'id', bookingId);
  return { store, remote };
}

export async function updateBookingTransactionDetails(bookingId, updates = {}) {
  const store = loadStore();
  const nextUpdates = { ...updates };
  store.bookingTransactions = store.bookingTransactions.map((t) => (t.id === bookingId ? { ...t, ...nextUpdates } : t));
  refreshBookingDashboard(store);

  if (nextUpdates.customerReceiptEmail || nextUpdates.statusNote) {
    store.dashboardEmails = [
      {
        title: 'Booking Payment Update',
        detail: nextUpdates.customerReceiptEmail || nextUpdates.statusNote || `Updated ${bookingId}`,
        tone: 'indigo',
      },
      ...store.dashboardEmails,
    ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  }
  saveStore(store);

  const extendedPayload = {
    booking_status: nextUpdates.bookingStatus,
    payment_status: nextUpdates.paymentStatus,
    stripe_session_id: nextUpdates.stripeSessionId,
    stripe_payment_intent_id: nextUpdates.stripePaymentIntentId,
    stripe_refund_id: nextUpdates.refundId,
    refund_status: nextUpdates.refundStatus,
    refunded_at: nextUpdates.refundedAt,
    cancelled_at: nextUpdates.cancelledAt,
    customer_receipt_email: nextUpdates.customerReceiptEmail,
    status_note: nextUpdates.statusNote,
    payment_provider: nextUpdates.paymentProvider,
    payment_last4: nextUpdates.paymentLast4,
  };
  const compact = Object.fromEntries(Object.entries(extendedPayload).filter(([, v]) => typeof v !== 'undefined'));
  let remote = await updateRemote('booking_transactions', compact, 'id', bookingId);
  if (!remote.saved && typeof nextUpdates.bookingStatus !== 'undefined') {
    remote = await updateRemote('booking_transactions', { booking_status: nextUpdates.bookingStatus }, 'id', bookingId);
  }
  return { store, remote };
}
