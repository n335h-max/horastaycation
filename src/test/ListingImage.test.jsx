import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ListingImage } from '../components/ListingImage';

/**
 * Regression guards for ListingImage.
 *
 * Bugs guarded:
 *   1. Broken-image fallback — a bare <img src=""> (or undefined/whitespace src)
 *      renders the browser's broken-image icon. Listings created in the
 *      management studio have empty image fields, so cards looked broken.
 *   2. hasError reset — a single transient load failure used to permanently
 *      pin a card to the placeholder even after the listing (and its image
 *      URL) changed, because hasError was never cleared.
 *   3. createObjectURL safety — a revoked/empty blob URL must never crash the
 *      render and must fall through to the placeholder rather than showing a
 *      broken <img>. (Related class of bug to the createObjectURL guards
 *      elsewhere in the codebase.)
 */

describe('ListingImage — broken-image fallback', () => {
  it('renders the placeholder (not a bare <img src="">) when src is empty', () => {
    const { container } = render(<ListingImage src="" alt="Stay" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Stay');
  });

  it('renders the placeholder when src is undefined or whitespace', () => {
    const { container } = render(<ListingImage src={undefined} alt="Stay" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Stay' })).toBeInTheDocument();

    const { container: c2 } = render(<ListingImage src="   " alt="Stay" />);
    expect(c2.querySelector('img')).toBeNull();
  });

  it('renders a real <img> with the provided src when src is valid', () => {
    const { container } = render(<ListingImage src="https://example.com/photo.jpg" alt="Stay" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    expect(img).toHaveAttribute('alt', 'Stay');
  });

  it('falls back to the placeholder when the image fails to load (onError)', () => {
    const { container } = render(<ListingImage src="https://example.com/missing.jpg" alt="Stay" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();

    fireEvent.error(img);

    // After the error, the <img> is replaced by the placeholder div.
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Stay' })).toBeInTheDocument();
  });
});

describe('ListingImage — hasError resets when src changes', () => {
  it('renders the image again after the src changes following a load failure', () => {
    // Regression: one transient failure permanently pinned the card to the
    // placeholder. After fixing the source, hasError resets via the
    // adjust-state-during-render pattern when safeSrc changes.
    const { rerender, container } = render(
      <ListingImage src="https://example.com/broken.jpg" alt="Stay" />,
    );
    const img = container.querySelector('img');
    fireEvent.error(img); // first URL fails -> placeholder
    expect(container.querySelector('img')).toBeNull();

    // Switch to a different src; the error must clear and an <img> renders.
    rerender(<ListingImage src="https://example.com/good.jpg" alt="Stay" />);
    const nextImg = container.querySelector('img');
    expect(nextImg).not.toBeNull();
    expect(nextImg).toHaveAttribute('src', 'https://example.com/good.jpg');
  });

  it('keeps showing the placeholder when the same failing src is re-supplied', () => {
    const src = 'https://example.com/broken.jpg';
    const { rerender, container } = render(<ListingImage src={src} alt="Stay" />);
    fireEvent.error(container.querySelector('img'));
    expect(container.querySelector('img')).toBeNull();

    // Same src value — safeSrc does not change, so hasError stays true.
    rerender(<ListingImage src={src} alt="Stay" />);
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('ListingImage — revoked / empty blob URL safety', () => {
  it('treats a revoked blob URL like a failed load and never calls createObjectURL', () => {
    // A revoked blob: URL still looks like a non-empty string, so <img> renders
    // and fires onError. The component must surface the placeholder rather than
    // a broken image, and must not itself touch URL.createObjectURL.
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

    const { container } = render(<ListingImage src="blob:https://example.com/revoked" alt="Stay" />);
    fireEvent.error(container.querySelector('img'));

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Stay' })).toBeInTheDocument();
    expect(createObjectURLSpy).not.toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
  });
});
