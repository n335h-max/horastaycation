import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { SiteFooter, SiteHeader, ToastStack } from './components/SiteChrome';
import { FEATURED_PROPERTIES } from './data/siteData';
import { getMediaObjectUrl, revokeMediaObjectUrls } from './lib/mediaStorage';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { validateWithSchema, bookingSchema, paymentSchema } from './lib/validation';
import { APP_PATHS, getPageFromPath, getPathFromPage } from './lib/routes';
import {
  getSnapshot,
  deleteManagementListing,
  saveBookingDraft,
  saveManagementListing,
  submitBooking,
  submitOwnerApplication,
  submitReview,
  syncRemoteData,
  updateBookingTransactionStatus,
} from './services/horaApi';
import {
  getCurrentSession,
  getResolvedUserRole,
  getUserProfile,
  signInWithGoogle,
  signOutCurrentUser,
  syncUserProfile,
} from './services/authApi';

const initialPaymentForm = {
  cardNumber: '',
  expiry: '',
  cvc: '',
  cardholder: '',
};

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
const ManagementLoginPageRoute = lazy(() =>
  import('./pages/ManagementLoginPageRoute').then((module) => ({ default: module.ManagementLoginPageRoute })),
);
const DashboardPageRoute = lazy(() =>
  import('./pages/DashboardPageRoute').then((module) => ({ default: module.DashboardPageRoute })),
);
const SuccessPageRoute = lazy(() =>
  import('./pages/SuccessPageRoute').then((module) => ({ default: module.SuccessPageRoute })),
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
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
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

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = getPageFromPath(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [store, setStore] = useState(() => getSnapshot());
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [bookingErrors, setBookingErrors] = useState({});
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isOpeningPayment, setIsOpeningPayment] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isSubmittingOwner, setIsSubmittingOwner] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resolvedListings, setResolvedListings] = useState([]);
  const [authSession, setAuthSession] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [authRole, setAuthRole] = useState('client');
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(isSupabaseConfigured));

  const { formatCurrency, formatCompactNumber, formatDate } = useFormatters();
  const sourceListings = store.managementListings?.length ? store.managementListings : FEATURED_PROPERTIES;
  const dashboardListings = resolvedListings.length ? resolvedListings : sourceListings;
  const featuredListings = dashboardListings.filter(
    (listing) => listing.publishStatus !== 'draft' && !listing.isDeleted,
  );

  useEffect(() => {
    setMobileOpen(false);
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
    if (!toasts.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveBookingDraft(store.bookingDraft);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [store.bookingDraft]);

  useEffect(() => {
    let isActive = true;

    async function hydrateRemoteData() {
      const result = await syncRemoteData();

      if (!isActive) {
        return;
      }

      setStore(result.store);
    }

    hydrateRemoteData();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
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
        setIsAuthLoading(false);
        return;
      }

      const profile = await getUserProfile(session.user.id);

      if (!isActive) {
        return;
      }

      setAuthProfile(profile);
      setAuthRole(getResolvedUserRole(session, profile));
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
        return;
      }

      const profile = await getUserProfile(session.user.id);

      if (!isActive) {
        return;
      }

      setAuthProfile(profile);
      setAuthRole(getResolvedUserRole(session, profile));
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
        return;
      }

      const params = new URLSearchParams(location.search);
      const requestedRole = params.get('auth_role');

      if (!requestedRole) {
        return;
      }

      const resolvedRole = await syncUserProfile(authSession, requestedRole);

      if (!isActive) {
        return;
      }

      const profile = await getUserProfile(authSession.user.id);

      if (!isActive) {
        return;
      }

      setAuthProfile(profile);
      setAuthRole(resolvedRole);
      params.delete('auth_role');
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true },
      );
      pushToast(
        requestedRole === 'management'
          ? 'Google sign-in complete. Management access is now checked against the allowed email list.'
          : `Signed in successfully as ${requestedRole}.`,
        'success',
        'lock',
      );
    }

    applyRequestedRole();

    return () => {
      isActive = false;
    };
  }, [authSession, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!authSession?.user) {
      return;
    }

    if (location.pathname === APP_PATHS.managementLogin && authRole === 'management') {
      navigate(APP_PATHS.dashboard, { replace: true });
    }
  }, [authRole, authSession, location.pathname, navigate]);

  useEffect(() => {
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
  }, [sourceListings]);

  function pushToast(message, type = 'info', icon = 'email') {
    setToasts((current) => [
      ...current,
      { id: crypto.randomUUID(), message, type, icon },
    ]);
  }

  function showPage(page) {
    navigate(getPathFromPage(page));
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

  function handlePaymentChange(event) {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === 'cardNumber') {
      nextValue = value
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(.{4})/g, '$1 ')
        .trim();
    }

    if (name === 'expiry') {
      nextValue = value
        .replace(/\D/g, '')
        .slice(0, 4)
        .replace(/(\d{2})(\d{1,2})/, '$1/$2');
    }

    if (name === 'cvc') {
      nextValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setPaymentForm((current) => ({ ...current, [name]: nextValue }));

    if (paymentErrors[name]) {
      setPaymentErrors((current) => ({ ...current, [name]: undefined }));
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
    const serviceFee = Math.round(subtotal * 0.12);

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
    setPaymentForm((current) => ({
      ...current,
      cardholder: result.data.guestName,
    }));
    setPaymentOpen(true);
    setIsOpeningPayment(false);
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault();
    setIsSubmittingPayment(true);
    const validationResult = validateWithSchema(paymentSchema, paymentForm);

    if (!validationResult.success) {
      setPaymentErrors(validationResult.errors);
      setIsSubmittingPayment(false);
      return;
    }

    if (!bookingSummary) {
      pushToast('Your booking summary is incomplete.', 'warning', 'calendar');
      setIsSubmittingPayment(false);
      return;
    }

    const bookingResult = await submitBooking({
      bookingForm: store.bookingDraft,
      bookingSummary,
      paymentForm,
    });

    setStore(bookingResult.store);
    setPaymentOpen(false);
    setPaymentForm(initialPaymentForm);
    setPaymentErrors({});
    setBookingErrors({});
    setIsSubmittingPayment(false);
    pushToast('Payment successful. Booking confirmed.', 'success', 'lock');
    pushToast(
      bookingResult.remote.saved
        ? 'Booking synced to Supabase successfully.'
        : 'Booking saved locally. Run the Supabase SQL schema to enable remote sync.',
      bookingResult.remote.saved ? 'info' : 'warning',
      bookingResult.remote.saved ? 'email' : 'calendar',
    );
    navigate(APP_PATHS.bookingSuccess);
  }

  async function handleOwnerSubmit(values) {
    setIsSubmittingOwner(true);
    const result = await submitOwnerApplication(values);
    setStore(result.store);
    pushToast('Owner request submitted successfully.', 'success', 'send');
    if (!result.remote.saved) {
      pushToast('Owner request saved locally. Update the Supabase schema if you want the new fields synced remotely.', 'warning', 'calendar');
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
      pushToast('Evaluation request saved locally. Update the Supabase schema if you want the new fields synced remotely.', 'warning', 'calendar');
    }
    setIsSubmittingReview(false);
    navigate(APP_PATHS.reviewSuccess);
  }

  function isRangeBlocked(property, checkin, checkout) {
    if (!property || !checkin || !checkout) {
      return false;
    }

    const blockedDates = new Set(property.blockedDates || []);
    const cursor = new Date(checkin);
    const endDate = new Date(checkout);

    while (cursor < endDate) {
      const isoDate = cursor.toISOString().slice(0, 10);

      if (blockedDates.has(isoDate)) {
        return true;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return false;
  }

  async function handleGoogleSignIn(role, redirectPath) {
    setIsLoggingIn(true);
    await signInWithGoogle(role, redirectPath);
    setIsLoggingIn(false);
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

  async function handleSignOut() {
    await signOutCurrentUser();
    pushToast('Signed out successfully.', 'info', 'lock');
    navigate(APP_PATHS.landing);
  }

  const showFooter =
    location.pathname !== APP_PATHS.dashboard &&
    location.pathname !== APP_PATHS.ownerDashboard &&
    location.pathname !== APP_PATHS.managementLogin;

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <ToastStack toasts={toasts} />
      <SiteHeader
        activePage={activePage}
        mobileOpen={mobileOpen}
        onToggleMobile={(forced) => setMobileOpen((current) => (typeof forced === 'boolean' ? forced : !current))}
        onShowPage={showPage}
        onScrollToSection={scrollToSection}
        authUser={authSession?.user}
        authRole={authRole}
      />

      <main id="main-content">
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
                  isAuthLoading={isAuthLoading}
                  onGoogleSignIn={() => handleGoogleSignIn('owner', APP_PATHS.ownerSignup)}
                />
              }
            />
            <Route
              path={APP_PATHS.ownerDashboard}
              element={
                authSession?.user && authRole === 'owner' ? (
                  <OwnerDashboardPageRoute
                    ownerApplications={store.ownerApplications}
                    bookingTransactions={store.bookingTransactions}
                    emails={store.dashboardEmails}
                    onShowPage={showPage}
                    onSignOut={handleSignOut}
                    authUser={authSession?.user}
                    formatCurrency={formatCurrency}
                  />
                ) : (
                  <Navigate to={APP_PATHS.ownerSignup} replace />
                )
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
                  isAuthLoading={isAuthLoading}
                  onGoogleSignIn={() => handleGoogleSignIn('client', APP_PATHS.booking)}
                />
              }
            />
            <Route
              path={APP_PATHS.review}
              element={<ReviewPageRoute onShowPage={showPage} onSubmitReview={handleReviewSubmit} isSubmitting={isSubmittingReview} />}
            />
            <Route
              path={APP_PATHS.managementLogin}
              element={
                <ManagementLoginPageRoute
                  onShowPage={showPage}
                  isSubmitting={isLoggingIn}
                  authUser={authSession?.user}
                  authRole={authRole}
                  isAuthLoading={isAuthLoading}
                  onGoogleSignIn={() => handleGoogleSignIn('management', APP_PATHS.managementLogin)}
                  onSignOut={handleSignOut}
                />
              }
            />
            <Route path={APP_PATHS.bookingSuccess} element={<SuccessPageRoute variant="booking" onShowPage={showPage} />} />
            <Route path={APP_PATHS.ownerSuccess} element={<SuccessPageRoute variant="owner" onShowPage={showPage} />} />
            <Route path={APP_PATHS.reviewSuccess} element={<SuccessPageRoute variant="review" onShowPage={showPage} />} />
            <Route
              path={APP_PATHS.dashboard}
              element={
                authSession?.user && authRole === 'management' ? (
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
                    onShowPage={showPage}
                    onSignOut={handleSignOut}
                    authUser={authSession?.user}
                    formatCurrency={formatCurrency}
                  />
                ) : (
                  <Navigate to={APP_PATHS.managementLogin} replace />
                )
              }
            />
            <Route path="*" element={<Navigate to={APP_PATHS.landing} replace />} />
          </Routes>
        </Suspense>
      </main>

      {showFooter ? <SiteFooter onShowPage={showPage} /> : null}

      {paymentOpen && bookingSummary ? (
        <Suspense fallback={<ModalLoadingFallback />}>
          <PaymentModal
            open={paymentOpen}
            summary={bookingSummary}
            paymentForm={paymentForm}
            paymentErrors={paymentErrors}
            isSubmitting={isSubmittingPayment}
            onPaymentChange={handlePaymentChange}
            onClose={() => setPaymentOpen(false)}
            onSubmit={handlePaymentSubmit}
            formatCurrency={formatCurrency}
          />
        </Suspense>
      ) : null}
    </>
  );
}
