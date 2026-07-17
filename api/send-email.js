import { getResendClient, getFromEmail, getManagementEmail } from './_lib/resendServer.js';
import { logger } from './_lib/logger.js';
import { handleCors } from './_lib/cors.js';
import { resolveOwnerEmail } from './_lib/supabaseAdmin.js';
import { resolveAuthenticatedUser } from './_lib/auth.js';
import {
  bookingConfirmationTemplate,
  ownerBookingAlertTemplate,
  managementBookingAlertTemplate,
  supportRequestTemplate,
  ownerLeadTemplate,
  evaluationRequestTemplate,
  applicationApprovalTemplate,
} from './_lib/emailTemplates.js';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const rateLimitBuckets = new Map();

function getJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function getHeader(req, name) {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value || '';
}

function normalizeEmail(value) {
  const email = String(value || '').trim();
  if (!email) {
    return '';
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function normalizeOrigin(value) {
  const input = String(value || '').trim();
  if (!input) {
    return '';
  }

  try {
    return new URL(input.includes('://') ? input : `https://${input}`).origin;
  } catch {
    return '';
  }
}

function getTrustedOrigins(req) {
  const origins = new Set();

  const appBase = normalizeOrigin(process.env.APP_BASE_URL || '');
  if (appBase) {
    origins.add(appBase);
  }

  const vercelUrl = normalizeOrigin(process.env.VERCEL_URL || '');
  if (vercelUrl) {
    origins.add(vercelUrl);
  }

  const protocol = String(getHeader(req, 'x-forwarded-proto') || 'https').split(',')[0].trim() || 'https';
  const host = String(getHeader(req, 'x-forwarded-host') || getHeader(req, 'host') || '').split(',')[0].trim();
  if (host) {
    origins.add(normalizeOrigin(`${protocol}://${host}`));
  }

  return Array.from(origins).filter(Boolean);
}

function getRequestOrigin(req) {
  return normalizeOrigin(getHeader(req, 'origin') || getHeader(req, 'referer') || '');
}

function getClientKey(req) {
  const forwardedFor = String(getHeader(req, 'x-forwarded-for') || '').split(',')[0].trim();
  return forwardedFor || getHeader(req, 'x-real-ip') || req.socket?.remoteAddress || 'unknown';
}

function allowRateLimit(req, type) {
  const now = Date.now();
  const bucketKey = `${getClientKey(req)}:${type}`;
  const bucket = rateLimitBuckets.get(bucketKey) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;
  rateLimitBuckets.set(bucketKey, bucket);

  return bucket.count <= RATE_LIMIT_MAX_REQUESTS;
}

const EMAIL_TYPES = {
  booking_confirmation: {
    subject: (d) => `Booking Confirmed — ${d.propertyName} with Hora Staycation`,
    template: bookingConfirmationTemplate,
    defaultTo: (d) => d.guestEmail,
  },
  owner_booking_alert: {
    subject: (d) => `New Booking Alert — ${d.propertyName}`,
    template: ownerBookingAlertTemplate,
    defaultTo: () => null, // Must be provided explicitly
  },
  management_booking_alert: {
    subject: (d) => `[Management] New Booking — ${d.propertyName}`,
    template: managementBookingAlertTemplate,
    defaultTo: getManagementEmail,
  },
  support_request: {
    subject: (d) => `New Support Request: ${d.topic}`,
    template: supportRequestTemplate,
    defaultTo: getManagementEmail,
  },
  owner_lead: {
    subject: (d) => `New Owner Lead — ${d.ownerName}`,
    template: ownerLeadTemplate,
    defaultTo: getManagementEmail,
  },
  evaluation_request: {
    subject: (d) => `New Evaluation Request — ${d.evaluatorName}`,
    template: evaluationRequestTemplate,
    defaultTo: getManagementEmail,
  },
  application_approval: {
    subject: (d) => `Your Hora Application is Approved — ${d.applicantName}`,
    template: applicationApprovalTemplate,
    defaultTo: (d) => d.applicantEmail || null,
  },
};

export default async function handler(req, res) {
  const corsResult = handleCors(req, res, ['POST']);
  if (corsResult) return corsResult;

  // C-3: Require a valid Supabase JWT — Origin/Referer headers are trivially
  // spoofable by curl and cannot be relied on as the sole protection.
  const auth = await resolveAuthenticatedUser(req);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: 'Authentication required to send email.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ sent: false, error: 'Email service is not configured.' });
  }

  const body = getJsonBody(req);
  const { type, data, to } = body;

  const trustedOrigins = getTrustedOrigins(req);
  const requestOrigin = getRequestOrigin(req);

  if (!trustedOrigins.length || !requestOrigin) {
    return res.status(403).json({ error: 'Cross-origin email requests are not allowed. No trusted origin configured.' });
  }

  if (!trustedOrigins.includes(requestOrigin)) {
    return res.status(403).json({ error: 'Cross-origin email requests are not allowed.' });
  }

  if (!allowRateLimit(req, type)) {
    return res.status(429).json({ error: 'Too many email requests. Please try again later.' });
  }

  if (!type || !EMAIL_TYPES[type]) {
    return res.status(400).json({ error: `Invalid email type. Supported types: ${Object.keys(EMAIL_TYPES).join(', ')}` });
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Email data is required.' });
  }

  const emailConfig = EMAIL_TYPES[type];

  // Owner booking alerts resolve the recipient server-side from the owner id
  // (single source of truth — auth.users.email), never a client-supplied email
  // snapshot that could be stale. All other types derive the recipient from
  // the template's defaultTo (or an explicit `to`).
  let recipientEmail = '';
  if (type === 'owner_booking_alert') {
    recipientEmail = normalizeEmail(await resolveOwnerEmail(data?.ownerId));
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Owner booking alert could not resolve an owner email from ownerId.' });
    }
  } else {
    const defaultRecipient =
      typeof emailConfig.defaultTo === 'function' ? emailConfig.defaultTo(data) : emailConfig.defaultTo;
    recipientEmail = normalizeEmail(defaultRecipient) || normalizeEmail(to);
    if (!recipientEmail) {
      return res.status(400).json({ error: 'No valid recipient email is configured for this message type.' });
    }
  }

  try {
    const resend = getResendClient();
    const html = emailConfig.template(data);
    const subject = emailConfig.subject(data);

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: recipientEmail,
      subject,
      html,
    });

    if (result?.error || !result?.data?.id) {
      return res.status(502).json({
        sent: false,
        error: result?.error?.message || result?.error || 'Email provider did not return a message id.',
      });
    }

    return res.status(200).json({ sent: true, id: result.data.id });
  } catch (error) {
    logger.error('Resend email send failed:', error);
    return res.status(502).json({
      sent: false,
      error: error instanceof Error ? error.message : 'Email send failed.',
    });
  }
}