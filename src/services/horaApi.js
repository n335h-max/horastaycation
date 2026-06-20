import { FEATURED_PROPERTIES, INITIAL_BOOKINGS, INITIAL_EMAILS, RANDOM_GUEST_NAMES } from '../data/siteData';
import { getWishlistKey } from '../lib/guestFeatures';
import { readBookingDraft, readStorage, writeBookingDraft, writeStorage } from '../lib/storage';
import { isSupabaseConfigured, SUPABASE_BUCKETS, supabase } from '../lib/supabase';

export const initialBookingDraft = {
  property: 'villa-serena',
  checkin: '',
  checkout: '',
  guests: '2',
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  specialRequests: '',
};

const DEFAULT_STORE = {
  bookingDraft: initialBookingDraft,
  dashboardBookings: INITIAL_BOOKINGS,
  dashboardEmails: INITIAL_EMAILS,
  dashboardRevenue: 48290,
  ownerApplications: [],
  reviewSubmissions: [],
  bookingTransactions: [],
  managementListings: FEATURED_PROPERTIES,
  wishlistByUser: {},
  supportRequests: [],
  analyticsEvents: [],
  completedStripeSessions: [],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatBookingStatusLabel(status = 'confirmed') {
  return String(status || 'confirmed').replace(/[-_]/g, ' ').replace(/^\w/, (match) => match.toUpperCase());
}

function buildDashboardBooking(transaction) {
  return {
    guest: transaction.bookingForm.guestName || RANDOM_GUEST_NAMES[0],
    property: `${transaction.bookingSummary.name} — ${transaction.bookingSummary.nights} night${transaction.bookingSummary.nights > 1 ? 's' : ''}`,
    amount: transaction.bookingSummary.total,
    status: formatBookingStatusLabel(transaction.bookingStatus || 'confirmed'),
    image: `https://picsum.photos/seed/${encodeURIComponent(transaction.bookingForm.guestName || RANDOM_GUEST_NAMES[0])}/40/40.jpg`,
  };
}

function withDefaults(store) {
  return {
    ...clone(DEFAULT_STORE),
    ...store,
  };
}

function loadStore() {
  const store = withDefaults(readStorage(DEFAULT_STORE));
  store.bookingDraft = readBookingDraft(store.bookingDraft);
  return store;
}

function saveStore(store) {
  writeStorage(store);
  return store;
}

function refreshBookingDashboard(store) {
  store.dashboardBookings = store.bookingTransactions.slice(0, 6).map(buildDashboardBooking);
  store.dashboardRevenue = store.bookingTransactions.reduce(
    (total, transaction) => total + (transaction.paymentStatus === 'refunded' ? 0 : Number(transaction.bookingSummary.total) || 0),
    0,
  );

  return store;
}

function buildLegacyRemoteBookingPayload({ currentUser, bookingForm, bookingSummary, paymentForm, bookingStatus }) {
  return {
    client_user_id: currentUser?.id || null,
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
    payment_last4: paymentForm.cardLast4 || paymentForm.cardNumber?.replace(/\s/g, '').slice(-4) || null,
    booking_status: bookingStatus,
  };
}

function buildExtendedRemoteBookingPayload({
  currentUser,
  bookingForm,
  bookingSummary,
  paymentForm,
  paymentMeta,
  bookingStatus,
}) {
  return {
    ...buildLegacyRemoteBookingPayload({ currentUser, bookingForm, bookingSummary, paymentForm, bookingStatus }),
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

async function insertRemote(table, payload) {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null };
  }

  const { error } = await supabase.from(table).insert(payload);
  return { saved: !error, error };
}

async function upsertRemote(table, payload, onConflict = 'id') {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, data: null };
  }

  const { data, error } = await supabase
    .from(table)
    .upsert(payload, { onConflict })
    .select();

  return {
    saved: !error,
    error,
    data: data ?? null,
  };
}

async function updateRemote(table, payload, matchField, matchValue) {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, data: null };
  }

  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq(matchField, matchValue)
    .select();

  return {
    saved: !error,
    error,
    data: data ?? null,
  };
}

async function deleteRemote(table, matchField, matchValue) {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null };
  }

  const { error } = await supabase.from(table).delete().eq(matchField, matchValue);
  return { saved: !error, error };
}

async function getAuthenticatedUser() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user || null;
}

function sanitizeStorageSegment(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'upload';
}

function getFileExtension(file) {
  const match = file.name.match(/(\.[a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

async function uploadListingMediaFile(listingId, fieldName, file) {
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

  if (error) {
    return { uploaded: false, error, url: '' };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return {
    uploaded: true,
    error: null,
    url: data.publicUrl,
    bucket,
    path: filePath,
  };
}

function delay(ms = 120) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function getSnapshot() {
  return loadStore();
}

function normalizeListingPayload(listing) {
  const amenities = String(listing.facilitiesText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const blockedDates = Array.isArray(listing.blockedDates)
    ? listing.blockedDates
    : String(listing.blockedDatesText || '')
        .split(',')
        .map((item) => item.trim())
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
  const listingMap = new Map(listings.map((listing) => [listing.id, normalizeListingPayload(listing)]));
  const mergedDefaults = FEATURED_PROPERTIES.map((listing) =>
    normalizeListingPayload({ ...listing, ...(listingMap.get(listing.id) || {}) }),
  ).filter((listing) => !listing.isDeleted);
  const extraListings = listings
    .filter(
      (listing) =>
        !FEATURED_PROPERTIES.some((defaultListing) => defaultListing.id === listing.id) && !listing.isDeleted,
    )
    .map((listing) => normalizeListingPayload(listing));

  return [...mergedDefaults, ...extraListings];
}

function toRemoteManagementListing(listing) {
  return {
    id: listing.id,
    name: listing.name,
    location: listing.location,
    price: Number(listing.price) || 0,
    rating_label: listing.ratingLabel || '5.0',
    review_count: Number(listing.reviewCount) || 0,
    badge: listing.badge || 'Featured Stay',
    badge_icon: listing.badgeIcon || 'star',
    status_note: listing.statusNote || '',
    mood: listing.mood || '',
    best_for: listing.bestFor || '',
    image: listing.image || '',
    summary_image: listing.summaryImage || '',
    thumbnail: listing.thumbnail || '',
    video_url: listing.videoUrl || '',
    schedule: listing.schedule || '',
    publish_status: listing.publishStatus || 'published',
    availability_notes: listing.availabilityNotes || '',
    blocked_dates: Array.isArray(listing.blockedDates) ? listing.blockedDates : [],
    is_deleted: Boolean(listing.isDeleted),
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    updated_by: listing.updatedBy || null,
    updated_at: new Date().toISOString(),
  };
}

function fromRemoteManagementListing(record) {
  const defaults = FEATURED_PROPERTIES.find((listing) => listing.id === record.id) || FEATURED_PROPERTIES[0];

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

async function fetchRemoteManagementListings() {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, listings: [] };
  }

  const { data, error } = await supabase.from('management_listings').select('*');

  if (error) {
    return { saved: false, error, listings: [] };
  }

  const listings = Array.isArray(data) ? data.map(fromRemoteManagementListing) : [];
  return {
    saved: true,
    error: null,
    listings: mergeManagementListings(listings),
  };
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

async function fetchRemoteBookingTransactions() {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null, transactions: [] };
  }

  const { data, error } = await supabase
    .from('booking_transactions')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(20);

  if (error) {
    return { saved: false, error, transactions: [] };
  }

  return {
    saved: true,
    error: null,
    transactions: Array.isArray(data) ? data.map(mapRemoteBookingTransaction) : [],
  };
}

export async function syncRemoteData(options = {}) {
  const { includeBookings = true, includeListings = true } = options;
  const store = loadStore();
  const [remoteListings, remoteBookings] = await Promise.all([
    includeListings ? fetchRemoteManagementListings() : Promise.resolve({ saved: false, error: null, listings: [] }),
    includeBookings ? fetchRemoteBookingTransactions() : Promise.resolve({ saved: false, error: null, transactions: [] }),
  ]);

  if (includeListings && remoteListings.saved && remoteListings.listings.length) {
    store.managementListings = remoteListings.listings;
  }

  if (includeBookings && remoteBookings.saved) {
    store.bookingTransactions = remoteBookings.transactions;
    refreshBookingDashboard(store);
  }

  saveStore(store);

  return {
    store,
    remote: {
      listings: remoteListings,
      bookings: remoteBookings,
    },
  };
}

export async function saveBookingDraft(draft) {
  writeBookingDraft(draft);
  await delay();
  return draft;
}

export async function toggleWishlistProperty({ authUser, propertyId }) {
  const store = loadStore();
  const wishlistKey = getWishlistKey(authUser);
  const currentWishlist = Array.isArray(store.wishlistByUser[wishlistKey]) ? store.wishlistByUser[wishlistKey] : [];
  const alreadySaved = currentWishlist.includes(propertyId);

  store.wishlistByUser = {
    ...store.wishlistByUser,
    [wishlistKey]: alreadySaved
      ? currentWishlist.filter((id) => id !== propertyId)
      : [...currentWishlist, propertyId],
  };

  saveStore(store);
  await delay();

  return {
    store,
    saved: !alreadySaved,
    wishlist: store.wishlistByUser[wishlistKey],
  };
}

export async function submitSupportRequest(request) {
  const store = loadStore();
  const record = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    ...request,
  };

  store.supportRequests = [record, ...store.supportRequests].slice(0, 50);
  store.dashboardEmails = [
    { title: 'New Support Request', detail: `${request.topic} · ${request.email || 'guest message'}`, tone: 'indigo' },
    ...store.dashboardEmails,
  ].slice(0, 6);

  saveStore(store);
  await delay();

  return {
    store,
    request: record,
  };
}

export async function trackAnalyticsEvent(event) {
  const store = loadStore();
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...event,
  };

  store.analyticsEvents = [record, ...store.analyticsEvents].slice(0, 250);
  saveStore(store);
  await delay(40);

  return {
    store,
    event: record,
  };
}

export async function saveManagementListing(listingInput) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const mediaFiles = listingInput.mediaFiles || {};
  const listing = normalizeListingPayload(listingInput);
  const uploadFields = Object.entries(mediaFiles).filter(([, file]) => file instanceof File);
  const uploadResults = await Promise.all(
    uploadFields.map(([fieldName, file]) => uploadListingMediaFile(listing.id, fieldName, file)),
  );

  const remoteListing = { ...listing };

  uploadFields.forEach(([fieldName], index) => {
    const result = uploadResults[index];

    if (!result?.uploaded || !result.url) {
      return;
    }

    if (fieldName === 'image') {
      remoteListing.image = result.url;
      remoteListing.imageAsset = null;
    }

    if (fieldName === 'summaryImage') {
      remoteListing.summaryImage = result.url;
      remoteListing.summaryImageAsset = null;
    }

    if (fieldName === 'thumbnail') {
      remoteListing.thumbnail = result.url;
      remoteListing.thumbnailAsset = null;
    }

    if (fieldName === 'videoUrl') {
      remoteListing.videoUrl = result.url;
      remoteListing.videoAsset = null;
    }
  });

  remoteListing.updatedBy = currentUser?.id || null;

  const remote = await upsertRemote('management_listings', toRemoteManagementListing(remoteListing));
  const savedListing = remote.saved && remote.data?.[0]
    ? fromRemoteManagementListing(remote.data[0])
    : remoteListing;

  store.managementListings = mergeManagementListings(
    store.managementListings.some((item) => item.id === savedListing.id)
      ? store.managementListings.map((item) => (item.id === savedListing.id ? { ...item, ...savedListing } : item))
      : [...store.managementListings, savedListing],
  );
  store.dashboardEmails = [
    { title: 'Listing Updated — Management', detail: `Saved for ${savedListing.name}`, tone: 'accent' },
    ...store.dashboardEmails,
  ].slice(0, 6);
  saveStore(store);
  await delay();
  return {
    store,
    remote: {
      saved: remote.saved,
      error: remote.error,
      uploadedMediaCount: uploadResults.filter((result) => result?.uploaded).length,
      attemptedMediaCount: uploadResults.length,
    },
  };
}

export async function deleteManagementListing(listingId) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const existingListing = store.managementListings.find((listing) => listing.id === listingId);

  if (!existingListing) {
    return { store, remote: { saved: false, error: null } };
  }

  const isDefaultListing = FEATURED_PROPERTIES.some((listing) => listing.id === listingId);
  const remote = isDefaultListing
    ? await upsertRemote(
        'management_listings',
        toRemoteManagementListing({ ...existingListing, isDeleted: true, updatedBy: currentUser?.id || null }),
      )
    : await upsertRemote(
        'management_listings',
        toRemoteManagementListing({ ...existingListing, isDeleted: true, updatedBy: currentUser?.id || null }),
      );

  store.managementListings = mergeManagementListings(
    store.managementListings
      .map((listing) => (listing.id === listingId ? { ...listing, isDeleted: true } : listing))
      .filter((listing) => listing.id !== listingId || isDefaultListing),
  );
  store.dashboardEmails = [
    { title: 'Listing Deleted — Management', detail: `Removed ${existingListing.name}`, tone: 'accent' },
    ...store.dashboardEmails,
  ].slice(0, 6);
  saveStore(store);
  await delay();

  return { store, remote };
}

export async function updateBookingTransactionStatus(bookingId, bookingStatus) {
  const store = loadStore();
  store.bookingTransactions = store.bookingTransactions.map((transaction) =>
    transaction.id === bookingId ? { ...transaction, bookingStatus } : transaction,
  );
  refreshBookingDashboard(store);
  saveStore(store);

  const remote = await updateRemote('booking_transactions', { booking_status: bookingStatus }, 'id', bookingId);
  await delay();

  return { store, remote };
}

export async function updateBookingTransactionDetails(bookingId, updates = {}) {
  const store = loadStore();
  const nextUpdates = { ...updates };

  store.bookingTransactions = store.bookingTransactions.map((transaction) =>
    transaction.id === bookingId ? { ...transaction, ...nextUpdates } : transaction,
  );
  refreshBookingDashboard(store);

  if (nextUpdates.customerReceiptEmail || nextUpdates.statusNote) {
    store.dashboardEmails = [
      {
        title: 'Booking Payment Update',
        detail: nextUpdates.customerReceiptEmail || nextUpdates.statusNote || `Updated ${bookingId}`,
        tone: 'indigo',
      },
      ...store.dashboardEmails,
    ].slice(0, 6);
  }

  saveStore(store);

  const extendedRemotePayload = {
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
  const compactExtendedPayload = Object.fromEntries(
    Object.entries(extendedRemotePayload).filter(([, value]) => typeof value !== 'undefined'),
  );

  let remote = await updateRemote('booking_transactions', compactExtendedPayload, 'id', bookingId);

  if (!remote.saved && typeof nextUpdates.bookingStatus !== 'undefined') {
    remote = await updateRemote('booking_transactions', { booking_status: nextUpdates.bookingStatus }, 'id', bookingId);
  }

  await delay();
  return { store, remote };
}

export async function submitOwnerApplication(application) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const record = { id: crypto.randomUUID(), submittedAt: new Date().toISOString(), ...application };
  store.ownerApplications = [
    record,
    ...store.ownerApplications,
  ];
  store.dashboardEmails = [
    { title: 'New Owner Lead', detail: `Sent for ${application.ownerEmail}`, tone: 'brand' },
    ...store.dashboardEmails,
  ].slice(0, 6);
  saveStore(store);
  const ownerNameParts = application.ownerName.trim().split(/\s+/);
  const nightlyBudget = Number.parseFloat(String(application.budget).replace(/[^\d.]/g, ''));
  const remote = await insertRemote('owner_applications', {
    owner_user_id: currentUser?.id || null,
    owner_first_name: ownerNameParts[0] || application.ownerName,
    owner_last_name: ownerNameParts.slice(1).join(' ') || 'Owner',
    owner_email: application.ownerEmail,
    owner_phone: '',
    property_name: 'Build / Refurbish Request',
    property_type: 'Owner Lead',
    property_location: application.ownerAddress,
    property_description: `Requested ${application.unitCount} unit(s). Budget: ${application.budget}.`,
    price_per_night: Number.isFinite(nightlyBudget) && nightlyBudget > 0 ? nightlyBudget : 1,
    max_guests: application.unitCount,
    amenities: [`Budget ${application.budget}`],
  });
  await delay();
  return { store, remote };
}

export async function submitReview(review) {
  const store = loadStore();
  const record = { id: crypto.randomUUID(), submittedAt: new Date().toISOString(), ...review };
  store.reviewSubmissions = [
    record,
    ...store.reviewSubmissions,
  ];
  store.dashboardEmails = [
    { title: 'New Evaluation Request', detail: `Sent for ${review.evaluatorEmail}`, tone: 'brand' },
    ...store.dashboardEmails,
  ].slice(0, 6);
  saveStore(store);
  const remote = await insertRemote('review_submissions', {
    review_property: 'Evaluation With Us',
    reviewer_name: review.evaluatorName,
    stay_date: new Date().toISOString().slice(0, 7),
    rating: 5,
    cleanliness: `Units ${review.unitCount}`,
    location: review.evaluatorAddress,
    amenities: 'Exclusive partnership confirmed',
    value: 'Pending review',
    review_text: `Evaluation request from ${review.evaluatorName}. Email: ${review.evaluatorEmail}. Address: ${review.evaluatorAddress}. Units: ${review.unitCount}.`,
  });
  await delay();
  return { store, remote };
}

export async function submitBooking({ bookingForm, bookingSummary, paymentForm = {}, paymentMeta = {} }) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const guest = bookingForm.guestName || RANDOM_GUEST_NAMES[0];
  const stripeSessionId = paymentMeta.stripeSessionId || '';
  const bookingStatus = paymentMeta.bookingStatus || 'confirmed';
  const paymentStatus = paymentMeta.paymentStatus || 'paid';
  const statusNote = paymentMeta.statusNote || '';
  const customerReceiptEmail = paymentMeta.customerReceiptEmail || bookingForm.guestEmail || '';

  if (stripeSessionId && store.completedStripeSessions.includes(stripeSessionId)) {
    return {
      store,
      remote: { saved: true, error: null, alreadyProcessed: true },
    };
  }

  store.bookingTransactions = [
    {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      bookingStatus,
      paymentStatus,
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
      paymentLast4: paymentForm.cardLast4 || paymentForm.cardNumber?.replace(/\s/g, '').slice(-4) || '',
    },
    ...store.bookingTransactions,
  ];

  store.dashboardBookings = [
    {
      guest,
      property: `${bookingSummary.name} — ${bookingSummary.nights} night${bookingSummary.nights > 1 ? 's' : ''}`,
      amount: bookingSummary.total,
      status: formatBookingStatusLabel(bookingStatus),
      image: `https://picsum.photos/seed/${encodeURIComponent(guest)}/40/40.jpg`,
    },
    ...store.dashboardBookings,
  ].slice(0, 6);

  store.dashboardEmails = [
    { title: 'Booking Confirmed — Customer', detail: `Sent to ${customerReceiptEmail}`, tone: 'indigo' },
    { title: 'New Booking Alert — Owner', detail: `Sent for ${bookingSummary.name}`, tone: 'brand' },
    { title: 'New Booking Alert — Management', detail: 'Sent to admin@horastaycation.com', tone: 'accent' },
    ...store.dashboardEmails,
  ].slice(0, 6);

  store.dashboardRevenue += bookingSummary.total;
  store.bookingDraft = clone(initialBookingDraft);
  if (stripeSessionId) {
    store.completedStripeSessions = [...store.completedStripeSessions, stripeSessionId];
  }
  saveStore(store);
  let remote = await insertRemote(
    'booking_transactions',
    buildExtendedRemoteBookingPayload({
      currentUser,
      bookingForm,
      bookingSummary,
      paymentForm,
      paymentMeta: {
        ...paymentMeta,
        paymentStatus,
        bookingStatus,
        customerReceiptEmail,
        statusNote,
      },
      bookingStatus,
    }),
  );

  if (!remote.saved) {
    remote = await insertRemote(
      'booking_transactions',
      buildLegacyRemoteBookingPayload({
        currentUser,
        bookingForm,
        bookingSummary,
        paymentForm,
        bookingStatus,
      }),
    );
  }
  await delay();
  return { store, remote };
}

export async function loginManagement(credentials) {
  await delay();
  return {
    user: {
      email: credentials.mgmtEmail,
      role: 'management',
    },
    store: loadStore(),
  };
}
