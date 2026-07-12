import { Suspense, lazy, startTransition, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { importWithChunkRecovery } from './lib/importWithChunkRecovery';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { SiteFooter, SiteHeader, ToastStack } from './components/SiteChrome';
import { SupportWidget } from './components/SupportWidget';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteLoadingFallback } from './components/RouteLoadingFallback';
import { ModalLoadingFallback } from './components/ModalLoadingFallback';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { APP_PATHS, getPageFromPath, getPathFromPage } from './lib/routes';
import { DEFAULT_COOKIE_PREFERENCES } from './lib/privacyPreferences';
import { useToast } from './hooks/useToast';
import { useFormatters } from './hooks/useFormatters';
import { useCookiePreferences } from './hooks/useCookiePreferences';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useAuth, getDefaultPathForRole, getRouteRole, buildAuthPath } from './hooks/useAuth';
import { useAppStore } from './hooks/useAppStore';
import { useMediaResolver, useFeaturedListings } from './hooks/useMediaResolver';
import { useAnalytics } from './hooks/useAnalytics';
import { useBooking } from './hooks/useBooking';
import { useAppActions } from './hooks/useAppActions';
import { getWishlistIds } from './lib/guestFeatures';

const LandingPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/LandingPageRoute'), 'LandingPageRoute').then((module) => ({
    default: module.LandingPageRoute,
  })),
);
const OwnerSignupPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/OwnerSignupPageRoute'), 'OwnerSignupPageRoute').then((module) => ({
    default: module.OwnerSignupPageRoute,
  })),
);
const OwnerDashboardPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/OwnerDashboardPageRoute'), 'OwnerDashboardPageRoute').then((module) => ({
    default: module.OwnerDashboardPageRoute,
  })),
);
const BookingPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/BookingPageRoute'), 'BookingPageRoute').then((module) => ({
    default: module.BookingPageRoute,
  })),
);
const ReviewPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/ReviewPageRoute'), 'ReviewPageRoute').then((module) => ({
    default: module.ReviewPageRoute,
  })),
);
const DashboardPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/DashboardPageRoute'), 'DashboardPageRoute').then((module) => ({
    default: module.DashboardPageRoute,
  })),
);
const ManagementListingsPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/ManagementListingsPageRoute'), 'ManagementListingsPageRoute').then(
    (module) => ({
      default: module.ManagementListingsPageRoute,
    }),
  ),
);
const SuccessPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/SuccessPageRoute'), 'SuccessPageRoute').then((module) => ({
    default: module.SuccessPageRoute,
  })),
);
const PrivacyPolicyPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/PrivacyPolicyPageRoute'), 'PrivacyPolicyPageRoute').then((module) => ({
    default: module.PrivacyPolicyPageRoute,
  })),
);
const AuthLoginPageRoute = lazy(() =>
  importWithChunkRecovery(() => import('./pages/AuthLoginPageRoute'), 'AuthLoginPageRoute').then((module) => ({
    default: module.AuthLoginPageRoute,
  })),
);
const PaymentModal = lazy(() =>
  importWithChunkRecovery(() => import('./components/PaymentModal'), 'PaymentModal').then((module) => ({
    default: module.PaymentModal,
  })),
);

const LISTING_SYNC_PATHS = new Set([
  APP_PATHS.landing,
  APP_PATHS.booking,
  APP_PATHS.dashboard,
  APP_PATHS.managementListings,
]);

const HIDE_CHROME_PATHS = new Set([
  APP_PATHS.dashboard,
  APP_PATHS.managementListings,
  APP_PATHS.ownerDashboard,
  APP_PATHS.authLogin,
]);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = getPageFromPath(location.pathname);

  const { toasts, pushToast } = useToast();
  const { formatCompactNumber } = useFormatters();
  const {
    cookiePreferences,
    cookieBannerOpen,
    setCookieBannerOpen,
    handleAcceptAllCookies,
    handleEssentialOnlyCookies,
  } = useCookiePreferences();
  const { canInstallApp, handleInstallApp } = usePwaInstall();
  const {
    authSession,
    authRole,
    availableRoles,
    isAuthLoading,
    isLoggingIn,
    openAuthPage,
    handleRoleSelect,
    handleSignOut,
  } = useAuth(pushToast);

  const { store, setStore, sourceListings } = useAppStore(location.pathname);
  const resolvedListings = useMediaResolver({
    shouldSyncListings: LISTING_SYNC_PATHS.has(location.pathname),
    sourceListings,
  });
  const { dashboardListings, featuredListings } = useFeaturedListings(store.managementListings, resolvedListings);

  const { recordAnalytics, analyticsSummary } = useAnalytics(
    cookiePreferences,
    activePage,
    location.pathname,
    setStore,
  );

  const {
    paymentOpen,
    bookingErrors,
    bookingSummary,
    isOpeningPayment,
    isSubmittingPayment,
    isVerifyingStripePayment,
    stripeVerificationError,
    setPaymentOpen,
    handleProceedToPayment,
    handlePaymentSubmit,
    handleBookingChange,
  } = useBooking({ featuredListings, store, setStore, pushToast, recordAnalytics });

  const {
    isSubmittingOwner,
    isSubmittingReview,
    handleOwnerSubmit,
    handleReviewSubmit,
    handleManagementListingSave,
    handleManagementListingDelete,
    handleBookingStatusChange,
    handleApproveOwner,
    handleApproveEvaluation,
    handleBookingCancellation,
    handleBookingRefund,
    handleWishlistToggle,
    handleBookingSearch,
    handleSupportSubmit,
  } = useAppActions({ setStore, pushToast, recordAnalytics });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportWidgetOpen, setSupportWidgetOpen] = useState(false);

  const safeAvailableRoles = useMemo(
    () => (Array.isArray(availableRoles) ? availableRoles : ['client']),
    [availableRoles],
  );

  const wishlistIds = useMemo(
    () => getWishlistIds(store, authSession?.user),
    [authSession?.user, store],
  );

  const summary = useMemo(
    () =>
      analyticsSummary(store),
    [store, analyticsSummary],
  );

  const headerAction =
    location.pathname === APP_PATHS.dashboard
      ? { label: '+ New Listing', onClick: () => navigate(APP_PATHS.managementListings) }
      : location.pathname === APP_PATHS.managementListings
        ? { label: 'Back to Dashboard', onClick: () => navigate(APP_PATHS.dashboard) }
        : null;

  function showPage(page) {
    navigate(getPathFromPage(page));
  }

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

  async function handleSupportOpen(source = activePage) {
    setSupportWidgetOpen(true);
    await recordAnalytics('support_open', { source });
  }

  async function handleManageCookies() {
    setCookieBannerOpen(true);
    navigate(APP_PATHS.privacyPolicy);
  }

  useLayoutEffect(() => {
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

  const showFooter = !HIDE_CHROME_PATHS.has(location.pathname);
  const showSupportWidget =
    !HIDE_CHROME_PATHS.has(location.pathname) || location.pathname === APP_PATHS.managementLogin;

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
        availableRoles={safeAvailableRoles}
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
                    wishlistCount={wishlistIds.length}
                    analyticsSummary={summary}
                    onOpenSupport={() => handleSupportOpen('landing')}
                    canInstallApp={canInstallApp}
                    onInstallApp={() => handleInstallApp(pushToast, recordAnalytics)}
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
                    availableRoles={safeAvailableRoles}
                    isSubmitting={isLoggingIn}
                    isAuthLoading={isAuthLoading}
                    requestedRole={new URLSearchParams(location.search).get('role') || 'client'}
                    nextPath={new URLSearchParams(location.search).get('next') || ''}
                    onSelectRole={(role) =>
                      handleRoleSelect(role, new URLSearchParams(location.search).get('next') || getDefaultPathForRole(role))
                    }
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
                    availableRoles={safeAvailableRoles}
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
                    availableRoles={safeAvailableRoles}
                    requiredRole="owner"
                    fallbackPath={buildAuthPath('owner', APP_PATHS.ownerDashboard)}
                    isAuthLoading={isAuthLoading}
                  >
                    <OwnerDashboardPageRoute
                      ownerApplications={store.ownerApplications}
                      bookingTransactions={store.bookingTransactions}
                      emails={store.dashboardEmails}
                      onShowPage={showPage}
                      onSignOut={handleSignOut}
                      authUser={authSession?.user}
                    />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path={APP_PATHS.booking}
                element={
                  <ErrorBoundary fallback={<p className="p-8 text-center text-slate-500">Something went wrong on this page. <a href="/" className="text-brand-600 underline">Go home</a></p>}>
                    <BookingPageRoute
                      properties={featuredListings}
                    bookingForm={store.bookingDraft}
                    bookingErrors={bookingErrors}
                    isSubmitting={isOpeningPayment}
                    onBookingChange={handleBookingChange}
                    onShowPage={showPage}
                    onProceedToPayment={handleProceedToPayment}
                    bookingSummary={bookingSummary}
                    authUser={authSession?.user}
                    authRole={authRole}
                    availableRoles={safeAvailableRoles}
                    isAuthLoading={isAuthLoading}
                    onOpenAuth={() => openAuthPage('client', APP_PATHS.booking)}
                    wishlistIds={wishlistIds}
                    onToggleWishlist={(propertyId) => handleWishlistToggle(propertyId, authSession?.user)}
                    onSearch={handleBookingSearch}
                    onOpenSupport={() => handleSupportOpen('booking')}
                    canInstallApp={canInstallApp}
                    onInstallApp={() => handleInstallApp(pushToast, recordAnalytics)}
                  />
                  </ErrorBoundary>
                }
                element={
                  <RoleProtectedRoute
                    authUser={authSession?.user}
                    availableRoles={safeAvailableRoles}
                    requiredRole="client"
                    fallbackPath={buildAuthPath('client', APP_PATHS.review)}
                    isAuthLoading={isAuthLoading}
                  >
                    <ReviewPageRoute
                      onShowPage={showPage}
                      onSubmitReview={handleReviewSubmit}
                      isSubmitting={isSubmittingReview}
                    />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path={APP_PATHS.managementLogin}
                element={<Navigate to={buildAuthPath('management', APP_PATHS.dashboard)} replace />}
              />
              <Route
                path={APP_PATHS.bookingSuccess}
                element={
                  <ErrorBoundary fallback={<p className="p-8 text-center text-slate-500">Something went wrong. <a href="/" className="text-brand-600 underline">Go home</a></p>}>
                    <SuccessPageRoute
                      variant="booking"
                      onShowPage={showPage}
                      isLoading={isVerifyingStripePayment}
                      errorMessage={stripeVerificationError}
                    />
                  </ErrorBoundary>
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
                    availableRoles={safeAvailableRoles}
                    requiredRole="management"
                    fallbackPath={buildAuthPath('management', APP_PATHS.dashboard)}
                    isAuthLoading={isAuthLoading}
                  >
                    <ErrorBoundary fallback={<p className="p-8 text-center text-slate-500">Dashboard failed to load. <a href="/" className="text-brand-600 underline">Go home</a></p>}>
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
                      onApproveOwner={handleApproveOwner}
                      onApproveEvaluation={handleApproveEvaluation}
                      onShowPage={showPage}
                      onSignOut={handleSignOut}
                      authUser={authSession?.user}
                      analyticsEvents={store.analyticsEvents}
                      supportRequests={store.supportRequests}
                    />
                    </ErrorBoundary>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path={APP_PATHS.managementListings}
                element={
                  <RoleProtectedRoute
                    authUser={authSession?.user}
                    availableRoles={safeAvailableRoles}
                    requiredRole="management"
                    fallbackPath={buildAuthPath('management', APP_PATHS.managementListings)}
                    isAuthLoading={isAuthLoading}
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
          onSubmit={(payload) => handleSupportSubmit(payload, activePage)}
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
          />
        </Suspense>
      ) : null}

      <CookieConsentBanner
        open={cookieBannerOpen}
        preferences={cookiePreferences || DEFAULT_COOKIE_PREFERENCES}
        onAcceptAll={() => {
          handleAcceptAllCookies();
          pushToast('Cookie preferences updated. Optional analytics and personalization are enabled.', 'success', 'lock');
        }}
        onEssentialOnly={() => {
          handleEssentialOnlyCookies();
          pushToast('Cookie preferences updated. Only essential storage stays active.', 'info', 'lock');
        }}
        onManagePrivacy={() => navigate(APP_PATHS.privacyPolicy)}
      />
    </>
  );
}
