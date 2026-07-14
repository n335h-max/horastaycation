import { isSupabaseConfigured, supabase, SUPABASE_BUCKETS } from '../lib/supabase';
import { REMOTE_BOOKING_LIMIT } from '../lib/constants';
import { fromRemoteManagementListing, mergeManagementListings, normalizeListingPayload } from './listingMapper';

// ── Application mappers (owner leads + evaluation requests) ──

function joinName(first, last, fallback) {
  const combined = `${String(first || '').trim()} ${String(last || '').trim()}`.trim();
  return combined || String(fallback || '').trim() || '';
}

// Legacy evaluation requests stored email/units inside review_text/cleanliness.
// Prefer the real columns; fall back to parsing the crammed text for rows
// submitted before the contact_phone/evaluator_email/unit_count columns existed.
function parseLegacyReviewValue(reviewText, key) {
  const match = String(reviewText || '').match(new RegExp(`${key}:\\s*(\\S+)`));
  return match ? match[1].replace(/[.]+$/, '').trim() : '';
}

export function mapRemoteReviewSubmission(record) {
  const unitCount =
    String(record?.unit_count || '').trim() ||
    String(record?.cleanliness || '').replace(/^units\s*/i, '').trim();

  return {
    id: record?.id,
    submittedAt: record?.submitted_at,
    evaluatorName: String(record?.reviewer_name || '').trim(),
    evaluatorEmail:
      String(record?.evaluator_email || '').trim() ||
      parseLegacyReviewValue(record?.review_text, 'Email'),
    evaluatorPhone: String(record?.contact_phone || '').trim(),
    evaluatorAddress:
      String(record?.evaluator_address || '').trim() ||
      String(record?.location || '').trim(),
    unitCount,
    ownerUserId: record?.owner_user_id || null,
    approved: Boolean(record?.approved),
    approvedAt: record?.approved_at || null,
  };
}

export function mapRemoteOwnerApplication(record) {
  return {
    id: record?.id,
    submittedAt: record?.submitted_at,
    ownerName: joinName(record?.owner_first_name, record?.owner_last_name, record?.owner_first_name),
    ownerEmail: String(record?.owner_email || '').trim(),
    ownerPhone: String(record?.owner_phone || '').trim(),
    ownerAddress: String(record?.property_location || '').trim(),
    unitCount: String(record?.max_guests ?? '').toString(),
    budget: String(record?.budget || '').trim(),
    ownerUserId: record?.owner_user_id || null,
    approved: Boolean(record?.approved),
    approvedAt: record?.approved_at || null,
  };
}

// ── Auth ──

export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user || null;
}

// ── CRUD helpers ──

export async function insertRemote(table, payload) {
  if (!isSupabaseConfigured || !supabase) return { saved: false, error: null };
  const { error } = await supabase.from(table).insert(payload);
  return { saved: !error, error };
}

export async function upsertRemote(table, payload, onConflict = 'id') {
  if (!isSupabaseConfigured || !supabase) return { saved: false, error: null, data: null };
  const { data, error } = await supabase.from(table).upsert(payload, { onConflict }).select();
  return { saved: !error, error, data: data ?? null };
}

export async function updateRemote(table, payload, matchField, matchValue) {
  if (!isSupabaseConfigured || !supabase) return { saved: false, error: null, data: null };
  const { data, error } = await supabase.from(table).update(payload).eq(matchField, matchValue).select();
  return { saved: !error, error, data: data ?? null };
}

export async function deleteRemote(table, matchField, matchValue) {
  if (!isSupabaseConfigured || !supabase) return { saved: false, error: null };
  const { error } = await supabase.from(table).delete().eq(matchField, matchValue);
  return { saved: !error, error };
}

// ── Media upload ──

function sanitizeStorageSegment(value) {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'upload'
  );
}

function getFileExtension(file) {
  const match = file.name.match(/(\.[a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

export async function uploadListingMediaFile(listingId, fieldName, file) {
  if (!isSupabaseConfigured || !supabase || !(file instanceof File)) {
    return { uploaded: false, error: null, url: '' };
  }

  const bucket = fieldName === 'videoUrl' ? SUPABASE_BUCKETS.listingVideos : SUPABASE_BUCKETS.listingImages;
  const filePath = [
    'listings',
    sanitizeStorageSegment(listingId),
    `${sanitizeStorageSegment(fieldName)}-${Date.now()}-${sanitizeStorageSegment(file.name.replace(/\.[^.]+$/, ''))}${getFileExtension(file)}`,
  ].join('/');

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) return { uploaded: false, error, url: '' };

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return { uploaded: true, error: null, url: data.publicUrl, bucket, path: filePath };
}

// ── Listing sync helpers ──


export async function fetchRemoteManagementListings() {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, listings: [] };
  }
  const { data, error } = await supabase.from('management_listings').select('*');
  if (error) return { saved: false, error, listings: [] };
  const listings = Array.isArray(data) ? data.map(fromRemoteManagementListing) : [];
  return { saved: true, error: null, listings: mergeManagementListings(listings) };
}

export function mapRemoteBookingTransaction(record) {
  return {
    id: record.id,
    submittedAt: record.submitted_at,
    bookingStatus: record.booking_status || 'confirmed',
    paymentStatus: record.payment_status || 'paid',
    paymentProvider: record.payment_provider || 'manual',
    ownerId: record.owner_id || null,
    stripeSessionId: record.stripe_session_id || '',
    stripePaymentIntentId: record.stripe_payment_intent_id || '',
    refundId: record.stripe_refund_id || '',
    refundStatus: record.refund_status || '',
    refundedAt: record.refunded_at || '',
    cancelledAt: record.cancelled_at || '',
    customerReceiptEmail: record.customer_receipt_email || record.guest_email || '',
    statusNote: record.status_note || '',
    paymentLast4: record.payment_last4 || '',
    bookingForm: {
      property: record.property_id,
      checkin: record.checkin_date,
      checkout: record.checkout_date,
      guests: String(record.guests),
      guestName: record.guest_name,
      guestEmail: record.guest_email,
      guestPhone: record.guest_phone || '',
      specialRequests: record.special_requests || '',
    },
    bookingSummary: {
      name: record.property_name,
      location: record.property_location,
      nights: record.nights,
      subtotal: Number(record.subtotal) || 0,
      serviceFee: Number(record.service_fee) || 0,
      total: Number(record.total) || 0,
    },
  };
}

export async function fetchRemoteBookingTransactions() {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, transactions: [] };
  }
  const { data, error } = await supabase
    .from('booking_transactions')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(REMOTE_BOOKING_LIMIT);
  if (error) return { saved: false, error, transactions: [] };
  return {
    saved: true,
    error: null,
    transactions: Array.isArray(data) ? data.map(mapRemoteBookingTransaction) : [],
  };
}

export async function fetchRemoteOwnerApplications() {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, applications: [] };
  }
  const { data, error } = await supabase
    .from('owner_applications')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(REMOTE_BOOKING_LIMIT);
  if (error) return { saved: false, error, applications: [] };
  return {
    saved: true,
    error: null,
    applications: Array.isArray(data) ? data.map(mapRemoteOwnerApplication) : [],
  };
}

export async function fetchRemoteReviewSubmissions() {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, submissions: [] };
  }
  const { data, error } = await supabase
    .from('review_submissions')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(REMOTE_BOOKING_LIMIT);
  if (error) return { saved: false, error, submissions: [] };
  return {
    saved: true,
    error: null,
    submissions: Array.isArray(data) ? data.map(mapRemoteReviewSubmission) : [],
  };
}
