import { FEATURED_PROPERTIES } from '../data/siteData';
import { loadStore, saveStore } from './localStore';
import { fromRemoteManagementListing, mergeManagementListings, normalizeListingPayload } from './listingMapper';
import {
  getAuthenticatedUser,
  upsertRemote,
  fetchRemoteManagementListings,
  fetchRemoteBookingTransactions,
  uploadListingMediaFile,
} from './supabaseClient';
import { MAX_DASHBOARD_PREVIEW_ITEMS } from '../lib/constants';

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
    store.managementListings
      .map((l) => (l.id === listingId ? { ...l, isDeleted: true } : l))
      .filter((l) => l.id !== listingId || FEATURED_PROPERTIES.some((d) => d.id === listingId)),
  );
  store.dashboardEmails = [
    { title: 'Listing Deleted — Management', detail: `Removed ${existing.name}`, tone: 'accent' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  saveStore(store);
  return { store, remote };
}

export async function syncRemoteData(options = {}) {
  const { includeBookings = true, includeListings = true } = options;
  const store = loadStore();
  const [remoteListings, remoteBookings] = await Promise.all([
    includeListings ? fetchRemoteManagementListings() : Promise.resolve({ saved: false, error: null, listings: [] }),
    includeBookings
      ? fetchRemoteBookingTransactions()
      : Promise.resolve({ saved: false, error: null, transactions: [] }),
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
  saveStore(store);
  return { store, remote: { listings: remoteListings, bookings: remoteBookings } };
}

