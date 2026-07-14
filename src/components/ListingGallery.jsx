import { useCallback, useEffect, useRef, useState } from 'react';
import { ListingImage } from './ListingImage';
import { Icon } from './Icon';

/**
 * Guest-facing listing gallery + video walkthrough.
 *
 * Spec (Airbnb/Booking.com style):
 *   - Large main image at the top.
 *   - Horizontally scrollable thumbnail strip below it.
 *   - Clicking a thumbnail changes the main image.
 *   - Clicking the main image opens a full-screen lightbox.
 *   - Lightbox supports prev/next + swipe gestures on mobile.
 *   - If a video URL is present, render a <video controls> player.
 *
 * Backward compatible: listings with no gallery fall back to the legacy
 * summaryImage/image/thumbnail single images, and no video means no player.
 */

function collectGalleryImages(property) {
  if (!property) return [];
  const gallery = Array.isArray(property.galleryImages) ? property.galleryImages.filter(Boolean) : [];
  if (gallery.length) return gallery;
  // Legacy fallback: surface the existing single-image fields.
  return [property.summaryImage, property.image, property.thumbnail].filter(Boolean);
}

export function ListingGallery({ property }) {
  const images = collectGalleryImages(property);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const stripRef = useRef(null);
  const touchStartX = useRef(null);
  const prevPropertyId = useRef(property?.id);

  // Reset to the first image when the selected property changes (adjusting
  // state during render, per React's guidance, avoids a cascading effect).
  if (property?.id !== prevPropertyId.current) {
    prevPropertyId.current = property?.id;
    if (activeIndex !== 0) setActiveIndex(0);
  }

  // Sync the thumbnail strip so the active thumb is scrolled into view.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const activeChild = strip.children[activeIndex];
    if (activeChild && typeof activeChild.scrollIntoView === 'function') {
      activeChild.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeIndex]);

  const goTo = useCallback(
    (index) => {
      setActiveIndex(() => {
        if (!images.length) return 0;
        return (index + images.length) % images.length;
      });
    },
    [images.length],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Close lightbox on Escape; swipe handled on the lightbox image.
  useEffect(() => {
    if (!lightboxOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen, goNext, goPrev]);

  if (!property || !images.length) return null;

  const mainSrc = images[activeIndex] || images[0];
  const hasMultiple = images.length > 1;

  return (
    <section className="overflow-hidden rounded-[1.2rem] border border-ice-200 bg-white shadow-sm">
      <div className="relative">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block w-full cursor-zoom-in"
          aria-label="Open full-screen gallery"
        >
          <ListingImage
            src={mainSrc}
            alt={property.name}
            className="h-64 w-full object-cover md:h-80"
          />
        </button>
        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-900 shadow hover:bg-white"
              aria-label="Previous photo"
            >
              <Icon name="arrow-right" className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-900 shadow hover:bg-white"
              aria-label="Next photo"
            >
              <Icon name="arrow-right" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-brand-950/70 px-2.5 py-1 text-xs font-semibold text-white">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto p-3"
          role="tablist"
          aria-label="Gallery thumbnails"
        >
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                index === activeIndex ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <ListingImage src={src} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {property.videoUrl ? (
        <div className="border-t border-ice-200 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Video walkthrough</div>
          <video
            src={property.videoUrl}
            controls
            playsInline
            preload="metadata"
            className="h-64 w-full rounded-xl bg-black object-contain md:h-72"
          />
        </div>
      ) : null}

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const delta = event.changedTouches[0]?.clientX - touchStartX.current;
            if (delta > 40) goPrev();
            else if (delta < -40) goNext();
            touchStartX.current = null;
          }}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close gallery"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            <Icon name="close" />
          </button>
          {hasMultiple ? (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Previous photo"
                onClick={(event) => {
                  event.stopPropagation();
                  goPrev();
                }}
              >
                <Icon name="arrow-right" className="rotate-180" />
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Next photo"
                onClick={(event) => {
                  event.stopPropagation();
                  goNext();
                }}
              >
                <Icon name="arrow-right" />
              </button>
            </>
          ) : null}
          <img
            src={mainSrc}
            alt={property.name}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </section>
  );
}
