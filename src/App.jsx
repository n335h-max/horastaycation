import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { SiteFooter, SiteHeader, ToastStack } from './components/SiteChrome';
import { FEATURED_PROPERTIES } from './data/siteData';
import { validateWithSchema, bookingSchema, paymentSchema } from './lib/validation';
import { APP_PATHS, getPageFromPath, getPathFromPage } from './lib/routes';
import {
  getSnapshot,
  loginManagement,
  saveBookingDraft,
  submitBooking,
  submitOwnerApplication,
  submitReview,
} from './services/horaApi';

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

  const { formatCurrency, formatCompactNumber, formatDate } = useFormatters();

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
    const property = FEATURED_PROPERTIES.find((item) => item.id === store.bookingDraft.property);
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
  }, [store.bookingDraft]);

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

  async function handleManagementLogin(values) {
    setIsLoggingIn(true);
    const result = await loginManagement(values);
    setStore(result.store);
    pushToast('Welcome back. Dashboard loaded.', 'info', 'lock');
    setIsLoggingIn(false);
    navigate(APP_PATHS.dashboard);
  }

  const showFooter = location.pathname !== APP_PATHS.dashboard && location.pathname !== APP_PATHS.managementLogin;

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
                  formatCompactNumber={formatCompactNumber}
                  formatCurrency={formatCurrency}
                />
              }
            />
            <Route
              path={APP_PATHS.ownerSignup}
              element={<OwnerSignupPageRoute onShowPage={showPage} onSubmitOwner={handleOwnerSubmit} isSubmitting={isSubmittingOwner} />}
            />
            <Route
              path={APP_PATHS.booking}
              element={
                <BookingPageRoute
                  bookingForm={store.bookingDraft}
                  bookingErrors={bookingErrors}
                  isSubmitting={isOpeningPayment}
                  onBookingChange={handleBookingChange}
                  onShowPage={showPage}
                  onProceedToPayment={handleProceedToPayment}
                  bookingSummary={bookingSummary}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              }
            />
            <Route
              path={APP_PATHS.review}
              element={<ReviewPageRoute onShowPage={showPage} onSubmitReview={handleReviewSubmit} isSubmitting={isSubmittingReview} />}
            />
            <Route
              path={APP_PATHS.managementLogin}
              element={<ManagementLoginPageRoute onShowPage={showPage} onLogin={handleManagementLogin} isSubmitting={isLoggingIn} />}
            />
            <Route path={APP_PATHS.bookingSuccess} element={<SuccessPageRoute variant="booking" onShowPage={showPage} />} />
            <Route path={APP_PATHS.ownerSuccess} element={<SuccessPageRoute variant="owner" onShowPage={showPage} />} />
            <Route path={APP_PATHS.reviewSuccess} element={<SuccessPageRoute variant="review" onShowPage={showPage} />} />
            <Route
              path={APP_PATHS.dashboard}
              element={
                <DashboardPageRoute
                  bookings={store.dashboardBookings}
                  emails={store.dashboardEmails}
                  revenue={store.dashboardRevenue}
                ownerApplications={store.ownerApplications}
                reviewSubmissions={store.reviewSubmissions}
                  onShowPage={showPage}
                  formatCurrency={formatCurrency}
                />
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
