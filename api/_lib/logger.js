/**
 * Server-side logger for Vercel serverless functions.
 *
 * In production, Vercel captures stderr/stdout so console.error is preserved
 * for server logs (visible in Vercel dashboard). But console.warn and
 * console.log are suppressed to avoid noise.
 *
 * The important distinction from the client logger: server-side errors
 * ARE logged to Vercel's observability pipeline — they just don't reach
 * the browser.
 */

const isProduction = process.env.VERCEL_ENV === 'production';

function noop() {}

export const logger = {
  /** Always log errors — Vercel captures these for observability. */
  error: console.error.bind(console),

  /** Warnings are only useful in development; suppress in production. */
  warn: isProduction ? noop : console.warn.bind(console),

  /** Informational messages — development only. */
  info: isProduction ? noop : console.info.bind(console),

  /** Debug output — development only. */
  debug: isProduction ? noop : console.debug.bind(console),
};
