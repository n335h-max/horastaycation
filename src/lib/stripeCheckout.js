import { getLocalStorage } from './safeStorage';

const STRIPE_PENDING_CHECKOUTS_KEY = 'hora-stripe-pending-checkouts:v1';

function readPendingCheckouts() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = getLocalStorage().getItem(STRIPE_PENDING_CHECKOUTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePendingCheckouts(value) {
  if (typeof window === 'undefined') {
    return;
  }

  getLocalStorage().setItem(STRIPE_PENDING_CHECKOUTS_KEY, JSON.stringify(value));
}

export function savePendingStripeCheckout(sessionId, payload) {
  const current = readPendingCheckouts();
  writePendingCheckouts({
    ...current,
    [sessionId]: {
      ...payload,
      savedAt: new Date().toISOString(),
    },
  });
}

const PENDING_CHECKOUT_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function getPendingStripeCheckout(sessionId) {
  const current = readPendingCheckouts();
  const entry = current[sessionId];
  if (!entry) return null;

  // O-5: Prune stale entries so abandoned checkouts don't accumulate in localStorage.
  const age = Date.now() - new Date(entry.savedAt).getTime();
  if (age > PENDING_CHECKOUT_TTL_MS) {
    clearPendingStripeCheckout(sessionId);
    return null;
  }

  return entry;
}

export function clearPendingStripeCheckout(sessionId) {
  const current = readPendingCheckouts();

  if (!current[sessionId]) {
    return;
  }

  const next = { ...current };
  delete next[sessionId];
  writePendingCheckouts(next);
}
