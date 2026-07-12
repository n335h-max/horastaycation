import { isManagementEmailAllowed, isSupabaseConfigured, supabase } from '../lib/supabase';
import { SUPPORTED_ROLES_SET, ACTIVE_ROLE_STORAGE_KEY, AVAILABLE_ROLES_STORAGE_KEY } from '../lib/constants';
import { getLocalStorage } from '../lib/safeStorage';

const PROFILE_TABLE = 'user_profiles';
const SUPPORTED_ROLES = SUPPORTED_ROLES_SET;

function readStorage(key) {
  try {
    return getLocalStorage().getItem(key) || '';
  } catch {
    return '';
  }
}

function writeStorage(key, value) {
  try {
    getLocalStorage().setItem(key, value);
  } catch {
    /* noop */
  }
}

function removeStorage(key) {
  try {
    getLocalStorage().removeItem(key);
  } catch {
    /* noop */
  }
}

export function getRequestedRole(role) {
  return SUPPORTED_ROLES.has(role) ? role : 'client';
}

export async function signInWithGoogle(role, redirectPath) {
  if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') {
    return { started: false };
  }

  const redirectUrl = new URL(redirectPath, window.location.origin);
  redirectUrl.searchParams.set('auth_role', getRequestedRole(role));

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl.toString(),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { started: true };
}

export async function signOutCurrentUser() {
  if (!isSupabaseConfigured || !supabase) {
    clearStoredRoleState();
    return;
  }

  await supabase.auth.signOut();
  clearStoredRoleState();
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getUserProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return null;
  }

  const { data, error } = await supabase.from(PROFILE_TABLE).select('*').eq('id', userId).maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function syncUserProfile(session, requestedRole) {
  if (!isSupabaseConfigured || !supabase || !session?.user) {
    return null;
  }

  const role = getRequestedRole(requestedRole);
  const existingProfile = await getUserProfile(session.user.id);
  const email = session.user.email || '';
  const fullName =
    session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.user_metadata?.email ||
    email;

  const profilePayload = {
    id: session.user.id,
    email,
    full_name: fullName,
    available_roles: getPersistedAvailableRoles(existingProfile, role),
    preferred_role: getPersistedPreferredRole(existingProfile, role),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(PROFILE_TABLE).upsert(profilePayload, { onConflict: 'id' });

  const profile = error
    ? { ...existingProfile, ...profilePayload }
    : (await getUserProfile(session.user.id)) || profilePayload;
  const authState = getResolvedAuthState(session, profile, role);
  persistRoleState(authState.activeRole, authState.availableRoles);

  return {
    profile,
    ...authState,
  };
}

export function getResolvedUserRole(session, profile) {
  return getResolvedAuthState(session, profile).activeRole;
}

export function getResolvedAuthState(session, profile, requestedRole) {
  const availableRoles = getAvailableRoles(session, profile, requestedRole);
  const preferredRole = [
    requestedRole ? getRequestedRole(requestedRole) : null,
    readStorage(ACTIVE_ROLE_STORAGE_KEY),
    profile?.preferred_role,
    availableRoles.includes('management') ? 'management' : null,
    'client',
  ].find((role) => role && availableRoles.includes(role));

  return {
    activeRole: preferredRole || 'client',
    availableRoles,
  };
}

export async function switchUserRole(session, nextRole) {
  if (!session?.user) {
    return null;
  }

  const requestedRole = getRequestedRole(nextRole);
  const profile = await getUserProfile(session.user.id);
  const authState = getResolvedAuthState(session, profile, requestedRole);

  if (!authState.availableRoles.includes(requestedRole)) {
    return {
      profile,
      ...authState,
    };
  }

  if (requestedRole !== 'management' && isSupabaseConfigured && supabase) {
    const nextProfile = {
      id: session.user.id,
      email: session.user.email || profile?.email || '',
      full_name:
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        profile?.full_name ||
        session.user.email ||
        '',
      available_roles: getPersistedAvailableRoles(profile, requestedRole),
      preferred_role: requestedRole,
      updated_at: new Date().toISOString(),
    };

    await supabase.from(PROFILE_TABLE).upsert(nextProfile, { onConflict: 'id' });
  }

  const refreshedProfile = (await getUserProfile(session.user.id)) || profile;
  const nextAuthState = getResolvedAuthState(session, refreshedProfile, requestedRole);
  persistRoleState(nextAuthState.activeRole, nextAuthState.availableRoles);

  return {
    profile: refreshedProfile,
    ...nextAuthState,
  };
}

export function clearStoredRoleState() {
  removeStorage(ACTIVE_ROLE_STORAGE_KEY);
  removeStorage(AVAILABLE_ROLES_STORAGE_KEY);
}

function getPersistedPreferredRole(profile, requestedRole) {
  if (requestedRole === 'management') {
    return profile?.preferred_role === 'owner' ? 'owner' : 'client';
  }

  return requestedRole;
}

function getPersistedAvailableRoles(profile, requestedRole) {
  return normalizeRoles([
    'client',
    ...(requestedRole && requestedRole !== 'management' ? [requestedRole] : []),
    ...(Array.isArray(profile?.available_roles) ? profile.available_roles : []),
    profile?.preferred_role,
  ]);
}

function getAvailableRoles(session, profile, requestedRole) {
  const email = session?.user?.email || profile?.email || '';
  const requested = requestedRole ? getRequestedRole(requestedRole) : null;
  const storedRoles = parseRoles(readStorage(AVAILABLE_ROLES_STORAGE_KEY));
  const profileRoles = parseRoles(profile?.available_roles);
  const normalizedRoles = normalizeRoles([
    'client',
    profile?.preferred_role,
    ...profileRoles,
    ...storedRoles,
    ...(requested && requested !== 'management' ? [requested] : []),
  ]);

  if (isManagementEmailAllowed(email)) {
    normalizedRoles.push('management');
  }

  return normalizeRoles(normalizedRoles);
}

function persistRoleState(activeRole, availableRoles) {
  writeStorage(ACTIVE_ROLE_STORAGE_KEY, activeRole);
  writeStorage(AVAILABLE_ROLES_STORAGE_KEY, availableRoles.join(','));
}

function parseRoles(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

function normalizeRoles(roles) {
  return [
    ...new Set(
      parseRoles(roles)
        .map((role) => getRequestedRole(role))
        .filter((role) => SUPPORTED_ROLES.has(role)),
    ),
  ];
}
