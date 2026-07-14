import { startTransition, useState, useEffect, useMemo, useCallback } from 'react';

import { deleteMediaFile, saveMediaFile } from '../lib/mediaStorage';

const WINDOW_OPTIONS = [
  { id: '7d', label: '7D', description: 'Last 7 days', days: 7, buckets: 7 },
  { id: '30d', label: '30D', description: 'Last 30 days', days: 30, buckets: 6 },
  { id: '90d', label: '90D', description: 'Last 90 days', days: 90, buckets: 6 },
  { id: 'all', label: 'All', description: 'All tracked time', days: null, buckets: 6 },
];

const MEDIA_FIELD_CONFIG = {
  image: {
    assetField: 'imageAsset',
    accept: 'image/*',
    label: 'Hero Photo Upload',
    helper: 'Upload the main client-facing hero image.',
  },
  summaryImage: {
    assetField: 'summaryImageAsset',
    accept: 'image/*',
    label: 'Summary Photo Upload',
    helper: 'Upload the image shown in booking summaries.',
  },
  thumbnail: {
    assetField: 'thumbnailAsset',
    accept: 'image/*',
    label: 'Thumbnail Upload',
    helper: 'Upload the smaller card image used in the booking list.',
  },
  videoUrl: {
    assetField: 'videoAsset',
    accept: 'video/*',
    label: 'Video Walkthrough Upload',
    helper: 'Upload a short walkthrough video for the listing.',
  },
};
const MEDIA_FIELD_ORDER = ['image', 'summaryImage', 'thumbnail', 'videoUrl'];
const STUDIO_SECTIONS = [
  { id: 'basic', eyebrow: 'Basic Info', title: 'Core listing settings' },
  { id: 'media', eyebrow: 'Media', title: 'Photos, thumbnails, and video' },
  { id: 'schedule', eyebrow: 'Schedule & Availability', title: 'Guest windows and blocked dates' },
  { id: 'copy', eyebrow: 'Copy & Description', title: 'Guest-facing story and amenities' },
];

function getTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function getWindowConfig(windowId = '30d') {
  return WINDOW_OPTIONS.find((option) => option.id === windowId) || WINDOW_OPTIONS[1];
}

function isInWindow(value, windowId) {
  const config = getWindowConfig(windowId);
  if (!config.days) return true;
  const timestamp = getTimestamp(value);
  if (!timestamp) return false;
  const cutoff = Date.now() - config.days * 86400000;
  return timestamp >= cutoff;
}

function buildDefaultListing() {
  return {
    id: `listing-${crypto.randomUUID().slice(0, 8)}`,
    name: '',
    location: '',
    price: 0,
    statusNote: '',
    publishStatus: 'draft',
    schedule: '',
    mood: '',
    bestFor: '',
    facilities: [],
    facilitiesText: '',
    image: '',
    summaryImage: '',
    thumbnail: '',
    videoUrl: '',
    imageAsset: null,
    summaryImageAsset: null,
    thumbnailAsset: null,
    videoAsset: null,
    blockedDates: [],
    isDeleted: false,
    amenities: [],
    ratingLabel: 'New',
    reviewCount: 0,
    reviewSnippet: '',
    guestCapacity: 2,
    sourceRequestId: null,
    sourceRequestType: null,
    ownerId: null,
  };
}

export function useManagementStudio(listings, onSaveListing, onDeleteListing) {
  const sourceListings = Array.isArray(listings) ? listings : [];
  const availableListings = useMemo(
    () => sourceListings.filter((listing) => !listing?.isDeleted),
    [sourceListings],
  );
  const [selectedListingId, setSelectedListingId] = useState(availableListings[0]?.id ?? '');
  const [originalFormSnapshot, setOriginalFormSnapshot] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [draftListing, setDraftListing] = useState(null);
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [studioMessage, setStudioMessage] = useState('');
  const [draggingField, setDraggingField] = useState(null);
  const [bulkUploadField, setBulkUploadField] = useState('image');
  const [bulkListingIds, setBulkListingIds] = useState(new Set());
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [pendingMediaFiles, setPendingMediaFiles] = useState({});
  const [prevAvailableListings, setPrevAvailableListings] = useState(availableListings);

  // Synchronize state during rendering when availableListings changes
  if (availableListings !== prevAvailableListings) {
    setPrevAvailableListings(availableListings);

    // Sync selectedListingId
    if (selectedListingId && !availableListings.some((listing) => listing.id === selectedListingId)) {
      setSelectedListingId(availableListings[0]?.id ?? '');
    }

    // Sync bulkListingIds
    const validIds = new Set(availableListings.map((listing) => listing.id));
    const currentSet = bulkListingIds instanceof Set ? bulkListingIds : new Set(Array.isArray(bulkListingIds) ? bulkListingIds : []);
    const next = new Set(Array.from(currentSet).filter((id) => validIds.has(id)));
    if (next.size !== currentSet.size) {
      setBulkListingIds(next);
    }
  }

  const selectedListing =
    draftListing || availableListings.find((item) => item.id === selectedListingId) || availableListings[0];

  const [listingForm, setListingForm] = useState({
    name: selectedListing?.name || '',
    location: selectedListing?.location || '',
    price: selectedListing?.price || 0,
    statusNote: selectedListing?.statusNote || '',
    publishStatus: selectedListing?.publishStatus || 'published',
    schedule: selectedListing?.schedule || '',
    mood: selectedListing?.mood || '',
    bestFor: selectedListing?.bestFor || '',
    facilitiesText: selectedListing?.facilities?.join(', ') || '',
  });

  useEffect(() => {
    if (!selectedListing) return;
    startTransition(() => {
      setListingForm({
        name: selectedListing.name || '',
        location: selectedListing.location || '',
        price: selectedListing.price || 0,
        statusNote: selectedListing.statusNote || '',
        publishStatus: selectedListing.publishStatus || 'published',
        schedule: selectedListing.schedule || '',
        mood: selectedListing.mood || '',
        bestFor: selectedListing.bestFor || '',
        facilitiesText: (selectedListing.facilities || []).join(', '),
      });
      setOriginalFormSnapshot({
        name: selectedListing.name || '',
        location: selectedListing.location || '',
        price: selectedListing.price || 0,
        statusNote: selectedListing.statusNote || '',
        publishStatus: selectedListing.publishStatus || 'published',
        schedule: selectedListing.schedule || '',
        mood: selectedListing.mood || '',
        bestFor: selectedListing.bestFor || '',
        facilitiesText: (selectedListing.facilities || []).join(', '),
      });
    });
  }, [selectedListingId, draftListing, selectedListing]);

  const mediaCards = selectedListing
    ? MEDIA_FIELD_ORDER.map((field) => {
        const config = MEDIA_FIELD_CONFIG[field];
        const pendingFile = pendingMediaFiles[field];
        const currentUrl = selectedListing[field] || '';
        const currentAsset = selectedListing[config.assetField];
        return { field, config, pendingFile, currentUrl, currentAsset, hasPending: !!pendingFile };
      })
    : [];

  const selectedBulkListings = availableListings.filter((l) => bulkListingIds.has(l.id));

  const handleListingFieldChange = useCallback((event) => {
    const { name, value } = event.target;
    setListingForm((current) => ({
      ...current,
      [name]: name === 'price' ? Number(value || 0) : value,
    }));
  }, []);

  const handleCreateListing = useCallback((sourceRequest = null) => {
    const newListing = buildDefaultListing();
    if (sourceRequest) {
      // Inherit the authenticated owner from the source request. Management
      // does NOT manually select an owner — it is auto-linked from the request.
      newListing.ownerId = sourceRequest.ownerUserId || null;
      newListing.sourceRequestId = sourceRequest.id || null;
      newListing.sourceRequestType = sourceRequest.evaluatorName ? 'evaluation' : 'owner';
      // Pre-fill address from the request for convenience.
      newListing.location = sourceRequest.ownerAddress || sourceRequest.evaluatorAddress || '';
    }
    setDraftListing(newListing);
    setSelectedListingId(newListing.id);
    setStudioMessage('New draft listing created. Fill in the fields and save to publish.');
  }, []);

  const handleMediaUpload = useCallback(async (field, file) => {
    if (!file) return;
    setIsUploadingMedia(true);
    setUploadError('');
    try {
      const mediaRef = await saveMediaFile(file, field);
      if (mediaRef) {
        // Guard: only build an object URL for real Blob/File inputs. Passing a
        // non-Blob to URL.createObjectURL throws 'Overload resolution failed'.
        const objectUrl =
          typeof Blob !== 'undefined' && file instanceof Blob ? URL.createObjectURL(file) : '';
        // Keep the raw File so saveManagementListing can upload it to Supabase
        // storage (it filters mediaFiles values by `instanceof File`).
        setPendingMediaFiles((current) => ({ ...current, [field]: { ...mediaRef, objectUrl, file } }));
        setStudioMessage(`Media file saved for upload: ${file.name}`);
      }
    } catch {
      setUploadError(`Upload failed for ${field}.`);
    } finally {
      setIsUploadingMedia(false);
    }
  }, []);

  const clearMediaField = useCallback(
    (field) => {
      const pending = pendingMediaFiles[field];
      if (pending) {
        deleteMediaFile(pending);
        if (pending.objectUrl) {
          URL.revokeObjectURL(pending.objectUrl);
        }
        setPendingMediaFiles((current) => {
          const next = { ...current };
          delete next[field];
          return next;
        });
      }
    },
    [pendingMediaFiles],
  );

  const handleMediaDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleMediaDrop = useCallback(
    (field, event) => {
      event.preventDefault();
      event.stopPropagation();
      setDraggingField(null);
      const file = event.dataTransfer?.files?.[0];
      if (file) handleMediaUpload(field, file);
    },
    [handleMediaUpload],
  );

  const toggleBulkListing = useCallback((listingId) => {
    setBulkListingIds((current) => {
      const next = new Set(current);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  }, [setBulkListingIds]);

  const toggleBulkListings = useCallback((listingIds = []) => {
    setBulkListingIds((current) => {
      const scopedIds = Array.from(new Set(listingIds)).filter(Boolean);
      if (!scopedIds.length) {
        return current;
      }

      const everySelected = scopedIds.every((id) => current.has(id));
      const next = new Set(current);

      if (everySelected) {
        scopedIds.forEach((id) => next.delete(id));
      } else {
        scopedIds.forEach((id) => next.add(id));
      }

      return next;
    });
  }, [setBulkListingIds]);

  const toggleAllBulkListings = useCallback(() => {
    setBulkListingIds((current) => {
      if (current.size === availableListings.length) return new Set();
      return new Set(availableListings.map((l) => l.id));
    });
  }, [availableListings, setBulkListingIds]);

  const handleBulkUpload = useCallback(async (files) => {
    const field = bulkUploadField;
    const targets = selectedBulkListings;

    if (typeof onSaveListing !== 'function') {
      setUploadError('Bulk upload requires an active listing save handler.');
      return;
    }

    if (!targets.length) {
      setUploadError('No listings selected for bulk upload.');
      return;
    }

    const fileArray = Array.isArray(files) ? files : [];
    if (!fileArray.length) {
      return;
    }

    if (fileArray.length > 1 && fileArray.length !== targets.length) {
      setUploadError(`Select either 1 file for all targets or exactly ${targets.length} files.`);
      return;
    }

    setIsBulkUploading(true);
    setUploadError('');
    try {
      for (let index = 0; index < targets.length; index += 1) {
        const listing = targets[index];
        const file = fileArray.length === 1 ? fileArray[0] : fileArray[index];
        // Persist locally for resilience, but pass the raw File to onSaveListing
        // so saveManagementListing uploads it to Supabase storage (its filter is
        // `instanceof File` — a mediaRef would be silently dropped).
        await saveMediaFile(file, field);
        await onSaveListing({
          ...listing,
          mediaFiles: {
            [field]: file,
          },
        });
      }
      setStudioMessage(`Bulk upload complete for ${targets.length} listing(s) using ${fileArray.length} file(s).`);
    } catch {
      setUploadError('Bulk upload failed.');
    } finally {
      setIsBulkUploading(false);
    }
  }, [bulkUploadField, onSaveListing, selectedBulkListings]);

  const handleListingSubmit = useCallback(async (event) => {
    event?.preventDefault?.();
    setIsSavingListing(true);
    try {
      // Pass raw File objects (not mediaRef wrappers) so saveManagementListing's
      // `instanceof File` filter accepts them and uploads to Supabase storage.
      const mediaFiles = {};
      Object.entries(pendingMediaFiles).forEach(([field, pending]) => {
        if (pending?.file instanceof File) mediaFiles[field] = pending.file;
      });
      await onSaveListing({
        ...selectedListing,
        ...listingForm,
        price: Number(listingForm.price || 0),
        mediaFiles,
      });
      setDraftListing(null);
      Object.values(pendingMediaFiles).forEach((pending) => {
        if (pending?.objectUrl) URL.revokeObjectURL(pending.objectUrl);
      });
      setPendingMediaFiles({});
      setStudioMessage('Listing content saved. The public staycation cards now use the latest management portal data.');
    } finally {
      setIsSavingListing(false);
    }
  }, [selectedListing, listingForm, pendingMediaFiles, onSaveListing]);

  const handleDeleteListing = useCallback(async () => {
    if (!selectedListing?.id) {
      setShowDeleteConfirm(false);
      return;
    }

    if (draftListing?.id === selectedListing.id) {
      setDraftListing(null);
      setSelectedListingId(availableListings[0]?.id ?? '');
      setStudioMessage('Draft listing removed before publishing.');
      return;
    }
    await onDeleteListing(selectedListing.id);
    setDraftListing(null);
    setSelectedListingId(
      availableListings.find((l) => l.id !== selectedListing.id)?.id ?? availableListings[0]?.id ?? '',
    );
    setStudioMessage('Listing removed from the management portal.');
  }, [draftListing, selectedListing, availableListings, onDeleteListing]);

  const hasUnsavedChanges = useMemo(() => {
    if (!originalFormSnapshot || !selectedListing) return false;
    const current = listingForm;
    return (
      current.name !== originalFormSnapshot.name ||
      current.location !== originalFormSnapshot.location ||
      current.price !== originalFormSnapshot.price ||
      current.statusNote !== originalFormSnapshot.statusNote ||
      current.publishStatus !== originalFormSnapshot.publishStatus ||
      current.schedule !== originalFormSnapshot.schedule ||
      current.mood !== originalFormSnapshot.mood ||
      current.bestFor !== originalFormSnapshot.bestFor ||
      current.facilitiesText !== originalFormSnapshot.facilitiesText
    );
  }, [listingForm, originalFormSnapshot, selectedListing]);

  const filteredListings = useMemo(() => {
    if (!listingSearch.trim()) return availableListings;
    const query = listingSearch.toLowerCase();
    return availableListings.filter(
      (l) => l.name.toLowerCase().includes(query) || (l.location || '').toLowerCase().includes(query),
    );
  }, [availableListings, listingSearch]);

  return {
    availableListings,
    selectedListing,
    selectedListingId,
    listingForm,
    mediaCards,
    isSavingListing,
    isUploadingMedia,
    uploadError,
    studioMessage,
    draggingField,
    bulkUploadField,
    bulkListingIds,
    selectedBulkListings,
    isBulkUploading,
    pendingMediaFiles,
    listingSearch,
    showDeleteConfirm,
    hasUnsavedChanges,
    filteredListings,
    setSelectedListingId,
    setBulkUploadField,
    setListingSearch,
    setDraggingField,
    setShowDeleteConfirm,
    handleListingFieldChange,
    handleMediaUpload,
    handleCreateListing,
    clearMediaField,
    handleMediaDragOver,
    handleMediaDrop,
    toggleBulkListing,
    toggleBulkListings,
    toggleAllBulkListings,
    handleBulkUpload,
    handleListingSubmit,
    handleDeleteListing,
    confirmDelete: () => {
      setShowDeleteConfirm(false);
      handleDeleteListing();
    },
    cancelDelete: () => setShowDeleteConfirm(false),
  };
}

export {
  getWindowConfig,
  isInWindow,
  MEDIA_FIELD_CONFIG,
  MEDIA_FIELD_ORDER,
  STUDIO_SECTIONS,
  WINDOW_OPTIONS,
};
