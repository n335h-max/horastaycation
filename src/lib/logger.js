/**
 * Client-side logger — suppresses console output in production.
 *
 * In development and test modes, calls through to the real console methods.
 * In production, errors are silently captured (no PII in browser DevTools).
 * Attach a monitoring provider (Sentry, LogRocket, etc.) to the error
 * channel if you want production error tracking.
 */

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

function noop() {}

export const logger = {
  /** Use for unexpected failures that need investigation. */
  error: isDev || isTest ? console.error.bind(console) : noop,

  /** Use for recoverable issues that should be investigated. */
  warn: isDev ? console.warn.bind(console) : noop,

  /** Use for informational messages (development only). */
  info: isDev ? console.info.bind(console) : noop,

  /** Use for verbose diagnostic output (development only). */
  debug: isDev ? console.debug.bind(console) : noop,
};
