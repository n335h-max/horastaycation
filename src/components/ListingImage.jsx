import { useState } from 'react';
import { Icon } from './Icon';

/**
 * ListingImage — renders a listing/property image with graceful fallback.
 *
 * Why this exists: listings created in the management studio can have empty
 * image fields (no upload yet), and remote image URLs can 404 or fail to
 * load. A bare <img src=""> or <img src={undefined}> shows the browser's
 * broken-image icon, which looks broken to users.
 *
 * This component:
 *   - Renders a neutral placeholder when src is empty/missing
 *   - Falls back to the placeholder when the image fails to load (onError)
 *   - Keeps the same sizing/className contract as a plain <img>
 */
export function ListingImage({ src, alt, className, width, height, loading = 'lazy', fetchPriority }) {
  const [hasError, setHasError] = useState(false);
  const safeSrc = typeof src === 'string' && src.trim() ? src : '';
  const [lastSrc, setLastSrc] = useState(safeSrc);

  // Reset the error state when the src changes, otherwise a single transient
  // load failure would permanently pin this card to the placeholder even after
  // the listing (and its image URL) changes. Adjusting state during render is
  // the React-recommended pattern for this (avoids a cascading-render effect).
  if (safeSrc !== lastSrc) {
    setLastSrc(safeSrc);
    setHasError(false);
  }

  if (!safeSrc || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-ice-100 text-brand-400 ${className || ''}`}
        role="img"
        aria-label={alt || 'No image available'}
      >
        <Icon name="home" className="text-2xl text-brand-300" />
      </div>
    );
  }

  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={safeSrc}
      alt={alt || ''}
      width={width}
      height={height}
      loading={loading}
      {...(fetchPriority ? { fetchPriority } : {})}
      className={`${className} transition-[filter] duration-500 ease-out ${loaded ? 'blur-0' : 'blur-md scale-[1.03]'}`}
      style={{ willChange: 'filter' }}
      onLoad={() => setLoaded(true)}
      onError={() => setHasError(true)}
    />
  );
}
