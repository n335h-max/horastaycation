import { useState } from 'react';
import { Icon } from './Icon';

function getResponsiveSources(src) {
  if (typeof src !== 'string') return null;
  const match = src.match(/^\/?(staycations\/[^\s]+?)(?:-(?:400w|800w))?\.(png|webp|jpg|jpeg)$/i);
  if (!match) return null;
  const basePath = '/' + match[1].replace(/^\//, '');
  return {
    webpSrcSet: `${basePath}-400w.webp 400w, ${basePath}-800w.webp 800w`,
    jpegSrcSet: `${basePath}-400w.jpg 400w, ${basePath}-800w.jpg 800w`,
    fallbackSrc: `${basePath}.jpg`,
  };
}

/**
 * ListingImage — renders a listing/property image with graceful fallback and
 * responsive WebP + JPEG fallback support for local staycation assets.
 */
export function ListingImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  fetchPriority,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px',
}) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const safeSrc = typeof src === 'string' && src.trim() ? src : '';
  const [lastSrc, setLastSrc] = useState(safeSrc);

  if (safeSrc !== lastSrc) {
    setLastSrc(safeSrc);
    setHasError(false);
    setLoaded(false);
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

  const sources = getResponsiveSources(safeSrc);

  const imgElement = (
    <img
      src={sources ? sources.fallbackSrc : safeSrc}
      alt={alt || ''}
      width={width}
      height={height}
      loading={loading}
      {...(fetchPriority ? { fetchPriority } : {})}
      className={`${className || ''} transition-[filter] duration-500 ease-out ${loaded ? 'blur-0' : 'blur-md scale-[1.03]'}`}
      style={{ willChange: 'filter' }}
      onLoad={() => setLoaded(true)}
      onError={() => setHasError(true)}
    />
  );

  if (sources) {
    return (
      <picture className={className}>
        <source type="image/webp" srcSet={sources.webpSrcSet} sizes={sizes} />
        <source type="image/jpeg" srcSet={sources.jpegSrcSet} sizes={sizes} />
        {imgElement}
      </picture>
    );
  }

  return imgElement;
}

