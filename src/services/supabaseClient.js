import { isSupabaseConfigured, supabase, SUPABASE_BUCKETS } from '../lib/supabase';
import { REMOTE_BOOKING_LIMIT } from '../lib/constants';
import { FEATURED_PROPERTIES } from '../data/siteData';

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

function normalizeListingPayload(listing) {
  const amenities = String(listing.facilitiesText || '')
    .split(',')
    .map((i) => i.trim())
    .filter(Boolean);
  const blockedDates = Array.isArray(listing.blockedDates)
    ? listing.blockedDates
    : String(listing.blockedDatesText || '')
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);
  return {
    ...listing,
    price: Number(listing.price) || 0,
    amenities: amenities.length ? amenities : listing.amenities || [],
    image: listing.image || listing.summaryImage || listing.thumbnail,
    summaryImage: listing.summaryImage || listing.image || listing.thumbnail,
    thumbnail: listing.thumbnail || listing.image || listing.summaryImage,
    videoUrl: listing.videoUrl || '',
    schedule: listing.schedule || '',
    publishStatus: listing.publishStatus || 'published',
    availabilityNotes: listing.availabilityNotes || '',
    blockedDates,
    blockedDatesText: blockedDates.join(', '),
    isDeleted: Boolean(listing.isDeleted),
    imageAsset: listing.imageAsset || null,
    summaryImageAsset: listing.summaryImageAsset || null,
    thumbnailAsset: listing.thumbnailAsset || null,
    videoAsset: listing.videoAsset || null,
  };
}

function mergeManagementListings(listings = []) {
  const listingMap = new Map(listings.map((l) => [l.id, normalizeListingPayload(l)]));
  const mergedDefaults = FEATURED_PROPERTIES.map((l) =>
    normalizeListingPayload({ ...l, ...(listingMap.get(l.id) || {}) }),
  ).filter((l) => !l.isDeleted);
  const extras = listings
    .filter((l) => !FEATURED_PROPERTIES.some((d) => d.id === l.id) && !l.isDeleted)
    .map((l) => normalizeListingPayload(l));
  return [...mergedDefaults, ...extras];
}

function fromRemoteManagementListing(record) {
  const defaults = FEATURED_PROPERTIES.find((l) => l.id === record.id) || FEATURED_PROPERTIES[0];
  return normalizeListingPayload({
    ...defaults,
    id: record.id,
    name: record.name ?? defaults.name,
    location: record.location ?? defaults.location,
    price: Number(record.price ?? defaults.price) || 0,
    ratingLabel: record.rating_label ?? defaults.ratingLabel,
    reviewCount: Number(record.review_count ?? defaults.reviewCount) || 0,
    badge: record.badge ?? defaults.badge,
    badgeIcon: record.badge_icon ?? defaults.badgeIcon,
    statusNote: record.status_note ?? defaults.statusNote,
    mood: record.mood ?? defaults.mood,
    bestFor: record.best_for ?? defaults.bestFor,
    image: record.image ?? defaults.image,
    summaryImage: record.summary_image ?? defaults.summaryImage,
    thumbnail: record.thumbnail ?? defaults.thumbnail,
    videoUrl: record.video_url ?? '',
    schedule: record.schedule ?? defaults.schedule,
    publishStatus: record.publish_status ?? 'published',
    availabilityNotes: record.availability_notes ?? '',
    blockedDates: Array.isArray(record.blocked_dates) ? record.blocked_dates : [],
    isDeleted: Boolean(record.is_deleted),
    amenities: Array.isArray(record.amenities) ? record.amenities : defaults.amenities,
    imageAsset: null,
    summaryImageAsset: null,
    thumbnailAsset: null,
    videoAsset: null,
  });
}

export async function fetchRemoteManagementListings() {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, listings: [] };
  }
  const { data, error } = await supabase.from('management_listings').select('*');
  if (error) return { saved: false, error, listings: [] };
  const listings = Array.isArray(data) ? data.map(fromRemoteManagementListing) : [];
  return { saved: true, error: null, listings: mergeManagementListings(listings) };
}

function mapRemoteBookingTransaction(record) {
  return {
    id: record.id,
    submittedAt: record.submitted_at,
    bookingStatus: record.booking_status || 'confirmed',
    paymentStatus: record.payment_status || 'paid',
    paymentProvider: record.payment_provider || 'manual',
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
