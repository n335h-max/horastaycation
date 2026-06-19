import { isManagementEmailAllowed, isSupabaseConfigured, supabase } from '../lib/supabase';

const PROFILE_TABLE = 'user_profiles';
const SUPPORTED_ROLES = new Set(['owner', 'client', 'management']);
const ACTIVE_ROLE_COOKIE = 'hora_active_role';
const AVAILABLE_ROLES_COOKIE = 'hora_available_roles';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

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

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle();

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
    preferred_role: getPersistedPreferredRole(existingProfile, role),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from(PROFILE_TABLE).upsert(profilePayload, { onConflict: 'id' });

  const profile = error ? { ...existingProfile, ...profilePayload } : (await getUserProfile(session.user.id)) || profilePayload;
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
    readCookie(ACTIVE_ROLE_COOKIE),
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
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${ACTIVE_ROLE_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
  document.cookie = `${AVAILABLE_ROLES_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
}

function getPersistedPreferredRole(profile, requestedRole) {
  if (requestedRole === 'management') {
    return profile?.preferred_role === 'owner' ? 'owner' : 'client';
  }

  return requestedRole;
}

function getAvailableRoles(session, profile, requestedRole) {
  const email = session?.user?.email || profile?.email || '';
  const requested = requestedRole ? getRequestedRole(requestedRole) : null;
  const storedRoles = parseRoles(readCookie(AVAILABLE_ROLES_COOKIE));
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
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${ACTIVE_ROLE_COOKIE}=${encodeURIComponent(activeRole)}; Max-Age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
  document.cookie = `${AVAILABLE_ROLES_COOKIE}=${encodeURIComponent(availableRoles.join(','))}; Max-Age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

function readCookie(name) {
  if (typeof document === 'undefined') {
    return '';
  }

  const key = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(key));

  return match ? decodeURIComponent(match.slice(key.length)) : '';
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
  return [...new Set(parseRoles(roles).map((role) => getRequestedRole(role)).filter((role) => SUPPORTED_ROLES.has(role)))];
}
