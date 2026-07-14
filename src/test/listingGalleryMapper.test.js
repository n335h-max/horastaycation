import { describe, it, expect } from 'vitest';
import { normalizeListingPayload, fromRemoteManagementListing } from '../services/listingMapper';

/**
 * Regression / contract guards for the gallery_images feature.
 *
 * gallery_images is a jsonb array of public image URLs on management_listings.
 * The app works with galleryImages (camelCase). The mapper must:
 *  - default missing/invalid gallery to []
 *  - round-trip galleryImages <-> gallery_images
 *  - never touch existing single-image fields
 *  - fall back to the first gallery image for thumbnail when no thumbnail set
 *    (so a listing with only gallery photos still has a card image)
 */

describe('listingMapper — gallery_images (backward compatible)', () => {
  it('defaults galleryImages to [] when absent', () => {
    const out = normalizeListingPayload({ id: 'l1', name: 'A', location: 'B', price: 10 });
    expect(out.galleryImages).toEqual([]);
  });

  it('preserves an existing galleryImages array in order', () => {
    const out = normalizeListingPayload({
      id: 'l1',
      name: 'A',
      location: 'B',
      price: 10,
      galleryImages: ['u1', 'u2', 'u3'],
    });
    expect(out.galleryImages).toEqual(['u1', 'u2', 'u3']);
  });

  it('coerces a non-array galleryImages to []', () => {
    const out = normalizeListingPayload({ id: 'l1', name: 'A', location: 'B', price: 10, galleryImages: 'nope' });
    expect(out.galleryImages).toEqual([]);
  });

  it('maps remote gallery_images -> galleryImages', () => {
    const out = fromRemoteManagementListing({
      id: 'r1',
      name: 'A',
      location: 'B',
      price: 10,
      gallery_images: ['g1', 'g2'],
    });
    expect(out.galleryImages).toEqual(['g1', 'g2']);
  });

  it('defaults remote galleryImages to [] when column is null/missing', () => {
    expect(fromRemoteManagementListing({ id: 'r1', name: 'A', location: 'B', price: 10 }).galleryImages).toEqual([]);
    expect(
      fromRemoteManagementListing({ id: 'r1', name: 'A', location: 'B', price: 10, gallery_images: null })
        .galleryImages,
    ).toEqual([]);
  });

  it('uses the first gallery image as thumbnail when no thumbnail/image is set', () => {
    const out = normalizeListingPayload({
      id: 'l1',
      name: 'A',
      location: 'B',
      price: 10,
      thumbnail: '',
      image: '',
      summaryImage: '',
      galleryImages: ['g1', 'g2'],
    });
    expect(out.thumbnail).toBe('g1');
  });

  it('does not override an explicit thumbnail with a gallery image', () => {
    const out = normalizeListingPayload({
      id: 'l1',
      name: 'A',
      location: 'B',
      price: 10,
      thumbnail: 'explicit',
      galleryImages: ['g1', 'g2'],
    });
    expect(out.thumbnail).toBe('explicit');
  });

  it('leaves existing single-image fields untouched for legacy listings', () => {
    const out = normalizeListingPayload({
      id: 'l1',
      name: 'A',
      location: 'B',
      price: 10,
      image: 'i',
      summaryImage: 's',
      thumbnail: 't',
      galleryImages: [],
    });
    expect(out.image).toBe('i');
    expect(out.summaryImage).toBe('s');
    expect(out.thumbnail).toBe('t');
    expect(out.galleryImages).toEqual([]);
  });
});
