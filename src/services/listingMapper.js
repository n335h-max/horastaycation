function buildListingDefaults(listingId = '') {
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
    photos: [],
    galleryImages: [],
    media: { photos: [], videoUrl: '' },
    schedule: '',
    publishStatus: 'draft',
    availabilityNotes: '',
    blockedDates: [],
    isDeleted: false,
    amenities: [],
    ownerId: null,
  };
}

function normalizeGalleryImages(value) {
  return Array.isArray(value) ? value.filter((url) => typeof url === 'string' && url.trim()) : [];
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
  const rawPhotos = Array.isArray(listing.photos) && listing.photos.length > 0
    ? listing.photos
    : (Array.isArray(listing.galleryImages) ? listing.galleryImages.filter(Boolean) : []);
  const photos = normalizeGalleryImages(rawPhotos);
  const galleryImages = Array.isArray(listing.galleryImages) ? listing.galleryImages : photos;
  const fallbackGalleryImage = photos[0] || '';
  const videoUrl = listing.videoUrl || '';

  return {
    ...listing,
    price: Number(listing.price) || 0,
    amenities,
    image: listing.image || listing.summaryImage || listing.thumbnail || fallbackGalleryImage,
    summaryImage: listing.summaryImage || listing.image || listing.thumbnail || fallbackGalleryImage,
    thumbnail: listing.thumbnail || listing.image || listing.summaryImage || fallbackGalleryImage,
    videoUrl,
    photos,
    galleryImages,
    media: {
      photos,
      videoUrl,
    },
    schedule: listing.schedule || '',
    publishStatus: listing.publishStatus || 'published',
    availabilityNotes: listing.availabilityNotes || '',
    blockedDates,
    blockedDatesText: blockedDates.join(', '),
    isDeleted: Boolean(listing.isDeleted),
    ownerId: listing.ownerId ?? null,
    imageAsset: listing.imageAsset || null,
    summaryImageAsset: listing.summaryImageAsset || null,
    thumbnailAsset: listing.thumbnailAsset || null,
    videoAsset: listing.videoAsset || null,
  };
}

export function mergeManagementListings(listings = []) {
  return listings.filter((listing) => !listing.isDeleted).map((listing) => normalizeListingPayload(listing));
}

export function fromRemoteManagementListing(record) {
  const defaults = buildListingDefaults(record.id);
  const rawPhotos = record.photos && Array.isArray(record.photos) && record.photos.length > 0
    ? record.photos
    : record.gallery_images;

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
    photos: normalizeGalleryImages(rawPhotos),
    galleryImages: normalizeGalleryImages(record.gallery_images || rawPhotos),
    schedule: record.schedule ?? defaults.schedule,
    publishStatus: record.publish_status ?? 'published',
    availabilityNotes: record.availability_notes ?? '',
    blockedDates: Array.isArray(record.blocked_dates) ? record.blocked_dates : [],
    isDeleted: Boolean(record.is_deleted),
    amenities: Array.isArray(record.amenities) ? record.amenities : defaults.amenities,
    ownerId: record.owner_id || null,
    imageAsset: null,
    summaryImageAsset: null,
    thumbnailAsset: null,
    videoAsset: null,
  });
}
