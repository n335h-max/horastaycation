import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock mediaStorage so tests don't touch IndexedDB. vi.hoisted runs before the
// hoisted vi.mock factory, so the mock fns are initialized in time.
const { saveMediaFileMock, deleteMediaFileMock } = vi.hoisted(() => ({
  saveMediaFileMock: vi.fn(),
  deleteMediaFileMock: vi.fn(),
}));
vi.mock('../lib/mediaStorage', () => ({
  saveMediaFile: saveMediaFileMock,
  deleteMediaFile: deleteMediaFileMock,
}));

import { useManagementStudio } from '../hooks/useManagementStudio';

function makeListing(overrides = {}) {
  return {
    id: 'listing-test',
    name: 'Test Stay',
    location: 'Test Location',
    price: 100,
    publishStatus: 'published',
    isDeleted: false,
    amenities: [],
    facilities: [],
    blockedDates: [],
    image: '',
    summaryImage: '',
    thumbnail: '',
    videoUrl: '',
    ratingLabel: '5.0',
    reviewCount: 0,
    ...overrides,
  };
}

// Build a real File (subclass of Blob) so `instanceof File` checks behave like
// in production. This is what the browser hands to <input type="file">.
function makeImageFile(name = 'photo.png') {
  return new File(['pixel-data'], name, { type: 'image/png' });
}

beforeEach(() => {
  vi.clearAllMocks();
  saveMediaFileMock.mockImplementation(async (file, field) => ({
    id: `ref-${field}`,
    name: file.name,
    type: file.type,
    size: file.size,
    field,
    savedAt: new Date().toISOString(),
  }));
});

describe('useManagementStudio — media sync regression guards', () => {
  it('handleListingSubmit passes raw File objects (not mediaRef wrappers) to onSaveListing', async () => {
    // Regression: both upload flows used to pass mediaRef metadata objects in
    // mediaFiles, but saveManagementListing filters values by `instanceof File`,
    // so the Supabase storage upload was always silently skipped. The fix stores
    // the raw File on the pending entry and passes File objects through.
    const onSaveListing = vi.fn().mockResolvedValue(undefined);
    // Pass a stable array reference; the hook does render-phase state sync keyed
    // off availableListings identity, so a fresh literal each render would loop.
    const listings = [makeListing()];
    const { result } = renderHook(() => useManagementStudio(listings, onSaveListing, vi.fn()));

    // Upload a media file via the hook (this populates pendingMediaFiles).
    const file = makeImageFile();
    await act(async () => {
      await result.current.handleMediaUpload('image', file);
    });

    // Submit the listing.
    await act(async () => {
      await result.current.handleListingSubmit({ preventDefault() {} });
    });

    expect(onSaveListing).toHaveBeenCalledTimes(1);
    const savedPayload = onSaveListing.mock.calls[0][0];
    const mediaFiles = savedPayload.mediaFiles;

    // The critical assertion: the value MUST be a File instance so
    // saveManagementListing's `instanceof File` filter accepts it and uploads
    // to Supabase storage. A mediaRef object would be silently dropped.
    expect(mediaFiles.image).toBeInstanceOf(File);
    expect(mediaFiles.image).toBe(file);
  });

  it('handleBulkUpload passes raw File objects to onSaveListing', async () => {
    // Regression: bulk upload passed a mediaRef object, which
    // saveManagementListing's `instanceof File` filter dropped.
    const onSaveListing = vi.fn().mockResolvedValue(undefined);
    // Stable array reference (see note above on render-phase sync).
    const listings = [makeListing({ id: 'l1' }), makeListing({ id: 'l2' })];
    const { result } = renderHook(() =>
      useManagementStudio(listings, onSaveListing, vi.fn()),
    );

    // Select both listings as bulk targets.
    act(() => {
      result.current.toggleAllBulkListings();
    });
    // Default bulkUploadField is 'image' (set in the hook).

    const file = makeImageFile('shared.png');
    await act(async () => {
      await result.current.handleBulkUpload([file]);
    });

    expect(onSaveListing).toHaveBeenCalledTimes(2);
    for (const call of onSaveListing.mock.calls) {
      const payload = call[0];
      expect(payload.mediaFiles.image).toBeInstanceOf(File);
      expect(payload.mediaFiles.image).toBe(file);
    }
  });

  it('handleMediaUpload never calls URL.createObjectURL with a non-Blob value', async () => {
    // Regression: passing a non-Blob to URL.createObjectURL throws
    // 'Failed to execute createObjectURL: Overload resolution failed'.
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const listings = [makeListing()];
    const { result } = renderHook(() => useManagementStudio(listings, vi.fn(), vi.fn()));

    // Happy path: a real File (which is a Blob subclass) is fine.
    const file = makeImageFile();
    await act(async () => {
      await result.current.handleMediaUpload('image', file);
    });
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledWith(file);

    createObjectURLSpy.mockRestore();
  });

  it('handleMediaUpload with a non-File value does not throw and skips createObjectURL', async () => {
    // Regression guard: if something other than a File/Blob reaches this path,
    // it must not crash with 'Overload resolution failed'. saveMediaFile returns
    // null for non-File input, so handleMediaUpload should bail without calling
    // URL.createObjectURL.
    saveMediaFileMock.mockResolvedValue(null);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const listings = [makeListing()];
    const { result } = renderHook(() => useManagementStudio(listings, vi.fn(), vi.fn()));

    await act(async () => {
      // A plain object is NOT a File.
      await result.current.handleMediaUpload('image', { name: 'not-a-file' });
    });

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    createObjectURLSpy.mockRestore();
  });
});
