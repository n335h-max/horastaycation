function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function canUseSupabaseAdmin() {
  return Boolean(getSupabaseUrl() && getServiceRoleKey());
}

function getHeader(req, name) {
  const value = req.headers?.[name];
  return Array.isArray(value) ? value[0] : value || '';
}

export function getBearerToken(req) {
  const authHeader = getHeader(req, 'authorization');
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

async function adminFetch(path, init = {}) {
  const url = `${getSupabaseUrl().replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: getServiceRoleKey(),
      Authorization: `Bearer ${getServiceRoleKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: response.ok, status: response.status, data };
}

async function validateAccessToken(accessToken) {
  const url = `${getSupabaseUrl().replace(/\/$/, '')}/auth/v1/user`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: getServiceRoleKey(),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: response.ok, status: response.status, data };
}

export async function resolveAuthenticatedUser(req) {
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return { ok: false, status: 401, code: 'unauthenticated', error: 'Missing bearer token.' };
  }

  if (!canUseSupabaseAdmin()) {
    return {
      ok: false,
      status: 500,
      code: 'misconfigured',
      error: 'Supabase admin environment variables are not configured.',
    };
  }

  try {
    const result = await validateAccessToken(accessToken);
    const user = result.data || null;

    if (!result.ok || !user?.id) {
      return { ok: false, status: 401, code: 'unauthenticated', error: 'Invalid or expired session token.' };
    }

    return {
      ok: true,
      status: 200,
      code: 'authenticated',
      token: accessToken,
      user: {
        id: user.id,
        email: user.email || '',
      },
    };
  } catch {
    return { ok: false, status: 401, code: 'unauthenticated', error: 'Unable to validate session token.' };
  }
}

export async function isManagementMemberByEmail(email) {
  if (!canUseSupabaseAdmin()) {
    return { ok: false, status: 500, code: 'misconfigured', error: 'Supabase admin is not configured.' };
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, status: 403, code: 'unauthorized', error: 'Missing authenticated email.' };
  }

  try {
    const result = await adminFetch(
      `/rest/v1/management_users?select=email&is_active=eq.true&email=eq.${encodeURIComponent(normalizedEmail)}&limit=1`,
      { method: 'GET' },
    );

    if (!result.ok) {
      return { ok: false, status: 500, code: 'query_failed', error: 'Unable to verify management membership.' };
    }

    const isMember = Array.isArray(result.data) && result.data.length > 0;
    return isMember
      ? { ok: true, status: 200, code: 'authorized', isMember: true }
      : { ok: false, status: 403, code: 'unauthorized', error: 'Management access is required.' };
  } catch {
    return { ok: false, status: 500, code: 'query_failed', error: 'Unable to verify management membership.' };
  }
}

export async function requireManagementUser(req) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth.ok) {
    return auth;
  }

  const membership = await isManagementMemberByEmail(auth.user.email);
  if (!membership.ok) {
    return membership;
  }

  return {
    ok: true,
    status: 200,
    code: 'authorized',
    user: auth.user,
    token: auth.token,
  };
}
