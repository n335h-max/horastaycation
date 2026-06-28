import { startTransition, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearPendingStripeCheckout, getPendingStripeCheckout, savePendingStripeCheckout } from '../lib/stripeCheckout';
import { submitBooking, saveBookingDraft as persistBookingDraft } from '../services/horaApi';
import { validateWithSchema, bookingSchema } from '../lib/validation';
import { isRangeBlocked } from '../lib/guestFeatures';
import { SERVICE_FEE_RATE } from '../lib/constants';
import { APP_PATHS } from '../lib/routes';
import { createCheckoutSessionWithRetry, verifyCheckoutSessionWithRetry } from '../lib/apiRetry';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function useBooking({ featuredListings, store, setStore = () => {}, pushToast, recordAnalytics }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [bookingErrors, setBookingErrors] = useState({});
  const [isOpeningPayment, setIsOpeningPayment] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isVerifyingStripePayment, setIsVerifyingStripePayment] = useState(false);
  const [stripeVerificationError, setStripeVerificationError] = useState('');

  const bookingSuccessSessionId = new URLSearchParams(location.search).get('session_id') || '';
  const bookingCheckoutState = new URLSearchParams(location.search).get('checkout') || '';

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

  const getAccessToken = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      return '';
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token || '';
  }, []);

  // Persist booking draft with debounce
  useEffect(() => {
    const timer = window.setTimeout(() => {
      persistBookingDraft(store.bookingDraft);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [store.bookingDraft]);

  // Verify Stripe payment on success page
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
        const accessToken = await getAccessToken();
        const payload = await verifyCheckoutSessionWithRetry(bookingSuccessSessionId, accessToken, {
          maxRetries: 3,
          initialDelayMs: 1000,
        });

        if (!payload?.paid) {
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

        if (!isActive) return;

        clearPendingStripeCheckout(bookingSuccessSessionId);
        setPaymentOpen(false);
        setBookingErrors({});
        pushToast('Stripe payment confirmed. Booking saved successfully.', 'success', 'lock');
        await recordAnalytics('stripe_payment_success', { sessionId: bookingSuccessSessionId });

        if (isSupabaseConfigured && !bookingResult.remote.saved && !bookingResult.remote.alreadyProcessed) {
          pushToast(
            'Payment is confirmed, but the booking only saved locally because remote sync is not fully configured.',
            'warning',
            'calendar',
          );
        }

        return bookingResult;
      } catch (error) {
        if (!isActive) return;
        setStripeVerificationError(error instanceof Error ? error.message : 'Stripe payment verification failed.');
      } finally {
        if (isActive) setIsVerifyingStripePayment(false);
      }
    }

    verifyStripePayment();
    return () => {
      isActive = false;
    };
  }, [bookingSuccessSessionId, location.pathname, getAccessToken, pushToast, recordAnalytics]);

  // Handle cancelled checkout
  useEffect(() => {
    if (location.pathname !== APP_PATHS.booking || bookingCheckoutState !== 'cancelled') return;

    pushToast(
      'Stripe checkout was cancelled. Your booking details are still here if you want to try again.',
      'warning',
      'lock',
    );
    void recordAnalytics('stripe_checkout_cancelled', {
      propertyId: store.bookingDraft.property || '',
    });
  }, [bookingCheckoutState, location.pathname, pushToast, recordAnalytics, store.bookingDraft.property]);

  const handleBookingChange = useCallback(
    (event) => {
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
    },
    [bookingErrors],
  );

  // We need setStore here, which complicates things. Let's just handle booking state separately.
  const handleProceedToPayment = useCallback(
    (event, currentStore) => {
      event.preventDefault();
      setIsOpeningPayment(true);
      const result = validateWithSchema(bookingSchema, currentStore.bookingDraft);

      if (!result.success) {
        setBookingErrors(result.errors);
        pushToast('Fix the highlighted booking fields before continuing.', 'warning', 'calendar');
        setIsOpeningPayment(false);
        return;
      }

      const selectedProperty = featuredListings.find((item) => item.id === currentStore.bookingDraft.property);

      if (isRangeBlocked(selectedProperty, currentStore.bookingDraft.checkin, currentStore.bookingDraft.checkout)) {
        setBookingErrors({ checkin: ['Selected dates are unavailable for this staycation.'] });
        pushToast('Selected dates are unavailable. Please choose a different stay window.', 'warning', 'calendar');
        setIsOpeningPayment(false);
        return;
      }

      setBookingErrors({});
      setStripeVerificationError('');
      setPaymentOpen(true);
      setIsOpeningPayment(false);
    },
    [featuredListings, pushToast],
  );

  const handlePaymentSubmit = useCallback(
    async (event, currentStore) => {
      event.preventDefault();
      setIsSubmittingPayment(true);

      if (!bookingSummary) {
        pushToast('Your booking summary is incomplete.', 'warning', 'calendar');
        setIsSubmittingPayment(false);
        return;
      }

      try {
        const accessToken = await getAccessToken();
        const payload = await createCheckoutSessionWithRetry(
          {
            bookingForm: currentStore.bookingDraft,
            bookingSummary,
          },
          accessToken,
          { maxRetries: 3, initialDelayMs: 1000 },
        );

        savePendingStripeCheckout(payload.sessionId, {
          bookingForm: currentStore.bookingDraft,
          bookingSummary,
        });
        await recordAnalytics('stripe_checkout_started', {
          propertyId: currentStore.bookingDraft.property,
          sessionId: payload.sessionId,
        });
        window.location.assign(payload.url);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to start Stripe checkout. Please try again.';
        pushToast(message, 'warning', 'lock');
        console.error('[useBooking] Payment submission failed:', error);
      } finally {
        setIsSubmittingPayment(false);
      }
    },
    [bookingSummary, getAccessToken, recordAnalytics, pushToast],
  );

  return {
    paymentOpen,
    bookingErrors,
    bookingSummary,
    isOpeningPayment,
    isSubmittingPayment,
    isVerifyingStripePayment,
    stripeVerificationError,
    setPaymentOpen,
    setBookingErrors,
    handleProceedToPayment,
    handlePaymentSubmit,
    handleBookingChange,
  };
}
