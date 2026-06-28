import { FEATURED_PROPERTIES } from '../data/siteData';

function buildListingDefaults(listingId = '') {
  const fromFeatured = FEATURED_PROPERTIES.find((listing) => listing.id === listingId);
  if (fromFeatured) {
    return fromFeatured;
  }

  return {
    id: listingId,
    name: 'Untitled Stay',
    location: '',
    price: 0,
    ratingLabel: 'New',
    reviewCount: 0,
    badge: 'Featured Stay',
    badgeIcon: 'star',
    statusNote: '',
    mood: '',
    bestFor: '',
    image: '',
    summaryImage: '',
    thumbnail: '',
    videoUrl: '',
    schedule: '',
    publishStatus: 'draft',
    availabilityNotes: '',
    blockedDates: [],
    isDeleted: false,
    amenities: [],
  };
}

export function normalizeListingPayload(listing) {
  const hasFacilitiesText = typeof listing.facilitiesText === 'string';
  const facilitiesAmenities = hasFacilitiesText
    ? listing.facilitiesText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const hasBlockedDatesText = typeof listing.blockedDatesText === 'string';
  const blockedDatesFromText = hasBlockedDatesText
    ? listing.blockedDatesText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const amenities = hasFacilitiesText
    ? facilitiesAmenities
    : Array.isArray(listing.amenities)
      ? listing.amenities
      : [];
  const blockedDates = hasBlockedDatesText
    ? blockedDatesFromText
    : Array.isArray(listing.blockedDates)
      ? listing.blockedDates
      : [];

  return {
    ...listing,
    price: Number(listing.price) || 0,
    amenities,
    image: listing.image || listing.summaryImage || listing.thumbnail,
    summaryImage: listing.summaryImage || listing.image || listing.thumbnail,
    thumbnail: listing.thumbnail || listing.image || listing.summaryImage,
    videoUrl: listing.videoUrl || '',
    schedule: listing.schedule || '',
    publishStatus: listing.publishStatus || 'published',
    availabilityNotes: listing.availabilityNotes || '',
    blockedDates,
    blockedDatesText: blockedDates.join(', '),
    isDeleted: Boolean(listing.isDeleted),
    imageAsset: listing.imageAsset || null,
    summaryImageAsset: listing.summaryImageAsset || null,
    thumbnailAsset: listing.thumbnailAsset || null,
    videoAsset: listing.videoAsset || null,
  };
}

export function mergeManagementListings(listings = []) {
  const listingMap = new Map(listings.map((listing) => [listing.id, normalizeListingPayload(listing)]));

  const mergedDefaults = FEATURED_PROPERTIES.map((listing) =>
    normalizeListingPayload({ ...listing, ...(listingMap.get(listing.id) || {}) }),
  ).filter((listing) => !listing.isDeleted);

  const extras = listings
    .filter((listing) => !FEATURED_PROPERTIES.some((featured) => featured.id === listing.id) && !listing.isDeleted)
    .map((listing) => normalizeListingPayload(listing));

  return [...mergedDefaults, ...extras];
}

export function fromRemoteManagementListing(record) {
  const defaults = buildListingDefaults(record.id);

  return normalizeListingPayload({
    ...defaults,
    id: record.id,
    name: record.name ?? defaults.name,
    location: record.location ?? defaults.location,
    price: Number(record.price ?? defaults.price) || 0,
    ratingLabel: record.rating_label ?? defaults.ratingLabel,
    reviewCount: Number(record.review_count ?? defaults.reviewCount) || 0,
    badge: record.badge ?? defaults.badge,
    badgeIcon: record.badge_icon ?? defaults.badgeIcon,
    statusNote: record.status_note ?? defaults.statusNote,
    mood: record.mood ?? defaults.mood,
    bestFor: record.best_for ?? defaults.bestFor,
    image: record.image ?? defaults.image,
    summaryImage: record.summary_image ?? defaults.summaryImage,
    thumbnail: record.thumbnail ?? defaults.thumbnail,
    videoUrl: record.video_url ?? '',
    schedule: record.schedule ?? defaults.schedule,
    publishStatus: record.publish_status ?? 'published',
    availabilityNotes: record.availability_notes ?? '',
    blockedDates: Array.isArray(record.blocked_dates) ? record.blocked_dates : [],
    isDeleted: Boolean(record.is_deleted),
    amenities: Array.isArray(record.amenities) ? record.amenities : defaults.amenities,
    imageAsset: null,
    summaryImageAsset: null,
    thumbnailAsset: null,
    videoAsset: null,
  });
}
