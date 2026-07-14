import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock supabaseClient: auth + remote upsert + media upload. uploadListingMediaFile
// returns a deterministic public URL per file so the gallery merge order can be
// asserted. localStore (loadStore/saveStore) uses the real localStorage store.
const { uploadMock, upsertMock } = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  upsertMock: vi.fn(),
}));
vi.mock('../services/supabaseClient', () => ({
  getAuthenticatedUser: vi.fn(async () => ({ id: 'mgmt-uuid', email: 'mgmt@example.com' })),
  uploadListingMediaFile: uploadMock,
  upsertRemote: upsertMock,
  fetchRemoteManagementListings: vi.fn(async () => ({ saved: false, error: null, listings: [] })),
  fetchRemoteBookingTransactions: vi.fn(async () => ({ saved: false, error: null, transactions: [] })),
  fetchRemoteOwnerApplications: vi.fn(async () => ({ saved: false, error: null, applications: [] })),
  fetchRemoteReviewSubmissions: vi.fn(async () => ({ saved: false, error: null, submissions: [] })),
}));

import { saveManagementListing } from '../services/listingService';
import { uploadListingMediaFile, upsertRemote } from '../services/supabaseClient';

function makeListing(overrides = {}) {
  return {
    id: 'l1',
    name: 'Stay',
    location: 'KL',
    price: 100,
    publishStatus: 'published',
    amenities: [],
    facilities: [],
    blockedDates: [],
    image: '',
    summaryImage: '',
    thumbnail: '',
    videoUrl: '',
    galleryImages: [],
    isDeleted: false,
    ratingLabel: '5.0',
    reviewCount: 0,
    ...overrides,
  };
}

function makeImageFile(name) {
  return new File(['data'], name, { type: 'image/png' });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Echo a public URL based on the file name so order is traceable.
  uploadMock.mockImplementation(async (listingId, field, file) => ({
    uploaded: true,
    error: null,
    url: `https://storage/${file.name}`,
    field,
    path: `listings/${listingId}/${field}`,
  }));
  upsertMock.mockImplementation(async (table, row) => ({
    saved: true,
    error: null,
    data: [row],
  }));
});

describe('saveManagementListing — gallery merge ordering (spec: ordered URLs)', () => {
  it('uploads pending gallery files and persists them in order', async () => {
    const files = [makeImageFile('a.png'), makeImageFile('b.png'), makeImageFile('c.png')];
    await saveManagementListing({
      ...makeListing(),
      mediaFiles: { gallery: files },
      galleryImageUrls: ['', '', ''], // 3 slots, all pending
    });

    expect(uploadListingMediaFile).toHaveBeenCalledTimes(3);
    const persisted = upsertRemote.mock.calls[0][1];
    expect(persisted.gallery_images).toEqual([
      'https://storage/a.png',
      'https://storage/b.png',
      'https://storage/c.png',
    ]);
  });

  it('retains saved gallery URLs in their positions, inserting uploaded ones in order', async () => {
    // Existing gallery: [saved-u1, <pending>, saved-u3]. Manager adds one new
    // photo in the middle slot. The merged order must keep u1, new photo, u3.
    await saveManagementListing({
      ...makeListing({ galleryImages: ['u1', 'u3'] }),
      mediaFiles: { gallery: [makeImageFile('new.png')] },
      galleryImageUrls: ['u1', '', 'u3'], // retained + 1 pending slot
    });

    const persisted = upsertRemote.mock.calls[0][1];
    expect(persisted.gallery_images).toEqual(['u1', 'https://storage/new.png', 'u3']);
  });

  it('deletes a gallery photo by dropping its URL (no effect on the others)', async () => {
    // Manager removed the middle photo: [u1, u2, u3] -> [u1, u3], no new files.
    await saveManagementListing({
      ...makeListing({ galleryImages: ['u1', 'u2', 'u3'] }),
      mediaFiles: {},
      galleryImageUrls: ['u1', 'u3'],
    });

    expect(uploadListingMediaFile).not.toHaveBeenCalled();
    const persisted = upsertRemote.mock.calls[0][1];
    expect(persisted.gallery_images).toEqual(['u1', 'u3']);
  });

  it('uses the first gallery image as thumbnail fallback when no thumbnail is set', async () => {
    await saveManagementListing({
      ...makeListing({ thumbnail: '', image: '', summaryImage: '' }),
      mediaFiles: { gallery: [makeImageFile('hero.png')] },
      galleryImageUrls: [''],
    });

    const persisted = upsertRemote.mock.calls[0][1];
    expect(persisted.gallery_images).toEqual(['https://storage/hero.png']);
    expect(persisted.thumbnail).toBe('https://storage/hero.png');
    expect(persisted.image).toBe('https://storage/hero.png');
    expect(persisted.summary_image).toBe('https://storage/hero.png');
  });

  it('does not override an explicit thumbnail', async () => {
    await saveManagementListing({
      ...makeListing({ thumbnail: 'explicit', image: 'i', summaryImage: 's' }),
      mediaFiles: { gallery: [makeImageFile('hero.png')] },
      galleryImageUrls: [''],
    });

    const persisted = upsertRemote.mock.calls[0][1];
    expect(persisted.thumbnail).toBe('explicit');
    expect(persisted.image).toBe('i');
  });

  it('still uploads single-file media fields (image/video) alongside gallery', async () => {
    await saveManagementListing({
      ...makeListing(),
      mediaFiles: { image: makeImageFile('hero.png'), videoUrl: makeImageFile('tour.mp4'), gallery: [makeImageFile('g1.png')] },
      galleryImageUrls: [''],
    });

    expect(uploadListingMediaFile).toHaveBeenCalledTimes(3);
    const persisted = upsertRemote.mock.calls[0][1];
    expect(persisted.image).toBe('https://storage/hero.png');
    expect(persisted.video_url).toBe('https://storage/tour.mp4');
    expect(persisted.gallery_images).toEqual(['https://storage/g1.png']);
  });
});
