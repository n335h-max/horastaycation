// ──────────────────────────────────────────────
// Hora Staycation — Application Constants
// ──────────────────────────────────────────────

/** Service fee percentage applied to bookings (e.g., 0.12 = 12%) */
export const SERVICE_FEE_RATE = 0.12;

/** WhatsApp support number (override via VITE_WHATSAPP_SUPPORT env) */
export const WHATSAPP_SUPPORT_NUMBER = import.meta.env.VITE_WHATSAPP_SUPPORT || '601110629990';

/** Toast notification auto-dismiss timeout in milliseconds */
export const TOAST_DURATION_MS = 3200;

/** Maximum number of support request records kept in local store */
export const MAX_SUPPORT_REQUESTS = 50;

/** Maximum number of analytics events kept in local store */
export const MAX_ANALYTICS_EVENTS = 250;

/** Maximum number of dashboard preview items (bookings, emails) */
export const MAX_DASHBOARD_PREVIEW_ITEMS = 6;

/** Number of recent booking transactions to fetch from remote */
export const REMOTE_BOOKING_LIMIT = 20;

/** Artificial delay for local-only operations (0 in production, 120ms in dev) */
export const API_DELAY_MS = import.meta.env.PROD ? 0 : 120;

// ──────────────────────────────────────────────
// Stripe
// ──────────────────────────────────────────────

export const STRIPE_API_BASE = '/api';

export const STRIPE_ENDPOINTS = {
  createCheckoutSession: `${STRIPE_API_BASE}/create-checkout-session`,
  verifyCheckoutSession: `${STRIPE_API_BASE}/verify-checkout-session`,
  refundPayment: `${STRIPE_API_BASE}/refund-payment`,
  stripeWebhook: `${STRIPE_API_BASE}/stripe-webhook`,
};

// ──────────────────────────────────────────────
// Resend (Email)
// ──────────────────────────────────────────────

export const RESEND_API_BASE = '/api';

export const RESEND_ENDPOINTS = {
  sendEmail: `${RESEND_API_BASE}/send-email`,
};

// ──────────────────────────────────────────────
// Role Management
// ──────────────────────────────────────────────

export const ACTIVE_ROLE_STORAGE_KEY = 'hora_active_role';
export const AVAILABLE_ROLES_STORAGE_KEY = 'hora_available_roles';

export const SUPPORTED_ROLES = {
  CLIENT: 'client',
  OWNER: 'owner',
  MANAGEMENT: 'management',
};

export const SUPPORTED_ROLES_SET = new Set(Object.values(SUPPORTED_ROLES));

export const ROLE_DEFAULT_PATHS = {
  [SUPPORTED_ROLES.OWNER]: '/owners/apply',
  [SUPPORTED_ROLES.CLIENT]: '/booking',
  [SUPPORTED_ROLES.MANAGEMENT]: '/management/dashboard',
};

// ──────────────────────────────────────────────
// Currency / Locale
// ──────────────────────────────────────────────

export const CURRENCY_LOCALE = 'ms-MY';
export const CURRENCY_CODE = 'MYR';
export const CURRENCY_FORMAT_OPTIONS = {
  style: 'currency',
  currency: 'MYR',
  maximumFractionDigits: 0,
};

export const COMPACT_NUMBER_FORMAT_OPTIONS = {
  notation: 'compact',
  maximumFractionDigits: 1,
};

export const DATE_FORMAT_OPTIONS = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

// ──────────────────────────────────────────────
// PWA
// ──────────────────────────────────────────────

export const INSTALL_PROMPT_EVENT = 'beforeinstallprompt';
