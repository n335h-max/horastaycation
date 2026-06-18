import { isManagementEmailAllowed, isSupabaseConfigured, supabase } from '../lib/supabase';

const PROFILE_TABLE = 'user_profiles';
const SUPPORTED_ROLES = new Set(['owner', 'client', 'management']);

export function getRequestedRole(role) {
  return SUPPORTED_ROLES.has(role) ? role : 'client';
}

export async function signInWithGoogle(role, redirectPath) {
  if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') {
    return { started: false };
  }

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${redirectPath}?auth_role=${getRequestedRole(role)}`,
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
    return;
  }

  await supabase.auth.signOut();
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
    preferred_role: role === 'management' ? 'client' : role,
    updated_at: new Date().toISOString(),
  };

  await supabase.from(PROFILE_TABLE).upsert(profilePayload, { onConflict: 'id' });

  return getResolvedUserRole(session, profilePayload);
}

export function getResolvedUserRole(session, profile) {
  const email = session?.user?.email || profile?.email || '';

  if (isManagementEmailAllowed(email)) {
    return 'management';
  }

  return profile?.preferred_role || 'client';
}
