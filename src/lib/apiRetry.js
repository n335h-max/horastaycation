/**
 * Retry utility for failed API calls with exponential backoff
 */

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt, config) {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelayMs,
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * delay * 0.1;
}

/**
 * Check if a fetch error is retryable
 */
function isRetryableError(error, statusCode, config) {
  // Network errors are retryable
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }

  // Check retryable HTTP status codes
  if (statusCode && config.retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  return false;
}

/**
 * Fetch wrapper with automatic retry logic
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {object} retryConfig - Retry configuration
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, retryConfig = {}) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful, return immediately
      if (response.ok) {
        return response;
      }

      // Check if we should retry on this status code
      if (!isRetryableError(null, response.status, config)) {
        return response;
      }

      // Store error and retry if not last attempt
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (attempt < config.maxRetries) {
        const delayMs = calculateBackoffDelay(attempt, config);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error, null, config) || attempt === config.maxRetries) {
        throw error;
      }

      // Retry with backoff
      const delayMs = calculateBackoffDelay(attempt, config);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Create a stripe checkout session with retry logic
 */
export async function createCheckoutSessionWithRetry(bookingData, retryConfig = {}) {
  const config = { maxRetries: 3, ...retryConfig };

  const response = await fetchWithRetry(
    '/api/create-checkout-session',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    },
    config,
  );

  const payload = await response.json();

  if (!response.ok) {
    const errorMessage = payload?.error || `Failed to create checkout session: HTTP ${response.status}`;
    const error = new Error(errorMessage);
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }

  if (!payload?.url || !payload?.sessionId) {
    throw new Error('Invalid checkout session response: missing url or sessionId');
  }

  return payload;
}

/**
 * Verify a stripe checkout session with retry logic
 */
export async function verifyCheckoutSessionWithRetry(sessionId, retryConfig = {}) {
  const config = { maxRetries: 3, ...retryConfig };

  const response = await fetchWithRetry(
    `/api/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`,
    { method: 'GET' },
    config,
  );

  const payload = await response.json();

  if (!response.ok) {
    const errorMessage = payload?.error || `Failed to verify checkout session: HTTP ${response.status}`;
    const error = new Error(errorMessage);
    error.statusCode = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}
