import { INITIAL_BOOKINGS, INITIAL_EMAILS, RANDOM_GUEST_NAMES } from '../data/siteData';
import { readStorage, writeStorage } from '../lib/storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withDefaults(store) {
  return {
    ...clone(DEFAULT_STORE),
    ...store,
  };
}

function loadStore() {
  return withDefaults(readStorage(DEFAULT_STORE));
}

function saveStore(store) {
  writeStorage(store);
  return store;
}

async function insertRemote(table, payload) {
  if (!isSupabaseConfigured || !supabase) {
    return { saved: false, error: null };
  }

  const { error } = await supabase.from(table).insert(payload);
  return { saved: !error, error };
}

function delay(ms = 120) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function getSnapshot() {
  return loadStore();
}

export async function saveBookingDraft(draft) {
  const store = loadStore();
  store.bookingDraft = draft;
  saveStore(store);
  await delay();
  return store;
}

export async function submitOwnerApplication(application) {
  const store = loadStore();
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

export async function submitBooking({ bookingForm, bookingSummary, paymentForm }) {
  const store = loadStore();
  const guest = bookingForm.guestName || RANDOM_GUEST_NAMES[0];

  store.bookingTransactions = [
    {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      bookingForm,
      bookingSummary,
    },
    ...store.bookingTransactions,
  ];

  store.dashboardBookings = [
    {
      guest,
      property: `${bookingSummary.name} — ${bookingSummary.nights} night${bookingSummary.nights > 1 ? 's' : ''}`,
      amount: bookingSummary.total,
      status: 'Confirmed',
      image: `https://picsum.photos/seed/${encodeURIComponent(guest)}/40/40.jpg`,
    },
    ...store.dashboardBookings,
  ].slice(0, 6);

  store.dashboardEmails = [
    { title: 'Booking Confirmed — Customer', detail: `Sent to ${bookingForm.guestEmail}`, tone: 'indigo' },
    { title: 'New Booking Alert — Owner', detail: `Sent for ${bookingSummary.name}`, tone: 'brand' },
    { title: 'New Booking Alert — Management', detail: 'Sent to admin@horastaycation.com', tone: 'accent' },
    ...store.dashboardEmails,
  ].slice(0, 6);

  store.dashboardRevenue += bookingSummary.total;
  store.bookingDraft = clone(initialBookingDraft);
  saveStore(store);
  const remote = await insertRemote('booking_transactions', {
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
    payment_last4: paymentForm.cardNumber.replace(/\s/g, '').slice(-4),
  });
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
