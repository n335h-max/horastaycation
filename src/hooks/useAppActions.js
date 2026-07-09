import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteManagementListing,
  saveManagementListing,
  submitOwnerApplication,
  submitReview,
  approveApplication,
  submitSupportRequest,
  updateBookingTransactionDetails,
  updateBookingTransactionStatus,
  toggleWishlistProperty,
} from '../services/horaApi';
import { APP_PATHS } from '../lib/routes';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

async function getAccessToken() {
  if (!isSupabaseConfigured || !supabase) {
    return '';
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || '';
}

export function useAppActions({ setStore, pushToast, recordAnalytics }) {
  const navigate = useNavigate();

  const [isSubmittingOwner, setIsSubmittingOwner] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleOwnerSubmit = useCallback(
    async (values) => {
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
    },
    [setStore, pushToast, navigate],
  );

  const handleReviewSubmit = useCallback(
    async (values) => {
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
    },
    [setStore, pushToast, navigate],
  );

  const handleManagementListingSave = useCallback(
    async (values) => {
      const result = await saveManagementListing(values);
      setStore(result.store);
      pushToast('Management listing updated successfully.', 'success', 'upload');

      if (result.remote.error) {
        pushToast(
          'Listing saved locally. Run the Supabase schema and configure env vars to enable shared uploads.',
          'warning',
          'calendar',
        );
      } else if (result.remote.saved) {
        pushToast(
          result.remote.uploadedMediaCount
            ? `Listing synced to Supabase with ${result.remote.uploadedMediaCount} uploaded media file(s).`
            : 'Listing synced to Supabase successfully.',
          'info',
          'lock',
        );
      }
    },
    [setStore, pushToast],
  );

  const handleManagementListingDelete = useCallback(
    async (listingId) => {
      const result = await deleteManagementListing(listingId);
      setStore(result.store);
      pushToast('Listing deleted successfully.', 'success', 'upload');
    },
    [setStore, pushToast],
  );

  const handleBookingStatusChange = useCallback(
    async (bookingId, bookingStatus) => {
      const result = await updateBookingTransactionStatus(bookingId, bookingStatus);
      setStore(result.store);
      pushToast(`Booking marked as ${bookingStatus}.`, 'success', 'calendar');
    },
    [setStore, pushToast],
  );

  const handleApproveOwner = useCallback(
    async (applicationId) => {
      const result = await approveApplication(applicationId, 'owner');
      if (!result.found) {
        pushToast('Could not find the application to approve.', 'warning', 'send');
        return;
      }
      setStore(result.store);
      if (result.emailSent) {
        pushToast('Application approved. Approval email sent to applicant.', 'success', 'send');
      } else {
        pushToast('Application approved. Email delivery failed — check your email config.', 'warning', 'send');
      }
    },
    [setStore, pushToast],
  );

  const handleApproveEvaluation = useCallback(
    async (applicationId) => {
      const result = await approveApplication(applicationId, 'evaluation');
      if (!result.found) {
        pushToast('Could not find the evaluation to approve.', 'warning', 'send');
        return;
      }
      setStore(result.store);
      if (result.emailSent) {
        pushToast('Evaluation approved. Approval email sent to applicant.', 'success', 'send');
      } else {
        pushToast('Evaluation approved. Email delivery failed — check your email config.', 'warning', 'send');
      }
    },
    [setStore, pushToast],
  );

  const handleBookingCancellation = useCallback(
    async (booking) => {
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
    },
    [setStore, pushToast, recordAnalytics],
  );

  const handleBookingRefund = useCallback(
    async (booking) => {
      try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          pushToast('Your session expired. Please sign in again before processing refunds.', 'warning', 'lock');
          return;
        }

        const response = await fetch('/api/refund-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
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
    },
    [setStore, pushToast, recordAnalytics],
  );

  const handleWishlistToggle = useCallback(
    async (propertyId, authUser) => {
      const result = await toggleWishlistProperty({
        authUser,
        propertyId,
      });
      setStore(result.store);
      pushToast(
        result.saved ? 'Stay saved to your wishlist.' : 'Stay removed from your wishlist.',
        result.saved ? 'success' : 'info',
        'heart',
      );
      await recordAnalytics(result.saved ? 'wishlist_add' : 'wishlist_remove', { propertyId });
    },
    [setStore, pushToast, recordAnalytics],
  );

  const handleBookingSearch = useCallback(
    async (criteria) => {
      await recordAnalytics('search', {
        query: criteria.query || '',
        locationFilter: criteria.location || '',
        resultCount: criteria.resultCount || 0,
        checkin: criteria.checkin || '',
        checkout: criteria.checkout || '',
        guests: criteria.guests || '',
      });
    },
    [recordAnalytics],
  );

  const handleSupportSubmit = useCallback(
    async (payload, activePage) => {
      const result = await submitSupportRequest(payload);
      setStore(result.store);
      pushToast('Support request sent. Hora can follow up by email.', 'success', 'comment');
      await recordAnalytics('support_submit', {
        topic: payload.topic,
        source: payload.pageContext || activePage,
      });
    },
    [setStore, pushToast, recordAnalytics],
  );

  return {
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
  };
}
