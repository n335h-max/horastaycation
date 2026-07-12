import { getLocalStorage } from './safeStorage';

const STORAGE_KEY = 'hora-staycation-store:v1';
const BOOKING_DRAFT_KEY = 'hora-staycation-booking-draft:v1';

export function readStorage(defaultValue) {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const raw = getLocalStorage().getItem(STORAGE_KEY);
    if (!raw) {
      return defaultValue;
    }

    return { ...defaultValue, ...JSON.parse(raw) };
  } catch {
    return defaultValue;
  }
}

export function writeStorage(value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    getLocalStorage().setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export function readBookingDraft(defaultValue) {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const raw = getLocalStorage().getItem(BOOKING_DRAFT_KEY);
    if (!raw) {
      return defaultValue;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...defaultValue, ...parsed } : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function writeBookingDraft(value) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    getLocalStorage().setItem(BOOKING_DRAFT_KEY, JSON.stringify(value));
  } catch {
    /* noop */
  }
}
