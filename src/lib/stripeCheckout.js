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

export function getPendingStripeCheckout(sessionId) {
  const current = readPendingCheckouts();
  return current[sessionId] || null;
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
