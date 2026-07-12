/**
 * CORS middleware for Vercel serverless API functions.
 *
 * Allows requests from the configured APP_BASE_URL (or VERCEL_URL).
 * Handles OPTIONS preflight requests. Rejects cross-origin calls
 * from any other domain.
 */

function getHeader(req, name) {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value || '';
}

function normalizeOrigin(value) {
  const input = String(value || '').trim();
  if (!input) return '';
  try {
    return new URL(input.includes('://') ? input : `https://${input}`).origin;
  } catch {
    return '';
  }
}

function getAllowedOrigins(req) {
  const origins = new Set();

  const appBase = normalizeOrigin(process.env.APP_BASE_URL || '');
  if (appBase) origins.add(appBase);

  const vercelUrl = normalizeOrigin(process.env.VERCEL_URL || '');
  if (vercelUrl) origins.add(`https://${vercelUrl}`);

  // Also accept the request's own host if behind Vercel proxy
  const protocol = String(getHeader(req, 'x-forwarded-proto') || 'https').split(',')[0].trim() || 'https';
  const host = String(getHeader(req, 'x-forwarded-host') || getHeader(req, 'host') || '').split(',')[0].trim();
  if (host) {
    const origin = normalizeOrigin(`${protocol}://${host}`);
    if (origin) origins.add(origin);
  }

  return Array.from(origins).filter(Boolean);
}

function getRequestOrigin(req) {
  return normalizeOrigin(getHeader(req, 'origin') || getHeader(req, 'referer') || '');
}

/**
 * Apply CORS headers and handle preflight requests.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {string[]} methods - Allowed HTTP methods (default: ['POST'])
 * @returns {Object|null} Response if preflight/rejected, null to continue
 */
export function handleCors(req, res, methods = ['POST']) {
  const allowedOrigins = getAllowedOrigins(req);
  const requestOrigin = getRequestOrigin(req);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    if (allowedOrigins.length && requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Vary', 'Origin');
      return res.status(204).end();
    }
    // Disallow preflight from unknown origins
    return res.status(403).json({ error: 'Cross-origin request not allowed.' });
  }

  // Set CORS headers on actual requests from allowed origins
  if (allowedOrigins.length && requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
    res.setHeader('Vary', 'Origin');
  }

  // Method not allowed
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // Continue to handler
  return null;
}
