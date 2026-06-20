import { FEATURED_PROPERTIES, INITIAL_BOOKINGS, INITIAL_EMAILS, RANDOM_GUEST_NAMES } from '../data/siteData';
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

function withDefaults(store) {
  return { ...clone(DEFAULT_STORE), ...store };
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

export function getSnapshot() {
  return loadStore();
}

export function saveBookingDraft(draft) {
  writeBookingDraft(draft);
  return draft;
}

export { loadStore, saveStore, clone, withDefaults };