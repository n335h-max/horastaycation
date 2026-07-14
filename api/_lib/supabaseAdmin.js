function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function canUseSupabaseAdmin() {
  return Boolean(getSupabaseUrl() && getServiceRoleKey());
}

async function restFetch(path, init = {}) {
  const url = `${getSupabaseUrl().replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: getServiceRoleKey(),
      Authorization: `Bearer ${getServiceRoleKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Supabase admin request failed: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function fetchPublishedManagementListing(propertyId) {
  if (!canUseSupabaseAdmin()) {
    return null;
  }

  const id = String(propertyId || '').trim();
  if (!id) {
    return null;
  }

  // Price bookings against the same source the client uses
  // (store.managementListings <- Supabase management_listings), not a static
  // array. Only published, non-deleted listings are bookable.
  const query =
    `/rest/v1/management_listings` +
    `?id=eq.${encodeURIComponent(id)}` +
    `&publish_status=eq.published` +
    `&is_deleted=eq.false` +
    `&select=id,name,location,price,publish_status,is_deleted`;

  try {
    const data = await restFetch(query, { method: 'GET' });
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return row || null;
  } catch {
    return null;
  }
}

export function mapWebhookMetadataToBookingRecord(metadata = {}, defaults = {}) {
  return {
    property_id: metadata.propertyId || defaults.propertyId || '',
    property_name: metadata.propertyName || defaults.propertyName || '',
    property_location: metadata.propertyLocation || defaults.propertyLocation || '',
    guest_name: metadata.guestName || defaults.guestName || '',
    guest_email: metadata.guestEmail || defaults.guestEmail || '',
    guest_phone: metadata.guestPhone || defaults.guestPhone || '',
    guests: Number(metadata.guests || defaults.guests || 1),
    checkin_date: metadata.checkinDate || defaults.checkinDate || null,
    checkout_date: metadata.checkoutDate || defaults.checkoutDate || null,
    nights: Number(metadata.nights || defaults.nights || 1),
    subtotal: Number(metadata.subtotal || defaults.subtotal || 0),
    service_fee: Number(metadata.serviceFee || defaults.serviceFee || 0),
    total: Number(metadata.total || defaults.total || 0),
    special_requests: metadata.specialRequests || defaults.specialRequests || null,
    payment_last4: defaults.paymentLast4 || null,
    booking_status: defaults.bookingStatus || 'confirmed',
    payment_provider: 'stripe',
    payment_status: defaults.paymentStatus || 'paid',
    stripe_session_id: defaults.stripeSessionId || null,
    stripe_payment_intent_id: defaults.stripePaymentIntentId || null,
    stripe_refund_id: defaults.refundId || null,
    refund_status: defaults.refundStatus || null,
    refunded_at: defaults.refundedAt || null,
    cancelled_at: defaults.cancelledAt || null,
    customer_receipt_email: defaults.customerReceiptEmail || metadata.guestEmail || null,
    status_note: defaults.statusNote || null,
  };
}

export async function upsertBookingTransactionAdmin(record) {
  if (!canUseSupabaseAdmin()) {
    return { saved: false, reason: 'missing_supabase_admin_env' };
  }

  try {
    const data = await restFetch('/rest/v1/booking_transactions?on_conflict=stripe_session_id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([record]),
    });

    return { saved: true, data };
  } catch (error) {
    return {
      saved: false,
      reason: error instanceof Error ? error.message : 'supabase_admin_upsert_failed',
    };
  }
}

export async function updateBookingTransactionAdmin(matchField, matchValue, updates) {
  if (!canUseSupabaseAdmin()) {
    return { saved: false, reason: 'missing_supabase_admin_env' };
  }

  try {
    const query = `/rest/v1/booking_transactions?${encodeURIComponent(matchField)}=eq.${encodeURIComponent(matchValue)}`;
    const data = await restFetch(query, {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    });

    return { saved: true, data };
  } catch (error) {
    return {
      saved: false,
      reason: error instanceof Error ? error.message : 'supabase_admin_update_failed',
    };
  }
}

export async function hasProcessedStripeEvent(eventId) {
  if (!canUseSupabaseAdmin()) return false;

  try {
    const query = `/rest/v1/stripe_events?event_id=eq.${encodeURIComponent(eventId)}`;
    const data = await restFetch(query, { method: 'GET' });
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    return false;
  }
}

export async function recordProcessedStripeEvent(eventId, eventType = '') {
  if (!canUseSupabaseAdmin()) {
    return { recorded: false, reason: 'missing_supabase_admin_env' };
  }

  try {
    const payload = {
      event_id: eventId,
      event_type: eventType,
      processed_at: new Date().toISOString(),
    };
    const data = await restFetch('/rest/v1/stripe_events', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload]),
    });

    return { recorded: true, data };
  } catch (error) {
    return { recorded: false, reason: error instanceof Error ? error.message : 'stripe_event_record_failed' };
  }
}
