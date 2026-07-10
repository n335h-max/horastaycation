import { useState, useEffect, useRef } from 'react';
import { getSnapshot } from '../services/localStore';
import { syncRemoteData } from '../services/horaApi';
import { APP_PATHS } from '../lib/routes';


const LISTING_SYNC_PATHS = new Set([
  APP_PATHS.landing,
  APP_PATHS.booking,
  APP_PATHS.dashboard,
  APP_PATHS.managementListings,
]);
const BOOKING_SYNC_PATHS = new Set([APP_PATHS.dashboard]);

export function useAppStore(pathname) {
  const [store, setStore] = useState(() => getSnapshot());
  const hasHydratedListingsRef = useRef(false);
  const hasHydratedBookingsRef = useRef(false);

  const shouldSyncListings = LISTING_SYNC_PATHS.has(pathname);
  const shouldSyncBookings = BOOKING_SYNC_PATHS.has(pathname);

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

  const sourceListings = Array.isArray(store.managementListings) ? store.managementListings : [];

  return { store, setStore, sourceListings };
}
