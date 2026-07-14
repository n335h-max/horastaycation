import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stub auth so requests are treated as authenticated without a real token, and
// rate limit / cors are no-ops. resolveOwnerEmail is exercised via the real
// supabaseAdmin module (its fetch is the global fetch, mocked per test).
vi.mock('./_lib/auth.js', () => ({
  resolveAuthenticatedUser: async () => ({ ok: true, status: 200, user: { id: 'client-1', email: 'client@example.com' } }),
}));
vi.mock('./_lib/rateLimit.js', () => ({ applyRateLimit: () => null }));
vi.mock('./_lib/cors.js', () => ({ handleCors: () => null }));

import { resolveOwnerEmail } from './supabaseAdmin.js';

/**
 * resolveOwnerEmail is the server-side single source of truth: given an
 * owner_id, fetch the owner's CURRENT email from auth.users via the Supabase
 * admin API (service role key). This replaces the previous design of
 * snapshotting owner_email onto management_listings, which went stale if the
 * owner changed their email.
 *
 * These tests stub global.fetch (the transport supabaseAdmin uses) and assert
 * the right endpoint + auth headers are used, and that null is returned for
 * missing/invalid/failing lookups (never throws).
 */

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
});

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 404, text: async () => JSON.stringify(body) };
}

describe('resolveOwnerEmail — fetches the current owner email by id', () => {
  it('returns the email from the auth admin user endpoint', async () => {
    const fetchImpl = vi.fn((url, init) => {
      // Service role key is used for both apikey + Authorization (server-side,
      // never exposed to the client).
      expect(init.headers.apikey).toBe('service-role-key');
      expect(init.headers.Authorization).toBe('Bearer service-role-key');
      return Promise.resolve(jsonResponse({ id: 'owner-uuid-1', email: 'owner-current@example.com' }));
    });
    global.fetch = fetchImpl;

    const email = await resolveOwnerEmail('owner-uuid-1');
    expect(email).toBe('owner-current@example.com');
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.supabase.co/auth/v1/admin/users/owner-uuid-1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns null when the owner id is missing', async () => {
    const fetchImpl = vi.fn();
    global.fetch = fetchImpl;
    expect(await resolveOwnerEmail('')).toBeNull();
    expect(await resolveOwnerEmail(null)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns null (and does not throw) when the admin API fails', async () => {
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse({}, false)));
    expect(await resolveOwnerEmail('owner-uuid-2')).toBeNull();
  });

  it('returns null when Supabase admin env is not configured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    global.fetch = vi.fn();
    expect(await resolveOwnerEmail('owner-uuid-3')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
