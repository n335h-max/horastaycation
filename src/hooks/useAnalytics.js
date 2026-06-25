import { useCallback, useEffect } from 'react';
import { trackAnalyticsEvent } from '../services/horaApi';
import { summarizeAnalytics } from '../lib/guestFeatures';

export function useAnalytics(cookiePreferences, activePage, locationPathname) {
  const recordAnalytics = useCallback(
    async (type, payload = {}, setStore) => {
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
    [cookiePreferences?.analytics, activePage, locationPathname],
  );

  useEffect(() => {
    void recordAnalytics('page_view');
  }, [cookiePreferences?.analytics, locationPathname]);

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
