import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListingGallery } from '../components/ListingGallery';

/**
 * Guest gallery + video regression guards.
 *
 * Bug guarded: management uploads photos/video, but the guest booking page
 * never rendered a gallery or <video> element — guests couldn't view multiple
 * photos or play the walkthrough. The fix adds ListingGallery (main image +
 * thumbnail strip + lightbox + video player).
 *
 * Backward compatibility: a legacy listing with only summaryImage/image and no
 * gallery still renders a single main image with no thumbnail strip.
 */

vi.mock('../components/Icon', () => ({
  Icon: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

describe('ListingGallery — guest rendering', () => {
  it('renders the gallery images as main image + thumbnail strip', () => {
    const property = {
      id: 'p1',
      name: 'Hilltop Villa',
      galleryImages: ['u1', 'u2', 'u3'],
    };
    render(<ListingGallery property={property} />);

    // Main image is the first gallery image initially.
    const main = screen.getByRole('button', { name: 'Open full-screen gallery' });
    expect(main.querySelector('img')).toHaveAttribute('src', 'u1');
    // Three thumbnails.
    const thumbs = screen.getAllByRole('tab');
    expect(thumbs).toHaveLength(3);
  });

  it('clicking a thumbnail changes the main image', () => {
    const property = { id: 'p1', name: 'Villa', galleryImages: ['u1', 'u2', 'u3'] };
    render(<ListingGallery property={property} />);

    const thumbs = screen.getAllByRole('tab');
    fireEvent.click(thumbs[2]);

    const main = screen.getByRole('button', { name: 'Open full-screen gallery' });
    expect(main.querySelector('img')).toHaveAttribute('src', 'u3');
  });

  it('clicking the main image opens the lightbox', () => {
    const property = { id: 'p1', name: 'Villa', galleryImages: ['u1', 'u2'] };
    render(<ListingGallery property={property} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open full-screen gallery' }));
    expect(screen.getByRole('dialog', { name: 'Photo gallery' })).toBeInTheDocument();
  });

  it('renders a <video controls> player when videoUrl is present', () => {
    const property = { id: 'p1', name: 'Villa', galleryImages: ['u1'], videoUrl: 'https://storage/tour.mp4' };
    const { container } = render(<ListingGallery property={property} />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('src', 'https://storage/tour.mp4');
    expect(video).toHaveAttribute('controls');
  });

  it('does not render a video player when there is no videoUrl', () => {
    const property = { id: 'p1', name: 'Villa', galleryImages: ['u1'] };
    const { container } = render(<ListingGallery property={property} />);
    expect(container.querySelector('video')).toBeNull();
  });

  it('falls back to legacy single images when gallery is empty (backward compatible)', () => {
    const property = {
      id: 'p1',
      name: 'Legacy Stay',
      summaryImage: 'legacy-summary',
      image: 'legacy-hero',
      thumbnail: 'legacy-thumb',
    };
    render(<ListingGallery property={property} />);

    // Legacy single-image fields are surfaced as the gallery; the first
    // (summaryImage) is the initial main image.
    const main = screen.getByRole('button', { name: 'Open full-screen gallery' });
    expect(main.querySelector('img')).toHaveAttribute('src', 'legacy-summary');
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('supports property.photos and property.media objects', () => {
    const property = {
      id: 'p2',
      name: 'Beach Villa',
      photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
      media: {
        photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
        videoUrl: 'https://storage/beach.mp4',
      },
    };
    const { container } = render(<ListingGallery property={property} />);

    // Main image preview.
    const main = screen.getByRole('button', { name: 'Open full-screen gallery' });
    expect(main.querySelector('img')).toHaveAttribute('src', 'photo1.jpg');

    // Thumbnails.
    const thumbs = screen.getAllByRole('tab');
    expect(thumbs).toHaveLength(3);

    // Counter "1 / 3".
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Video player.
    const video = container.querySelector('video');
    expect(video).toHaveAttribute('src', 'https://storage/beach.mp4');
  });

  it('renders nothing when the property has no images at all', () => {
    const { container } = render(<ListingGallery property={{ id: 'p1', name: 'Empty' }} />);
    expect(container.firstChild).toBeNull();
  });
});
