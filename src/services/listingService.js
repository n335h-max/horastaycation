
import { loadStore, saveStore } from './localStore';
import { fromRemoteManagementListing, mergeManagementListings, normalizeListingPayload } from './listingMapper';
import {
  getAuthenticatedUser,
  upsertRemote,
  fetchRemoteManagementListings,
  fetchRemoteBookingTransactions,
  fetchRemoteOwnerApplications,
  fetchRemoteReviewSubmissions,
  uploadListingMediaFile,
} from './supabaseClient';
import { MAX_DASHBOARD_PREVIEW_ITEMS } from '../lib/constants';

export function toRemoteManagementListing(listing) {
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
    owner_id: listing.ownerId || null,
    owner_email: listing.ownerEmail || '',
    updated_by: listing.updatedBy || null,
    updated_at: new Date().toISOString(),
  };
}

function applicationNaturalKey(item) {
  return `${String(item?.ownerEmail || item?.evaluatorEmail || '').toLowerCase()}|${String(
    item?.ownerName || item?.evaluatorName || '',
  ).toLowerCase()}`;
}

// Remote is authoritative for contact info; preserve local-only records (e.g.
// a submit whose insert hasn't synced yet) and any locally-recorded approval
// state. Legacy rows submitted before client ids were synced have
// DB-generated ids that differ from the local copy — dedupe by natural key so
// they don't render twice.
export function mergeApplications(localItems = [], remoteItems = []) {
  const remoteIds = new Set(remoteItems.map((item) => item.id));
  const localApprovedById = new Map(
    localItems.filter((item) => item.approved).map((item) => [item.id, true]),
  );
  // Legacy rows submitted before client ids were synced have DB-generated ids
  // that differ from the local copy, so also key local approval by natural key.
  const localApprovedByNaturalKey = new Map(
    localItems.filter((item) => item.approved).map((item) => [applicationNaturalKey(item), true]),
  );
  const mergedRemote = remoteItems.map((item) => ({
    ...item,
    approved:
      Boolean(item.approved) ||
      localApprovedById.has(item.id) ||
      localApprovedByNaturalKey.has(applicationNaturalKey(item)),
  }));
  const naturalKeys = new Set(mergedRemote.map(applicationNaturalKey));
  const localOnly = localItems.filter(
    (item) => !remoteIds.has(item.id) && !naturalKeys.has(applicationNaturalKey(item)),
  );
  return [...mergedRemote, ...localOnly];
}

export async function saveManagementListing(listingInput) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const mediaFiles = listingInput.mediaFiles || {};
  const listing = normalizeListingPayload(listingInput);
  const uploadFields = Object.entries(mediaFiles).filter(([, f]) => f instanceof File);
  const uploadResults = await Promise.all(
    uploadFields.map(([fn]) => uploadListingMediaFile(listing.id, fn, mediaFiles[fn])),
  );
  const remoteListing = { ...listing };

  uploadFields.forEach(([fieldName], i) => {
    const result = uploadResults[i];
    if (!result?.uploaded || !result.url) return;
    const fieldMap = { image: 'image', summaryImage: 'summaryImage', thumbnail: 'thumbnail', videoUrl: 'videoUrl' };
    remoteListing[fieldMap[fieldName]] = result.url;
    remoteListing[`${fieldName}Asset`] = null;
  });

  remoteListing.updatedBy = currentUser?.id || null;
  const remote = await upsertRemote('management_listings', toRemoteManagementListing(remoteListing));
  const savedListing = remote.saved && remote.data?.[0] ? fromRemoteManagementListing(remote.data[0]) : remoteListing;

  store.managementListings = mergeManagementListings(
    store.managementListings.some((i) => i.id === savedListing.id)
      ? store.managementListings.map((i) => (i.id === savedListing.id ? { ...i, ...savedListing } : i))
      : [...store.managementListings, savedListing],
  );
  store.dashboardEmails = [
    { title: 'Listing Updated — Management', detail: `Saved for ${savedListing.name}`, tone: 'accent' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  saveStore(store);
  return {
    store,
    remote: {
      saved: remote.saved,
      error: remote.error,
      uploadedMediaCount: uploadResults.filter((r) => r?.uploaded).length,
      attemptedMediaCount: uploadResults.length,
    },
  };
}

export async function deleteManagementListing(listingId) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const existing = store.managementListings.find((l) => l.id === listingId);
  if (!existing) return { store, remote: { saved: false, error: null } };

  const remote = await upsertRemote(
    'management_listings',
    toRemoteManagementListing({ ...existing, isDeleted: true, updatedBy: currentUser?.id || null }),
  );
  store.managementListings = mergeManagementListings(
    store.managementListings.map((l) => (l.id === listingId ? { ...l, isDeleted: true } : l)),
  );
  store.dashboardEmails = [
    { title: 'Listing Deleted — Management', detail: `Removed ${existing.name}`, tone: 'accent' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  saveStore(store);
  return { store, remote };
}

export async function syncRemoteData(options = {}) {
  const { includeBookings = true, includeListings = true, includeApplications = true } = options;
  const store = loadStore();
  const [remoteListings, remoteBookings, remoteOwners, remoteReviews] = await Promise.all([
    includeListings ? fetchRemoteManagementListings() : Promise.resolve({ saved: false, error: null, listings: [] }),
    includeBookings
      ? fetchRemoteBookingTransactions()
      : Promise.resolve({ saved: false, error: null, transactions: [] }),
    includeApplications
      ? fetchRemoteOwnerApplications()
      : Promise.resolve({ saved: false, error: null, applications: [] }),
    includeApplications
      ? fetchRemoteReviewSubmissions()
      : Promise.resolve({ saved: false, error: null, submissions: [] }),
  ]);
  if (includeListings && remoteListings.saved && remoteListings.listings.length)
    store.managementListings = remoteListings.listings;
  if (includeBookings && remoteBookings.saved) {
    store.bookingTransactions = remoteBookings.transactions;
    store.dashboardBookings = remoteBookings.transactions.slice(0, MAX_DASHBOARD_PREVIEW_ITEMS).map((tx) => ({
      guest: tx.bookingForm.guestName || 'Guest',
      property: `${tx.bookingSummary.name} — ${tx.bookingSummary.nights} night${tx.bookingSummary.nights > 1 ? 's' : ''}`,
      amount: tx.bookingSummary.total,
      status: String(tx.bookingStatus || 'confirmed')
        .replace(/[-_]/g, ' ')
        .replace(/^\w/, (m) => m.toUpperCase()),
      image: '',
    }));
    store.dashboardRevenue = remoteBookings.transactions.reduce(
      (t, tx) => t + (tx.paymentStatus === 'refunded' ? 0 : Number(tx.bookingSummary.total) || 0),
      0,
    );
  }
  if (includeApplications && remoteOwners.saved) {
    store.ownerApplications = mergeApplications(store.ownerApplications, remoteOwners.applications);
  }
  if (includeApplications && remoteReviews.saved) {
    store.reviewSubmissions = mergeApplications(store.reviewSubmissions, remoteReviews.submissions);
  }
  saveStore(store);
  return {
    store,
    remote: {
      listings: remoteListings,
      bookings: remoteBookings,
      ownerApplications: remoteOwners,
      reviewSubmissions: remoteReviews,
    },
  };
}

