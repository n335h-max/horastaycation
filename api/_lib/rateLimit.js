/**
 * Simple in-memory rate limiter for Vercel serverless functions.
 * 
 * Note: Each Vercel function instance maintains its own rate limit buckets.
 * This is sufficient for most use cases since authentication and other checks
 * provide additional protection.
 */

const rateLimitBuckets = new Map();

/**
 * Get a unique key for rate limiting based on IP and optional user identifier.
 * @param {Object} req - The request object
 * @param {string} userId - Optional user identifier for per-user limits
 * @returns {string} Unique key for this client
 */
function getClientKey(req, userId = '') {
  const forwardedFor = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwardedFor || req.headers?.['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Check if a request should be allowed based on rate limiting.
 * @param {Object} req - The request object
 * @param {Object} options - Rate limiting options
 * @param {string} options.userId - Optional user identifier for per-user limits
 * @param {number} options.maxRequests - Maximum requests per window (default: 10)
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000)
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(req, options = {}) {
  const {
    userId = '',
    maxRequests = 10,
    windowMs = 60000,
  } = options;

  const now = Date.now();
  const key = getClientKey(req, userId);
  const bucket = rateLimitBuckets.get(key) || {
    count: 0,
    resetAt: now + windowMs,
  };

  // Reset bucket if window has expired
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);

  const allowed = bucket.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - bucket.count);

  return {
    allowed,
    remaining,
    resetAt: bucket.resetAt,
  };
}

/**
 * Middleware-style rate limiter that returns an error response if limit exceeded.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Object} options - Rate limiting options (same as checkRateLimit)
 * @returns {Object|null} Error response object if rate limit exceeded, null otherwise
 */
export function applyRateLimit(req, res, options = {}) {
  const result = checkRateLimit(req, options);

  if (!result.allowed) {
    const resetInSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
    res.setHeader('Retry-After', String(resetInSeconds));
    res.setHeader('X-RateLimit-Limit', String(options.maxRequests || 10));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)));

    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: resetInSeconds,
    });
  }

  // Set rate limit headers for successful requests
  res.setHeader('X-RateLimit-Limit', String(options.maxRequests || 10));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)));

  return null;
}
