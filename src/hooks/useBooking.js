import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { clearPendingStripeCheckout, getPendingStripeCheckout, savePendingStripeCheckout } from '../lib/stripeCheckout';
import { submitBooking, saveBookingDraft as persistBookingDraft } from '../services/horaApi';
import { validateWithSchema, bookingSchema } from '../lib/validation';
import { isRangeBlocked } from '../lib/guestFeatures';
import { SERVICE_FEE_RATE } from '../lib/constants';
import { APP_PATHS } from '../lib/routes';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function useBooking({ featuredListings, store, setStore, pushToast, recordAnalytics }) {
  const location = useLocation();

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
      ownerId: property.ownerId || null,
      ownerEmail: property.ownerEmail || '',
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
        const response = await fetch(
          `/api/verify-checkout-session?session_id=${encodeURIComponent(bookingSuccessSessionId)}`,
          {
            method: 'GET',
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          },
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

        if (isSupabaseConfigured && !bookingResult.remote.saved && !bookingResult.remote.alreadyProcessed) {
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
  }, [bookingSuccessSessionId, getAccessToken, location.pathname, pushToast, recordAnalytics, setStore]);

  // Handle cancelled checkout
  useEffect(() => {
    if (location.pathname !== APP_PATHS.booking || bookingCheckoutState !== 'cancelled') {
      return;
    }

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
    [bookingErrors, setStore],
  );

  const handleProceedToPayment = useCallback(
    (event) => {
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
    },
    [store.bookingDraft, bookingSummary, featuredListings, pushToast],
  );

  const handlePaymentSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setIsSubmittingPayment(true);

      if (!bookingSummary) {
        pushToast('Your booking summary is incomplete.', 'warning', 'calendar');
        setIsSubmittingPayment(false);
        return;
      }

      try {
        const accessToken = await getAccessToken();
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
      }
    },
    [bookingSummary, getAccessToken, pushToast, recordAnalytics, store.bookingDraft],
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
