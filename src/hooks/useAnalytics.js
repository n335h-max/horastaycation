import { useCallback, useEffect, startTransition } from 'react';
import { trackAnalyticsEvent } from '../services/horaApi';
import { summarizeAnalytics } from '../lib/guestFeatures';

export function useAnalytics(cookiePreferences, activePage, locationPathname, setStore) {
  const recordAnalytics = useCallback(
    async (type, payload = {}) => {
      if (!cookiePreferences?.analytics) {
        return null;
      }

      const result = await trackAnalyticsEvent({
        type,
        page: activePage,
        path: locationPathname,
        ...payload,
      });

      if (setStore) {
        setStore(result.store);
      }

      return result;
    },
    [cookiePreferences?.analytics, activePage, locationPathname, setStore],
  );

  useEffect(() => {
    startTransition(() => {
      void recordAnalytics('page_view');
    });
  }, [cookiePreferences?.analytics, locationPathname, recordAnalytics]);

  const analyticsSummary = useCallback(
    (store) =>
      summarizeAnalytics(store.analyticsEvents, store.bookingTransactions, store.supportRequests, store.wishlistByUser),
    [],
  );

  return {
    recordAnalytics,
    analyticsSummary,
  };
}
