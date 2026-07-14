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
const APPLICATION_SYNC_PATHS = new Set([APP_PATHS.dashboard, APP_PATHS.ownerDashboard]);

export function useAppStore(pathname) {
  const [store, setStore] = useState(() => getSnapshot());
  const hasHydratedListingsRef = useRef(false);
  const hasHydratedBookingsRef = useRef(false);
  const hasHydratedApplicationsRef = useRef(false);

  const shouldSyncListings = LISTING_SYNC_PATHS.has(pathname);
  const shouldSyncBookings = BOOKING_SYNC_PATHS.has(pathname);
  const shouldSyncApplications = APPLICATION_SYNC_PATHS.has(pathname);

  useEffect(() => {
    let isActive = true;
    const includeListings = shouldSyncListings && !hasHydratedListingsRef.current;
    const includeBookings = shouldSyncBookings && !hasHydratedBookingsRef.current;
    const includeApplications = shouldSyncApplications && !hasHydratedApplicationsRef.current;
    const shouldHydrate = includeListings || includeBookings || includeApplications;

    if (!shouldHydrate) {
      return undefined;
    }

    async function hydrateRemoteData() {
      const result = await syncRemoteData({ includeBookings, includeListings, includeApplications });

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
      if (includeApplications) {
        hasHydratedApplicationsRef.current = true;
      }
    }

    hydrateRemoteData();

    return () => {
      isActive = false;
    };
  }, [shouldSyncBookings, shouldSyncListings, shouldSyncApplications]);

  const sourceListings = Array.isArray(store.managementListings) ? store.managementListings : [];

  return { store, setStore, sourceListings };
}
