import { INITIAL_BOOKINGS, INITIAL_EMAILS } from '../data/siteData';
import { readBookingDraft, readStorage, writeBookingDraft, writeStorage } from '../lib/storage';

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
  dashboardRevenue: 0,
  ownerApplications: [],
  reviewSubmissions: [],
  bookingTransactions: [],
  managementListings: [],
  wishlistByUser: {},
  supportRequests: [],
  analyticsEvents: [],
  completedStripeSessions: [],
};

const LEGACY_PLACEHOLDER_EMAIL_DETAILS = new Set([
  'Sent to sarah@example.com',
  'Sent to villa-owner@example.com',
  'Sent to admin@horastaycation.com',
]);

const LEGACY_PROPERTY_IDS = new Set([
  'ayer-keroh',
  'sama-sama-tido',
  'bohejiwa',
  'alang-villa',
  'aviva',
  'jalan-kebun',
  'amana-villa',
]);

function sanitizeLegacyPlaceholderData(store) {
  const nextStore = { ...store };

  nextStore.dashboardBookings = (nextStore.dashboardBookings || []).filter((booking) => {
    const image = String(booking?.image || '');
    return !image.includes('picsum.photos/seed/guest');
  });

  nextStore.dashboardEmails = (nextStore.dashboardEmails || []).filter(
    (email) => !LEGACY_PLACEHOLDER_EMAIL_DETAILS.has(String(email?.detail || '')),
  );

  if (Array.isArray(nextStore.managementListings)) {
    nextStore.managementListings = nextStore.managementListings.filter(
      (listing) => !LEGACY_PROPERTY_IDS.has(listing?.id),
    );
  }

  if (!(nextStore.bookingTransactions || []).length && !(nextStore.dashboardBookings || []).length) {
    nextStore.dashboardRevenue = 0;
  }

  return nextStore;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withDefaults(store) {
  return { ...clone(DEFAULT_STORE), ...store };
}

function loadStore() {
  const store = sanitizeLegacyPlaceholderData(withDefaults(readStorage(DEFAULT_STORE)));
  store.bookingDraft = readBookingDraft(store.bookingDraft);
  return store;
}

function saveStore(store) {
  writeStorage(store);
  return store;
}

export function getSnapshot() {
  return loadStore();
}

export function saveBookingDraft(draft) {
  writeBookingDraft(draft);
  return draft;
}

export { loadStore, saveStore, clone, withDefaults };
