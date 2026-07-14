import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Regression guard for the "role stuck on client until page reload" bug.
 *
 * Bug: On the Google-OAuth redirect landing (?auth_role=owner...), a brand-new
 * user has no user_profiles row and empty localStorage. hydrateSession and the
 * onAuthStateChange handler resolved the role via getResolvedAuthState(session,
 * profile) WITHOUT the URL's requested role, so availableRoles collapsed to
 * ['client'] and the role-switch <select> (rendered only when length > 1) was
 * hidden. applyRequestedRole did set 'owner', but a late-firing auth event
 * clobbered it back to 'client' before the fire-and-forget syncUserProfile
 * persisted the role. Reloading the page masked it because localStorage was
 * then populated.
 *
 * Fix: (1) pass the URL requested role into the auth handlers, and (2) persist
 * role state synchronously in applyRequestedRole before navigating away, so a
 * late auth event reads correct localStorage instead of clobbering to client.
 */

const SESSION = { user: { id: 'u1', email: 'newbie@gmail.com' }, access_token: 'tok' };

// vi.mock factories are hoisted above imports, so shared mutable state must be
// created with vi.hoisted to be referenceable inside the factories.
const { authCallbackRef, supabaseMock } = vi.hoisted(() => {
  const authCallbackRef = { current: null };
  const subscription = { unsubscribe: () => {} };
  const supabaseMock = {
    auth: {
      onAuthStateChange: (cb) => {
        authCallbackRef.current = cb;
        return { data: { subscription } };
      },
    },
  };
  return { authCallbackRef, supabaseMock };
});

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: supabaseMock,
  isManagementEmailAllowed: () => false,
}));

vi.mock('../services/authApi', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getCurrentSession: async () => SESSION,
    // Brand-new user: no profile row yet.
    getUserProfile: async () => null,
    // syncUserProfile is fire-and-forget and not awaited by the landing flow;
    // keep it from persisting so the test isolates the eager-persist fix.
    syncUserProfile: async () => null,
  };
});

import { useAuth } from '../hooks/useAuth';

function renderAuthWith(initialPath) {
  return renderHook(() => useAuth(undefined), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>,
  });
}

describe('useAuth — first-load role (regression: stuck on client until reload)', () => {
  beforeEach(() => {
    localStorage.clear();
    authCallbackRef.current = null;
  });

  it('keeps the OAuth-requested role on first load when a late auth event fires', async () => {
    // Landing from Google OAuth redirect: requested role 'owner', no profile yet.
    const { result } = renderAuthWith('/?auth_role=owner&next=/owners/apply');

    // Wait for applyRequestedRole to resolve the requested role.
    await waitFor(() => expect(result.current.authRole).toBe('owner'));

    // Simulate a concurrent/late auth event (TOKEN_REFRESHED / second profile
    // fetch) firing AFTER applyRequestedRole navigated and cleared auth_role.
    // Before the fix this clobbered the role back to 'client'.
    await act(async () => {
      authCallbackRef.current('TOKEN_REFRESHED', SESSION);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.authRole).toBe('owner');
    expect(result.current.availableRoles).toEqual(expect.arrayContaining(['owner', 'client']));
  });
});
