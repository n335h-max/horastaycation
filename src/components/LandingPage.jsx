import { Suspense, lazy, startTransition, useEffect, useRef, useState } from 'react';
import { OWNER_BENEFITS, STARTING_PACKAGE, TESTIMONIALS } from '../data/siteData';
import { WHATSAPP_SUPPORT_NUMBER } from '../lib/constants';
import { Icon } from './Icon';
import { HeroSection } from './landing/HeroSection';
import { IntroSection } from './landing/IntroSection';
import { PillarSection } from './landing/PillarSection';

const LazyGuestToolsSection = lazy(() =>
  import('./landing/GuestToolsSection').then((module) => ({ default: module.GuestToolsSection })),
);

const LazyConceptsSection = lazy(() =>
  import('./landing/ConceptsSection').then((module) => ({ default: module.ConceptsSection })),
);

const LazyTestimonialsSection = lazy(() =>
  import('./landing/TestimonialsSection').then((module) => ({ default: module.TestimonialsSection })),
);

function DeferredSection({ children, fallbackClassName }) {
  const [isVisible, setIsVisible] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(() => {
          setIsVisible(true);
        });

        observer.disconnect();
      },
      {
        rootMargin: '320px 0px',
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      {isVisible ? <Suspense fallback={<div className={fallbackClassName} />}>{children}</Suspense> : <div className={fallbackClassName} />}
    </>
  );
}

export function LandingPage({
  onShowPage,
  onScrollToSection,
  featuredProperties = [],
  formatCompactNumber,
  wishlistCount = 0,
  analyticsSummary,
  onOpenSupport,
  canInstallApp,
  onInstallApp,
}) {
  const [selectedFeaturedLocation, setSelectedFeaturedLocation] = useState('All locations');
  const safeFeaturedProperties = Array.isArray(featuredProperties)
    ? featuredProperties.filter(
        (property) =>
          property && typeof property === 'object' && typeof property.location === 'string' && property.location.trim(),
      )
    : [];
  const startingPackageIncludes = Array.isArray(STARTING_PACKAGE?.includes) ? STARTING_PACKAGE.includes : [];
  const whatsappBaseUrl = `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=`;
  const featuredLocationOptions = [
    'All locations',
    ...new Set(safeFeaturedProperties.map((property) => property.location)),
  ];
  const visibleFeaturedProperties =
    selectedFeaturedLocation === 'All locations'
      ? safeFeaturedProperties
      : safeFeaturedProperties.filter((property) => property.location === selectedFeaturedLocation);

  function handleBuildWithUsReveal() {
    window.setTimeout(() => {
      window.document.getElementById('proposal-projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  return (
    <div className="page-shell">
      <HeroSection
        onShowPage={onShowPage}
        featuredProperties={safeFeaturedProperties}
        formatCompactNumber={formatCompactNumber}
      />

      <IntroSection />

      <PillarSection />

      <DeferredSection fallbackClassName="min-h-[42rem] bg-white">
        <LazyGuestToolsSection
          featuredProperties={safeFeaturedProperties}
          analyticsSummary={analyticsSummary}
          onShowPage={onShowPage}
          onOpenSupport={onOpenSupport}
        />
      </DeferredSection>

      <DeferredSection fallbackClassName="min-h-[70rem] bg-white">
        <LazyConceptsSection onShowPage={onShowPage} onScrollToSection={onScrollToSection} />
      </DeferredSection>

      <DeferredSection fallbackClassName="min-h-[28rem] bg-ice-50">
        <LazyTestimonialsSection ownerBenefits={OWNER_BENEFITS} testimonials={TESTIMONIALS} />
      </DeferredSection>

      {/* Starting Package / CTA */}
      <DeferredSection fallbackClassName="min-h-[26rem] bg-white">
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 text-center md:px-8">
            <div className="mx-auto max-w-3xl rounded-[3rem] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-8 py-16 text-white shadow-2xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-400">Start Building</p>
              <h2 className="font-display text-4xl font-bold md:text-5xl">{STARTING_PACKAGE.title}</h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
                {STARTING_PACKAGE.summary || STARTING_PACKAGE.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
                {startingPackageIncludes.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold"
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-accent-400" />
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => onShowPage('owner-signup')}
                  className="btn-accent px-8 py-4 text-base"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon name="send" />
                    Start with Hora
                  </span>
                </button>
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
                <span className="inline-flex items-center gap-2">
                  <Icon name="shield" />
                  Zero upfront
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon name="star" />
                  Refundable deposit
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon name="calendar" />
                  Flexible terms
                </span>
              </div>
            </div>
          </div>
        </section>
      </DeferredSection>
    </div>
  );
}
