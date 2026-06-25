import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getCurrentSession,
  getResolvedAuthState,
  getUserProfile,
  signInWithGoogle,
  signOutCurrentUser,
  switchUserRole,
  syncUserProfile,
} from '../services/authApi';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { APP_PATHS, getPathFromPage } from '../lib/routes';

const ROLE_DEFAULT_PATHS = {
  owner: APP_PATHS.ownerSignup,
  client: APP_PATHS.booking,
  management: APP_PATHS.dashboard,
};

function getDefaultPathForRole(role) {
  return ROLE_DEFAULT_PATHS[role] || APP_PATHS.booking;
}

function getSafeNextPath(nextPath, role) {
  if (typeof nextPath === 'string' && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    return nextPath;
  }
  return getDefaultPathForRole(role);
}

function buildAuthPath(role, nextPath) {
  const params = new URLSearchParams();
  params.set('role', role);
  params.set('next', getSafeNextPath(nextPath, role));
  return `${APP_PATHS.authLogin}?${params.toString()}`;
}

function getRouteRole(pathname) {
  if (pathname === APP_PATHS.ownerSignup || pathname === APP_PATHS.ownerDashboard) {
    return 'owner';
  }
  if (pathname === APP_PATHS.booking) {
    return 'client';
  }
  if (pathname === APP_PATHS.dashboard || pathname === APP_PATHS.managementListings) {
    return 'management';
  }
  return null;
}

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authSession, setAuthSession] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [authRole, setAuthRole] = useState('client');
  const [availableRoles, setAvailableRoles] = useState(['client']);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(isSupabaseConfigured));
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Initial session hydration & auth state listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    let isActive = true;

    async function hydrateSession() {
      const session = await getCurrentSession();

      if (!isActive) return;

      setAuthSession(session);
      if (!session?.user) {
        setAuthProfile(null);
        setAuthRole('client');
        setAvailableRoles(['client']);
        setIsAuthLoading(false);
        return;
      }

      const profile = await getUserProfile(session.user.id);
      if (!isActive) return;

      setAuthProfile(profile);
      const authState = getResolvedAuthState(session, profile);
      setAuthRole(authState.activeRole);
      setAvailableRoles(authState.availableRoles);
      setIsAuthLoading(false);
    }

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) return;

      setAuthSession(session);
      if (!session?.user) {
        setAuthProfile(null);
        setAuthRole('client');
        setAvailableRoles(['client']);
        return;
      }

      const profile = await getUserProfile(session.user.id);
      if (!isActive) return;

      setAuthProfile(profile);
      const authState = getResolvedAuthState(session, profile);
      setAuthRole(authState.activeRole);
      setAvailableRoles(authState.availableRoles);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  // Apply requested role from URL params
  useEffect(() => {
    let isActive = true;

    async function applyRequestedRole(pushToast) {
      if (!authSession?.user) return;

      const params = new URLSearchParams(location.search);
      const requestedRole = params.get('auth_role');
      const nextPath = params.get('next');

      if (!requestedRole) return;

      const authState = await syncUserProfile(authSession, requestedRole);
      if (!isActive || !authState) return;

      setAuthProfile(authState.profile);
      setAuthRole(authState.activeRole);
      setAvailableRoles(authState.availableRoles);
      navigate(getSafeNextPath(nextPath, authState.activeRole), { replace: true });
      pushToast?.(
        requestedRole === 'management'
          ? 'Google sign-in complete. Management access is now checked against the allowed email list.'
          : `Signed in successfully as ${requestedRole}.`,
        'success',
        'lock',
      );
    }

    // Return a function that expects pushToast
    return () => {
      isActive = false;
    };
    // We handle this specially in App.jsx by calling a returned function
  }, [authSession, location.pathname, location.search, navigate]);

  // Sync role with route
  useEffect(() => {
    if (!authSession?.user || !availableRoles.length) return;

    const routeRole = getRouteRole(location.pathname);
    if (!routeRole || routeRole === authRole || !availableRoles.includes(routeRole)) return;

    let isActive = true;

    async function syncRoleToRoute() {
      const nextAuthState = await switchUserRole(authSession, routeRole);
      if (!isActive || !nextAuthState) return;

      setAuthProfile(nextAuthState.profile);
      setAuthRole(nextAuthState.activeRole);
      setAvailableRoles(nextAuthState.availableRoles);
    }

    syncRoleToRoute();
    return () => {
      isActive = false;
    };
  }, [authRole, authSession, availableRoles, location.pathname]);

  const openAuthPage = useCallback(
    (role = 'client', nextPath) => {
      navigate(buildAuthPath(role, nextPath || location.pathname));
    },
    [navigate, location.pathname],
  );

  const handleGoogleSignIn = useCallback(async (role, nextPath) => {
    setIsLoggingIn(true);
    const result = await signInWithGoogle(role, buildAuthPath(role, nextPath));
    if (!result?.started) {
      setIsLoggingIn(false);
    }
    return result;
  }, []);

  const handleRoleSelect = useCallback(
    async (role, nextPath, options = {}, pushToast) => {
      if (!authSession?.user) {
        await handleGoogleSignIn(role, nextPath);
        return;
      }

      const nextAuthState = await switchUserRole(authSession, role);
      if (!nextAuthState) return;

      setAuthProfile(nextAuthState.profile);
      setAuthRole(nextAuthState.activeRole);
      setAvailableRoles(nextAuthState.availableRoles);

      if (!nextAuthState.availableRoles.includes(role) || nextAuthState.activeRole !== role) {
        pushToast?.(
          role === 'management' ? 'Management access is limited to allowed emails.' : `Unable to switch to ${role}.`,
          'warning',
          'lock',
        );
        return;
      }

      if (!options.silent) {
        pushToast?.(`Switched to ${nextAuthState.activeRole} role.`, 'success', 'lock');
      }

      const targetPath = getSafeNextPath(nextPath, nextAuthState.activeRole);
      if (options.navigate !== false && location.pathname !== targetPath) {
        navigate(targetPath);
      }
    },
    [authSession, handleGoogleSignIn, navigate, location.pathname],
  );

  const handleSignOut = useCallback(
    async (pushToast) => {
      await signOutCurrentUser();
      pushToast?.('Signed out successfully.', 'info', 'lock');
      navigate(APP_PATHS.landing);
    },
    [navigate],
  );

  return {
    authSession,
    authProfile,
    authRole,
    availableRoles,
    isAuthLoading,
    isLoggingIn,
    setIsLoggingIn,
    openAuthPage,
    handleGoogleSignIn,
    handleRoleSelect,
    handleSignOut,
  };
}

export { getDefaultPathForRole, getSafeNextPath, buildAuthPath, getRouteRole };
