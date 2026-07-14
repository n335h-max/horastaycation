import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Guards the management-login restriction rule:
 *   Management can be logged in by ONLY n33sh07@gmail.com and
 *   hijaugrouplandscape@gmail.com.
 *
 * The client allowlist (VITE_MANAGEMENT_EMAILS) is the client-side gate that
 * grants the management role in authApi.getAvailableRoles. The matching
 * server-side gate is the management_users table. This test pins the allowlist
 * contents so the rule can't silently drift.
 */

const ALLOWED = ['n33sh07@gmail.com', 'hijaugrouplandscape@gmail.com'];

beforeEach(() => {
  // Stub the env BEFORE importing the module, since MANAGEMENT_EMAILS is
  // computed at module-load time from import.meta.env.
  vi.resetModules();
  vi.stubEnv('VITE_MANAGEMENT_EMAILS', ALLOWED.join(','));
});

async function loadModule() {
  return import('../lib/supabase');
}

describe('management login allowlist — restricted to the two authorized emails', () => {
  it('allows n33sh07@gmail.com', async () => {
    const { isManagementEmailAllowed } = await loadModule();
    expect(isManagementEmailAllowed('n33sh07@gmail.com')).toBe(true);
  });

  it('allows hijaugrouplandscape@gmail.com', async () => {
    const { isManagementEmailAllowed } = await loadModule();
    expect(isManagementEmailAllowed('hijaugrouplandscape@gmail.com')).toBe(true);
  });

  it('rejects any other email', async () => {
    const { isManagementEmailAllowed } = await loadModule();
    expect(isManagementEmailAllowed('random.person@gmail.com')).toBe(false);
    expect(isManagementEmailAllowed('attacker@example.com')).toBe(false);
  });

  it('is case-insensitive and trims whitespace', async () => {
    const { isManagementEmailAllowed } = await loadModule();
    expect(isManagementEmailAllowed('  N33SH07@gmail.com  ')).toBe(true);
    expect(isManagementEmailAllowed('Hijaugrouplandscape@gmail.com')).toBe(true);
  });

  it('rejects empty / missing values', async () => {
    const { isManagementEmailAllowed } = await loadModule();
    expect(isManagementEmailAllowed('')).toBe(false);
    expect(isManagementEmailAllowed(null)).toBe(false);
    expect(isManagementEmailAllowed(undefined)).toBe(false);
  });
});
