import { startTransition, useState, useEffect, useRef } from 'react';
import { getMediaObjectUrl, revokeMediaObjectUrls } from '../lib/mediaStorage';


export function useMediaResolver({ shouldSyncListings, sourceListings }) {
  const [resolvedListings, setResolvedListings] = useState([]);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!shouldSyncListings) {
      startTransition(() => {
        setResolvedListings([]);
      });
      hasHydratedRef.current = false;
      return undefined;
    }

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

        startTransition(() => {
          setResolvedListings(listings);
        });
        hasHydratedRef.current = true;
      } catch {
        if (isActive) {
          startTransition(() => {
            setResolvedListings(sourceListings);
          });
        }
      }
    }

    resolveListings();

    return () => {
      isActive = false;
      revokeMediaObjectUrls(nextUrls);
    };
  }, [shouldSyncListings, sourceListings]);

  return resolvedListings;
}

export function useFeaturedListings(storeManagementListings, resolvedListings) {
  const sourceListings = Array.isArray(storeManagementListings) ? storeManagementListings : [];
  const dashboardListings = resolvedListings.length ? resolvedListings : sourceListings;
  const featuredListings = dashboardListings.filter(
    (listing) => listing.publishStatus !== 'draft' && !listing.isDeleted,
  );

  return { sourceListings, dashboardListings, featuredListings };
}
