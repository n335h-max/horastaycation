import { Suspense, lazy, startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { SiteFooter, SiteHeader, ToastStack } from './components/SiteChrome';
import { SupportWidget } from './components/SupportWidget';
import { FEATURED_PROPERTIES } from './data/siteData';
import { getWishlistIds, isRangeBlocked, summarizeAnalytics } from './lib/guestFeatures';
import { getMediaObjectUrl, revokeMediaObjectUrls } from './lib/mediaStorage';
import { DEFAULT_COOKIE_PREFERENCES, readCookiePreferences, saveCookiePreferences } from './lib/privacyPreferences';
import { clearPendingStripeCheckout, getPendingStripeCheckout, savePendingStripeCheckout } from './lib/stripeCheckout';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { validateWithSchema, bookingSchema } from './lib/validation';
import { APP_PATHS, getPageFromPath, getPathFromPage } from './lib/routes';
import {
  getSnapshot,
  deleteManagementListing,
  saveBookingDraft,
  saveManagementListing,
  submitBooking,
  submitOwnerApplication,
  submitReview,
  submitSupportRequest,
  syncRemoteData,
  toggleWishlistProperty,
  trackAnalyticsEvent,
  updateBookingTransactionDetails,
  updateBookingTransactionStatus,
} from './services/horaApi';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SERVICE_FEE_RATE, TOAST_DURATION_MS, INSTALL_PROMPT_EVENT } from './lib/constants';
import { AuthLoginPageRoute } from './pages/AuthLoginPageRoute';
import {
  getCurrentSession,
  getResolvedAuthState,
  getUserProfile,
  signInWithGoogle,
  signOutCurrentUser,
  switchUserRole,
  syncUserProfile,
} from './services/authApi';

const LandingPageRoute = lazy(() =>
  import('./pages/LandingPageRoute').then((module) => ({ default: module.LandingPageRoute })),
);
const OwnerSignupPageRoute = lazy(() =>
  import('./pages/OwnerSignupPageRoute').then((module) => ({ default: module.OwnerSignupPageRoute })),
);
const OwnerDashboardPageRoute = lazy(() =>
  import('./pages/OwnerDashboardPageRoute').then((module) => ({ default: module.OwnerDashboardPageRoute })),
);
const BookingPageRoute = lazy(() =>
  import('./pages/BookingPageRoute').then((module) => ({ default: module.BookingPageRoute })),
);
const ReviewPageRoute = lazy(() =>
  import('./pages/ReviewPageRoute').then((module) => ({ default: module.ReviewPageRoute })),
);
const DashboardPageRoute = lazy(() =>
  import('./pages/DashboardPageRoute').then((module) => ({ default: module.DashboardPageRoute })),
);
const ManagementListingsPageRoute = lazy(() =>
  import('./pages/ManagementListingsPageRoute').then((module) => ({ default: module.ManagementListingsPageRoute })),
);
const SuccessPageRoute = lazy(() =>
  import('./pages/SuccessPageRoute').then((module) => ({ default: module.SuccessPageRoute })),
);
const PrivacyPolicyPageRoute = lazy(() =>
  import('./pages/PrivacyPolicyPageRoute').then((module) => ({ default: module.PrivacyPolicyPageRoute })),
);
const PaymentModal = lazy(() =>
  import('./components/PaymentModal').then((module) => ({ default: module.PaymentModal })),
);

function RouteLoadingFallback() {
  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-6xl animate-pulse rounded-[2rem] border border-brand-100 bg-white p-8 shadow-lg">
        <div className="mb-6 h-6 w-32 rounded-full bg-brand-100" />
        <div className="mb-3 h-12 max-w-xl rounded-2xl bg-brand-100" />
        <div className="mb-10 h-5 max-w-2xl rounded-full bg-slate-100" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-72 rounded-[2rem] bg-slate-100" />
          <div className="h-72 rounded-[2rem] bg-slate-100" />
        </div>
      </div>
    </section>
  );
}

function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
        <p className="mt-4 text-sm font-medium text-slate-600">Loading secure checkout…</p>
      </div>
    </div>
  );
}

function useFormatters() {
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }),
    [],
  );
  const compactFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }),
    [],
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [],
  );

  return {
    formatCurrency: (value) => currencyFormatter.format(value),
    formatCompactNumber: (value) => compactFormatter.format(value),
    formatDate: (value) => (value ? dateFormatter.format(new Date(value)) : 'Select dates'),
  };
}

const ROLE_DEFAULT_PATHS = {
  owner: APP_PATHS.ownerSignup,
  client: APP_PATHS.booking,
  management: APP_PATHS.dashboard,
};
const LISTING_SYNC_PATHS = new Set([
  APP_PATHS.landing,
  APP_PATHS.booking,
  APP_PATHS.dashboard,
  APP_PATHS.managementListings,
]);
const BOOKING_SYNC_PATHS = new Set([APP_PATHS.dashboard]);

function getDefaultPathForRole(role) {
  return ROLE_DEFAULT_PATHS[role] || APP_PATHS.booking;
}

function getSafeNextPath(nextPath, role) {
  if (typeof nextPath === 'string' && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
    return nextPath;
  }

  return getDefaultPathForRole(role);
}

function getAuthReturnPath(role, nextPath) {
  const safeNextPath = getSafeNextPath(nextPath, role);

  if (safeNextPath === APP_PATHS.authLogin) {
    return getDefaultPathForRole(role);
  }

  return safeNextPath;
}

function buildAuthPath(role, nextPath) {
  const params = new URLSearchParams();
  params.set('role', role);
  params.set('next', getAuthReturnPath(role, nextPath));
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

function RoleProtectedRoute({ authUser, availableRoles, requiredRole, fallbackPath, children }) {
  if (!authUser) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!availableRoles.includes(requiredRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = getPageFromPath(location.pathname);
  const authSearchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedAuthRole = authSearchParams.get('role') || authSearchParams.get('auth_role') || 'client';
  const requestedNextPath = authSearchParams.get('next') || '';
  const bookingSuccessSessionId = authSearchParams.get('session_id') || '';
  const bookingCheckoutState = authSearchParams.get('checkout') || '';
  const shouldSyncListings = LISTING_SYNC_PATHS.has(location.pathname);
  const shouldSyncBookings = BOOKING_SYNC_PATHS.has(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [store, setStore] = useState(() => getSnapshot());
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [bookingErrors, setBookingErrors] = useState({});
  const [isOpeningPayment, setIsOpeningPayment] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isVerifyingStripePayment, setIsVerifyingStripePayment] = useState(false);
  const [stripeVerificationError, setStripeVerificationError] = useState('');
  const [isSubmittingOwner, setIsSubmittingOwner] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resolvedListings, setResolvedListings] = useState([]);
  const [cookiePreferences, setCookiePreferences] = useState(() => readCookiePreferences());
  const [cookieBannerOpen, setCookieBannerOpen] = useState(() => !readCookiePreferences());
  const [supportWidgetOpen, setSupportWidgetOpen] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [authSession, setAuthSession] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [authRole, setAuthRole] = useState('client');
  const [availableRoles, setAvailableRoles] = useState(['client']);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(isSupabaseConfigured));
  const hasHydratedListingsRef = useRef(false);
  const hasHydratedBookingsRef = useRef(false);
  const handledRequestedRoleRef = useRef('');

  const { formatCurrency, formatCompactNumber, formatDate } = useFormatters();
  const sourceListings = store.managementListings?.length ? store.managementListings : FEATURED_PROPERTIES;
  const dashboardListings = resolvedListings.length ? resolvedListings : sourceListings;
  const featuredListings = dashboardListings.filter(
    (listing) => listing.publishStatus !== 'draft' && !listing.isDeleted,
  );
  const wishlistIds = useMemo(() => getWishlistIds(store, authSession?.user), [authSession?.user, store]);
  const analyticsSummary = useMemo(
    () =>
      summarizeAnalytics(store.analyticsEvents, store.bookingTransactions, store.supportRequests, store.wishlistByUser),
    [store.analyticsEvents, store.bookingTransactions, store.supportRequests, store.wishlistByUser],
  );
  const canInstallApp = Boolean(deferredInstallPrompt);
  const headerAction =
    location.pathname === APP_PATHS.dashboard
      ? { label: '+ New Listing', onClick: () => navigate(APP_PATHS.managementListings) }
      : location.pathname === APP_PATHS.managementListings
        ? { label: 'Back to Dashboard', onClick: () => navigate(APP_PATHS.dashboard) }
        : null;

  function handleGoToDashboard() {
    if (authRole === 'management') {
      navigate(APP_PATHS.dashboard);
      return;
    }

    if (authRole === 'owner') {
      navigate(APP_PATHS.ownerDashboard);
      return;
    }

    navigate(APP_PATHS.booking);
  }

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startTransition(() => {
      setMobileOpen(false);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === APP_PATHS.landing && location.hash) {
      const target = window.document.getElementById(location.hash.replace('#', ''));
      if (target) {
        window.setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    }

    window.addEventListener(INSTALL_PROMPT_EVENT, handleBeforeInstallPrompt);
    return () => window.removeEventListener(INSTALL_PROMPT_EVENT, handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!toasts.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, TOAST_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveBookingDraft(store.bookingDraft);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [store.bookingDraft]);

  useEffect(() => {
    let isActive = true;
    const includeListings = shouldSyncListings && !hasHydratedListingsRef.current;
    const includeBookings = shouldSyncBookings && !hasHydratedBookingsRef.current;
    const shouldHydrate = includeListings || includeBookings;

    if (!shouldHydrate) {
      return undefined;
    }

    async function hydrateRemoteData() {
      const result = await syncRemoteData({ includeBookings, includeListings });

      if (!isActive) {
        return;
      }

      setStore(result.store);
      if (includeListings) {
        hasHydratedListingsRef.current = true;
      }
      if (includeBookings) {
        hasHydratedBookingsRef.current = true;
      }
    }

    hydrateRemoteData();

    return () => {
      isActive = false;
    };
  }, [shouldSyncBookings, shouldSyncListings]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    let isActive = true;

    async function hydrateSession() {
      const session = await getCurrentSession();

      if (!isActive) {
        return;
      }

      setAuthSession(session);
      if (!session?.user) {
        setAuthProfile(null);
        setAuthRole('client');
        setAvailableRoles(['client']);
        setIsAuthLoading(false);
        return;
      }

      setIsAuthLoading(false);

      const profile = await getUserProfile(session.user.id);

      if (!isActive) {
        return;
      }

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
      if (!isActive) {
        return;
      }

      setAuthSession(session);

      if (!session?.user) {
        setAuthProfile(null);
        setAuthRole('client');
        setAvailableRoles(['client']);
        return;
      }

      setIsAuthLoading(false);

      const profile = await getUserProfile(session.user.id);

      if (!isActive) {
        return;
      }

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

  useEffect(() => {
    let isActive = true;

    async function applyRequestedRole() {
      if (!authSession?.user) {
        handledRequestedRoleRef.current = '';
        return;
      }

      const requestKey = `${authSession.user.id}:${authSession.access_token || ''}:${location.pathname}:${location.search}`;

      if (handledRequestedRoleRef.current === requestKey) {
        return;
      }

      const params = new URLSearchParams(location.search);
      const requestedRole = params.get('auth_role');
      const nextPath = params.get('next');

      if (!requestedRole) {
        return;
      }

      handledRequestedRoleRef.current = requestKey;

      const authState = getResolvedAuthState(authSession, authProfile, requestedRole);

      if (!isActive) {
        return;
      }

      setAuthRole(authState.activeRole);
      setAvailableRoles(authState.availableRoles);
      navigate(getSafeNextPath(nextPath, authState.activeRole), { replace: true });
      pushToast(
        requestedRole === 'management'
          ? 'Google sign-in complete. Management access is now checked against the allowed email list.'
          : `Signed in successfully as ${requestedRole}.`,
        'success',
        'lock',
      );

      void syncUserProfile(authSession, requestedRole)
        .then((nextAuthState) => {
          if (!isActive || !nextAuthState) {
            return;
          }

          setAuthProfile(nextAuthState.profile);
          setAuthRole(nextAuthState.activeRole);
          setAvailableRoles(nextAuthState.availableRoles);
        })
        .catch(() => {
          /* noop */
        });
    }

    applyRequestedRole();

    return () => {
      isActive = false;
    };
  }, [authSession, authProfile, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!authSession?.user || !availableRoles.length) {
      return;
    }

    const routeRole = getRouteRole(location.pathname);

    if (!routeRole || routeRole === authRole || !availableRoles.includes(routeRole)) {
      return;
    }

    let isActive = true;

    async function syncRoleToRoute() {
      const nextAuthState = await switchUserRole(authSession, routeRole);

      if (!isActive || !nextAuthState) {
        return;
      }

      setAuthProfile(nextAuthState.profile);
      setAuthRole(nextAuthState.activeRole);
      setAvailableRoles(nextAuthState.availableRoles);
    }

    syncRoleToRoute();

    return () => {
      isActive = false;
    };
  }, [authRole, authSession, availableRoles, location.pathname]);

  useEffect(() => {
    if (!shouldSyncListings) {
      return undefined;
    }

    let isActive = true;
    let nextUrls = [];

    async function resolveListings() {
      try {
        const listings = await Promise.all(
          sourceListings.map(async (listing) => {
            const [imageUrl, summaryImageUrl, thumbnailUrl, videoUrl] = await Promise.all([
              listing.imageAsset ? getMediaObjectUrl(listing.imageAsset) : Promise.resolve(''),
              listing.summaryImageAsset ? getMediaObjectUrl(listing.summaryImageAsset) : Promise.resolve(''),
              listing.thumbnailAsset ? getMediaObjectUrl(listing.thumbnailAsset) : Promise.resolve(''),
              listing.videoAsset ? getMediaObjectUrl(listing.videoAsset) : Promise.resolve(''),
            ]);

            const resolvedListing = {
              ...listing,
              image: imageUrl || listing.image,
              summaryImage: summaryImageUrl || listing.summaryImage || imageUrl || listing.image,
              thumbnail: thumbnailUrl || listing.thumbnail || imageUrl || listing.image,
              videoUrl: videoUrl || listing.videoUrl || '',
            };

            nextUrls = [
              ...nextUrls,
              resolvedListing.image,
              resolvedListing.summaryImage,
              resolvedListing.thumbnail,
              resolvedListing.videoUrl,
            ];

            return resolvedListing;
          }),
        );

        if (!isActive) {
          revokeMediaObjectUrls(nextUrls);
          return;
        }

        setResolvedListings(listings);
      } catch {
        if (isActive) {
          setResolvedListings(sourceListings);
        }
      }
    }

    resolveListings();

    return () => {
      isActive = false;
      revokeMediaObjectUrls(nextUrls);
    };
  }, [shouldSyncListings, sourceListings]);

  function pushToast(message, type = 'info', icon = 'email') {
    setToasts((current) => [...current, { id: crypto.randomUUID(), message, type, icon }]);
  }

  function showPage(page) {
    navigate(getPathFromPage(page));
  }

  function handleCookiePreferenceChange(preferences) {
    const nextPreferences = saveCookiePreferences(preferences);
    setCookiePreferences(nextPreferences);
    setCookieBannerOpen(false);
    return nextPreferences;
  }

  function handleAcceptAllCookies() {
    handleCookiePreferenceChange({
      essential: true,
      analytics: true,
      personalization: true,
    });
    pushToast('Cookie preferences updated. Optional analytics and personalization are enabled.', 'success', 'lock');
  }

  function handleEssentialOnlyCookies() {
    handleCookiePreferenceChange({
      essential: true,
      analytics: false,
      personalization: false,
    });
    pushToast('Cookie preferences updated. Only essential storage stays active.', 'info', 'lock');
  }

  function handleManageCookies() {
    setCookieBannerOpen(true);
    navigate(APP_PATHS.privacyPolicy);
  }

  function scrollToSection(sectionId, closeMobile = false) {
    if (location.pathname !== APP_PATHS.landing) {
      navigate({ pathname: APP_PATHS.landing, hash: `#${sectionId}` });
    } else {
      window.document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState({}, '', `/#${sectionId}`);
    }

    if (closeMobile) {
      setMobileOpen(false);
    }
  }

  async function recordAnalytics(type, payload = {}) {
    if (!cookiePreferences?.analytics) {
      return null;
    }

    const result = await trackAnalyticsEvent({
      type,
      page: activePage,
      path: location.pathname,
      ...payload,
    });
    setStore(result.store);
    return result;
  }

  useEffect(() => {
    startTransition(() => {
      void recordAnalytics('page_view');
    });
  }, [cookiePreferences?.analytics, location.pathname, recordAnalytics]);

  function handleBookingChange(event) {
    const { name, value } = event.target;
    setStore((current) => ({
      ...current,
      bookingDraft: {
        ...current.bookingDraft,
        [name]: value,
      },
    }));

    if (bookingErrors[name]) {
      setBookingErrors((current) => ({ ...current, [name]: undefined }));
    }
  }

  const bookingSummary = useMemo(() => {
    const property = featuredListings.find((item) => item.id === store.bookingDraft.property);
    if (!property || !store.bookingDraft.checkin || !store.bookingDraft.checkout) {
      return null;
    }

    const checkinDate = new Date(store.bookingDraft.checkin);
    const checkoutDate = new Date(store.bookingDraft.checkout);
    const diffInDays = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

    if (Number.isNaN(diffInDays) || diffInDays <= 0) {
      return null;
    }

    const subtotal = diffInDays * property.price;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);

    return {
      name: property.name,
      location: property.location,
      price: property.price,
      image: property.summaryImage,
      checkin: store.bookingDraft.checkin,
      checkout: store.bookingDraft.checkout,
      nights: diffInDays,
      subtotal,
      serviceFee,
      total: subtotal + serviceFee,
    };
  }, [featuredListings, store.bookingDraft]);

  useEffect(() => {
    if (location.pathname !== APP_PATHS.bookingSuccess || !bookingSuccessSessionId) {
      return;
    }

    let isActive = true;

    async function verifyStripePayment() {
      const pendingCheckout = getPendingStripeCheckout(bookingSuccessSessionId);

      if (!pendingCheckout) {
        if (isActive) {
          setStripeVerificationError(
            'Stripe returned successfully, but the pending booking data was not found on this device.',
          );
        }
        return;
      }

      setIsVerifyingStripePayment(true);
      setStripeVerificationError('');

      try {
        const response = await fetch(
          `/api/verify-checkout-session?session_id=${encodeURIComponent(bookingSuccessSessionId)}`,
        );
        const payload = await response.json();

        if (!response.ok || !payload?.paid) {
          throw new Error(payload?.error || 'Stripe has not marked this checkout as paid yet.');
        }

        const bookingResult = await submitBooking({
          bookingForm: pendingCheckout.bookingForm,
          bookingSummary: pendingCheckout.bookingSummary,
          paymentForm: {
            cardLast4: payload.cardLast4 || '',
            cardholder: payload.customerName || pendingCheckout.bookingForm.guestName,
          },
          paymentMeta: {
            provider: 'stripe',
            stripeSessionId: bookingSuccessSessionId,
            stripePaymentIntentId: payload.paymentIntentId || '',
            paymentStatus: payload.paymentStatus || 'paid',
            customerReceiptEmail: payload.customerEmail || pendingCheckout.bookingForm.guestEmail || '',
            statusNote: 'Confirmed by Stripe hosted checkout.',
          },
        });

        if (!isActive) {
          return;
        }

        setStore(bookingResult.store);
        clearPendingStripeCheckout(bookingSuccessSessionId);
        setPaymentOpen(false);
        setBookingErrors({});
        pushToast('Stripe payment confirmed. Booking saved successfully.', 'success', 'lock');
        await recordAnalytics('stripe_payment_success', { sessionId: bookingSuccessSessionId });

        if (!bookingResult.remote.saved && !bookingResult.remote.alreadyProcessed) {
          pushToast(
            'Payment is confirmed, but the booking only saved locally because remote sync is not fully configured.',
            'warning',
            'calendar',
          );
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStripeVerificationError(error instanceof Error ? error.message : 'Stripe payment verification failed.');
      } finally {
        if (isActive) {
          setIsVerifyingStripePayment(false);
        }
      }
    }

    verifyStripePayment();

    return () => {
      isActive = false;
    };
  }, [bookingSuccessSessionId, location.pathname]);

  useEffect(() => {
    if (location.pathname !== APP_PATHS.booking || bookingCheckoutState !== 'cancelled') {
      return;
    }

    pushToast(
      'Stripe checkout was cancelled. Your booking details are still here if you want to try again.',
      'warning',
      'lock',
    );
    startTransition(() => {
      void recordAnalytics('stripe_checkout_cancelled', {
        propertyId: store.bookingDraft.property || '',
      });
    });
  }, [bookingCheckoutState, location.pathname, recordAnalytics, store.bookingDraft.property]);

  function handleProceedToPayment(event) {
    event.preventDefault();
    setIsOpeningPayment(true);
    const result = validateWithSchema(bookingSchema, store.bookingDraft);

    if (!result.success) {
      setBookingErrors(result.errors);
      pushToast('Fix the highlighted booking fields before continuing.', 'warning', 'calendar');
      setIsOpeningPayment(false);
      return;
    }

    if (!bookingSummary) {
      setBookingErrors({ checkout: ['Check-out must be after check-in.'] });
      pushToast('Select valid dates to continue to payment.', 'warning', 'calendar');
      setIsOpeningPayment(false);
      return;
    }

    const selectedProperty = featuredListings.find((item) => item.id === store.bookingDraft.property);

    if (isRangeBlocked(selectedProperty, store.bookingDraft.checkin, store.bookingDraft.checkout)) {
      setBookingErrors({ checkin: ['Selected dates are unavailable for this staycation.'] });
      pushToast('Selected dates are unavailable. Please choose a different stay window.', 'warning', 'calendar');
      setIsOpeningPayment(false);
      return;
    }

    setBookingErrors({});
    setStripeVerificationError('');
    setPaymentOpen(true);
    setIsOpeningPayment(false);
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault();
    setIsSubmittingPayment(true);

    if (!bookingSummary) {
      pushToast('Your booking summary is incomplete.', 'warning', 'calendar');
      setIsSubmittingPayment(false);
      return;
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingForm: store.bookingDraft,
          bookingSummary,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.url || !payload?.sessionId) {
        throw new Error(payload?.error || 'Unable to start Stripe checkout.');
      }

      savePendingStripeCheckout(payload.sessionId, {
        bookingForm: store.bookingDraft,
        bookingSummary,
      });
      await recordAnalytics('stripe_checkout_started', {
        propertyId: store.bookingDraft.property,
        sessionId: payload.sessionId,
      });
      window.location.assign(payload.url);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Unable to start Stripe checkout.', 'warning', 'lock');
      setIsSubmittingPayment(false);
      return;
    }

    setIsSubmittingPayment(false);
  }

  async function handleOwnerSubmit(values) {
    setIsSubmittingOwner(true);
    const result = await submitOwnerApplication(values);
    setStore(result.store);
    pushToast('Owner request submitted successfully.', 'success', 'send');
    if (!result.remote.saved) {
      pushToast(
        'Owner request saved locally. Update the Supabase schema if you want the new fields synced remotely.',
        'warning',
        'calendar',
      );
    }
    setIsSubmittingOwner(false);
    navigate(APP_PATHS.ownerSuccess);
  }

  async function handleReviewSubmit(values) {
    setIsSubmittingReview(true);
    const result = await submitReview(values);
    setStore(result.store);
    pushToast('Evaluation request submitted successfully.', 'success', 'send');
    if (!result.remote.saved) {
      pushToast(
        'Evaluation request saved locally. Update the Supabase schema if you want the new fields synced remotely.',
        'warning',
        'calendar',
      );
    }
    setIsSubmittingReview(false);
    navigate(APP_PATHS.reviewSuccess);
  }

  function openAuthPage(role = 'client', nextPath) {
    navigate(buildAuthPath(role, getAuthReturnPath(role, nextPath || location.pathname)));
  }

  async function handleGoogleSignIn(role, nextPath) {
    setIsLoggingIn(true);
    const result = await signInWithGoogle(role, buildAuthPath(role, getAuthReturnPath(role, nextPath)));
    if (!result?.started) {
      pushToast('Google sign-in is unavailable until Supabase is configured.', 'warning', 'lock');
    }
    setIsLoggingIn(false);
  }

  async function handleRoleSelect(role, nextPath, options = {}) {
    if (!authSession?.user) {
      await handleGoogleSignIn(role, nextPath);
      return;
    }

    const nextAuthState = await switchUserRole(authSession, role);

    if (!nextAuthState) {
      return;
    }

    setAuthProfile(nextAuthState.profile);
    setAuthRole(nextAuthState.activeRole);
    setAvailableRoles(nextAuthState.availableRoles);

    if (!nextAuthState.availableRoles.includes(role) || nextAuthState.activeRole !== role) {
      pushToast(
        role === 'management' ? 'Management access is limited to allowed emails.' : `Unable to switch to ${role}.`,
        'warning',
        'lock',
      );
      return;
    }

    if (!options.silent) {
      pushToast(`Switched to ${nextAuthState.activeRole} role.`, 'success', 'lock');
    }

    const targetPath = getSafeNextPath(nextPath, nextAuthState.activeRole);
    if (options.navigate !== false && location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }

  async function handleManagementListingSave(values) {
    const result = await saveManagementListing(values);
    setStore(result.store);
    pushToast('Management listing updated successfully.', 'success', 'upload');

    if (result.remote.saved) {
      pushToast(
        result.remote.uploadedMediaCount
          ? `Listing synced to Supabase with ${result.remote.uploadedMediaCount} uploaded media file(s).`
          : 'Listing synced to Supabase successfully.',
        'info',
        'lock',
      );
    } else {
      pushToast(
        'Listing saved locally. Run the Supabase schema and configure env vars to enable shared uploads.',
        'warning',
        'calendar',
      );
    }
  }

  async function handleManagementListingDelete(listingId) {
    const result = await deleteManagementListing(listingId);
    setStore(result.store);
    pushToast('Listing deleted successfully.', 'success', 'upload');
  }

  async function handleBookingStatusChange(bookingId, bookingStatus) {
    const result = await updateBookingTransactionStatus(bookingId, bookingStatus);
    setStore(result.store);
    pushToast(`Booking marked as ${bookingStatus}.`, 'success', 'calendar');
  }

  async function handleBookingCancellation(booking) {
    const result = await updateBookingTransactionDetails(booking.id, {
      bookingStatus: 'cancelled',
      paymentStatus: booking.paymentStatus === 'paid' ? booking.paymentStatus : 'cancelled',
      cancelledAt: new Date().toISOString(),
      statusNote:
        booking.paymentStatus === 'paid'
          ? 'Booking cancelled by management. Refund can be processed separately.'
          : 'Booking and unpaid checkout cancelled by management.',
    });
    setStore(result.store);
    pushToast('Booking marked as cancelled.', 'success', 'calendar');
    await recordAnalytics('booking_cancelled', { bookingId: booking.id });
  }

  async function handleBookingRefund(booking) {
    try {
      const response = await fetch('/api/refund-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: booking.stripePaymentIntentId,
          stripeSessionId: booking.stripeSessionId,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Stripe refund failed.');
      }

      const result = await updateBookingTransactionDetails(booking.id, {
        bookingStatus: 'refunded',
        paymentStatus: 'refunded',
        refundStatus: payload.status || 'succeeded',
        refundId: payload.refundId || '',
        refundedAt: new Date().toISOString(),
        stripePaymentIntentId: payload.paymentIntentId || booking.stripePaymentIntentId || '',
        statusNote: 'Refund issued by management through Stripe.',
      });
      setStore(result.store);
      pushToast('Stripe refund completed and booking updated.', 'success', 'lock');
      await recordAnalytics('stripe_refund_success', { bookingId: booking.id, refundId: payload.refundId || '' });
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'Stripe refund failed.', 'warning', 'lock');
    }
  }

  async function handleWishlistToggle(propertyId) {
    const result = await toggleWishlistProperty({
      authUser: authSession?.user,
      propertyId,
    });
    setStore(result.store);
    pushToast(
      result.saved ? 'Stay saved to your wishlist.' : 'Stay removed from your wishlist.',
      result.saved ? 'success' : 'info',
      'heart',
    );
    await recordAnalytics(result.saved ? 'wishlist_add' : 'wishlist_remove', { propertyId });
  }

  async function handleBookingSearch(criteria) {
    await recordAnalytics('search', {
      query: criteria.query || '',
      locationFilter: criteria.location || '',
      resultCount: criteria.resultCount || 0,
      checkin: criteria.checkin || '',
      checkout: criteria.checkout || '',
      guests: criteria.guests || '',
    });
  }

  async function handleSupportOpen(source = activePage) {
    setSupportWidgetOpen(true);
    await recordAnalytics('support_open', { source });
  }

  async function handleSupportSubmit(payload) {
    const result = await submitSupportRequest(payload);
    setStore(result.store);
    setSupportWidgetOpen(false);
    pushToast('Support request sent. Hora can follow up by email.', 'success', 'comment');
    await recordAnalytics('support_submit', {
      topic: payload.topic,
      source: payload.pageContext || activePage,
    });
  }

  async function handleInstallApp() {
    if (!deferredInstallPrompt) {
      pushToast('This browser can still install Hora from its share or menu options.', 'info', 'mobile');
      return;
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
    await recordAnalytics('install_prompt', { outcome: choice.outcome });

    pushToast(
      choice.outcome === 'accepted' ? 'Hora was added to your device.' : 'Install prompt dismissed.',
      choice.outcome === 'accepted' ? 'success' : 'info',
      'download',
    );
  }

  async function handleSignOut() {
    await signOutCurrentUser();
    pushToast('Signed out successfully.', 'info', 'lock');
    navigate(APP_PATHS.landing);
  }

  const showFooter =
    location.pathname !== APP_PATHS.dashboard &&
    location.pathname !== APP_PATHS.managementListings &&
    location.pathname !== APP_PATHS.ownerDashboard &&
    location.pathname !== APP_PATHS.managementLogin &&
    location.pathname !== APP_PATHS.authLogin;
  const showSupportWidget =
    location.pathname !== APP_PATHS.dashboard &&
    location.pathname !== APP_PATHS.managementListings &&
    location.pathname !== APP_PATHS.ownerDashboard &&
    location.pathname !== APP_PATHS.authLogin;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <ToastStack toasts={toasts} />
      <SiteHeader
        activePage={activePage}
        mobileOpen={mobileOpen}
        onToggleMobile={(forced) => setMobileOpen((current) => (typeof forced === 'boolean' ? forced : !current))}
        onShowPage={showPage}
        onScrollToSection={scrollToSection}
        authUser={authSession?.user}
        authRole={authRole}
        availableRoles={availableRoles}
        onRoleSwitch={(role) => handleRoleSelect(role, getDefaultPathForRole(role))}
        onGoToDashboard={handleGoToDashboard}
        onOpenAuth={() => openAuthPage(getRouteRole(location.pathname) || 'client', location.pathname)}
        onSignOut={handleSignOut}
        headerAction={headerAction}
      />

      <main id="main-content">
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route
                path={APP_PATHS.landing}
                element={
                  <LandingPageRoute
                    onShowPage={showPage}
                    onScrollToSection={scrollToSection}
                    featuredProperties={featuredListings}
                    formatCompactNumber={formatCompactNumber}
                    formatCurrency={formatCurrency}
                    wishlistCount={wishlistIds.length}
                    analyticsSummary={analyticsSummary}
                    onOpenSupport={() => handleSupportOpen('landing')}
                    canInstallApp={canInstallApp}
                    onInstallApp={handleInstallApp}
                  />
                }
              />
              <Route
                path={APP_PATHS.privacyPolicy}
                element={
                  <PrivacyPolicyPageRoute onShowPage={showPage} onManageCookies={() => setCookieBannerOpen(true)} />
                }
              />
              <Route
                path={APP_PATHS.authLogin}
                element={
                  <AuthLoginPageRoute
                    authUser={authSession?.user}
                    authRole={authRole}
                    availableRoles={availableRoles}
                    isSubmitting={isLoggingIn}
                    isAuthLoading={isAuthLoading}
                    requestedRole={requestedAuthRole}
                    nextPath={requestedNextPath}
                    onSelectRole={(role) => handleRoleSelect(role, requestedNextPath || getDefaultPathForRole(role))}
                    onShowPage={showPage}
                    onSignOut={handleSignOut}
                  />
                }
              />
              <Route
                path={APP_PATHS.ownerSignup}
                element={
                  <OwnerSignupPageRoute
                    onShowPage={showPage}
                    onSubmitOwner={handleOwnerSubmit}
                    isSubmitting={isSubmittingOwner}
                    authUser={authSession?.user}
                    authRole={authRole}
                    availableRoles={availableRoles}
                    isAuthLoading={isAuthLoading}
                    onOpenAuth={() => openAuthPage('owner', APP_PATHS.ownerSignup)}
                  />
                }
              />
              <Route
                path={APP_PATHS.ownerDashboard}
                element={
                  <RoleProtectedRoute
                    authUser={authSession?.user}
                    availableRoles={availableRoles}
                    requiredRole="owner"
                    fallbackPath={buildAuthPath('owner', APP_PATHS.ownerDashboard)}
                  >
                    <OwnerDashboardPageRoute
                      ownerApplications={store.ownerApplications}
                      bookingTransactions={store.bookingTransactions}
                      emails={store.dashboardEmails}
                      onShowPage={showPage}
                      onSignOut={handleSignOut}
                      authUser={authSession?.user}
                      formatCurrency={formatCurrency}
                    />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path={APP_PATHS.booking}
                element={
                  <BookingPageRoute
                    properties={featuredListings}
                    bookingForm={store.bookingDraft}
                    bookingErrors={bookingErrors}
                    isSubmitting={isOpeningPayment}
                    onBookingChange={handleBookingChange}
                    onShowPage={showPage}
                    onProceedToPayment={handleProceedToPayment}
                    bookingSummary={bookingSummary}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    authUser={authSession?.user}
                    authRole={authRole}
                    availableRoles={availableRoles}
                    isAuthLoading={isAuthLoading}
                    onOpenAuth={() => openAuthPage('client', APP_PATHS.booking)}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={handleWishlistToggle}
                    onSearch={handleBookingSearch}
                    onOpenSupport={() => handleSupportOpen('booking')}
                    canInstallApp={canInstallApp}
                    onInstallApp={handleInstallApp}
                  />
                }
              />
              <Route
                path={APP_PATHS.review}
                element={
                  <ReviewPageRoute
                    onShowPage={showPage}
                    onSubmitReview={handleReviewSubmit}
                    isSubmitting={isSubmittingReview}
                  />
                }
              />
              <Route
                path={APP_PATHS.managementLogin}
                element={<Navigate to={buildAuthPath('management', APP_PATHS.dashboard)} replace />}
              />
              <Route
                path={APP_PATHS.bookingSuccess}
                element={
                  <SuccessPageRoute
                    variant="booking"
                    onShowPage={showPage}
                    isLoading={isVerifyingStripePayment}
                    errorMessage={stripeVerificationError}
                  />
                }
              />
              <Route
                path={APP_PATHS.ownerSuccess}
                element={<SuccessPageRoute variant="owner" onShowPage={showPage} />}
              />
              <Route
                path={APP_PATHS.reviewSuccess}
                element={<SuccessPageRoute variant="review" onShowPage={showPage} />}
              />
              <Route
                path={APP_PATHS.dashboard}
                element={
                  <RoleProtectedRoute
                    authUser={authSession?.user}
                    availableRoles={availableRoles}
                    requiredRole="management"
                    fallbackPath={buildAuthPath('management', APP_PATHS.dashboard)}
                  >
                    <DashboardPageRoute
                      listings={dashboardListings}
                      bookings={store.dashboardBookings}
                      bookingTransactions={store.bookingTransactions}
                      emails={store.dashboardEmails}
                      revenue={store.dashboardRevenue}
                      ownerApplications={store.ownerApplications}
                      reviewSubmissions={store.reviewSubmissions}
                      onSaveListing={handleManagementListingSave}
                      onDeleteListing={handleManagementListingDelete}
                      onUpdateBookingStatus={handleBookingStatusChange}
                      onRefundBooking={handleBookingRefund}
                      onCancelBooking={handleBookingCancellation}
                      onShowPage={showPage}
                      onSignOut={handleSignOut}
                      authUser={authSession?.user}
                      formatCurrency={formatCurrency}
                      analyticsEvents={store.analyticsEvents}
                      supportRequests={store.supportRequests}
                    />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path={APP_PATHS.managementListings}
                element={
                  <RoleProtectedRoute
                    authUser={authSession?.user}
                    availableRoles={availableRoles}
                    requiredRole="management"
                    fallbackPath={buildAuthPath('management', APP_PATHS.managementListings)}
                  >
                    <ManagementListingsPageRoute
                      listings={dashboardListings}
                      bookings={store.dashboardBookings}
                      revenue={store.dashboardRevenue}
                      ownerApplications={store.ownerApplications}
                      reviewSubmissions={store.reviewSubmissions}
                      onSaveListing={handleManagementListingSave}
                      onDeleteListing={handleManagementListingDelete}
                      onShowPage={showPage}
                      onSignOut={handleSignOut}
                      authUser={authSession?.user}
                      formatCurrency={formatCurrency}
                    />
                  </RoleProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to={APP_PATHS.landing} replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {showFooter ? <SiteFooter onShowPage={showPage} onManageCookies={handleManageCookies} /> : null}

      {showSupportWidget ? (
        <SupportWidget
          open={supportWidgetOpen}
          onOpen={() => handleSupportOpen(activePage)}
          onClose={() => setSupportWidgetOpen(false)}
          onSubmit={handleSupportSubmit}
          authUser={authSession?.user}
          currentPage={activePage}
        />
      ) : null}

      {paymentOpen && bookingSummary ? (
        <Suspense fallback={<ModalLoadingFallback />}>
          <PaymentModal
            open={paymentOpen}
            summary={bookingSummary}
            isSubmitting={isSubmittingPayment}
            onClose={() => setPaymentOpen(false)}
            onSubmit={handlePaymentSubmit}
            formatCurrency={formatCurrency}
          />
        </Suspense>
      ) : null}

      <CookieConsentBanner
        open={cookieBannerOpen}
        preferences={cookiePreferences || DEFAULT_COOKIE_PREFERENCES}
        onAcceptAll={handleAcceptAllCookies}
        onEssentialOnly={handleEssentialOnlyCookies}
        onManagePrivacy={() => navigate(APP_PATHS.privacyPolicy)}
      />
    </>
  );
}
