import { useState } from 'react';
import { Icon } from '../Icon';
import { ListingImage } from '../ListingImage';
import { STATS } from '../../data/siteData';

const HERO_TRUST_SIGNALS = ['Happy Guests', 'Quality Rated', 'Owner-Ready Listings'];

function StatCard({ stat, formatter }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-4 text-center backdrop-blur-sm">
      <div className="text-2xl font-bold text-white md:text-3xl">
        {stat.prefix ?? ''}
        {formatter(stat.value)}
        {stat.suffix ?? '+'}
      </div>
      <div className="mt-1 text-xs text-white/60 md:text-sm">{stat.label}</div>
    </div>
  );
}

function HeroCarousel({ properties, activeIndex, onStep }) {
  const [heroTouchStartX, setHeroTouchStartX] = useState(null);

  function handleTouchStart(event) {
    setHeroTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event) {
    if (heroTouchStartX == null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? heroTouchStartX;
    const deltaX = touchEndX - heroTouchStartX;
    setHeroTouchStartX(null);
    if (Math.abs(deltaX) < 45) return;
    onStep(deltaX < 0 ? 1 : -1);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onStep(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onStep(1);
    }
  }

  if (!properties.length) {
    return (
      <article className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-sm">
        <div className="relative flex aspect-[4/5] items-center justify-center sm:aspect-[16/11] lg:aspect-[4/5]">
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/20 to-transparent" />
          <div className="relative z-10 text-center text-white">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15">
              <Icon name="home" className="text-3xl text-white/70" />
            </div>
            <div className="font-display text-3xl font-bold">Coming Soon</div>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/70">
              New staycations are being prepared by our management team. Check back soon for curated escapes.
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-sm">
      <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/5]">
        <div
          className="hero-carousel absolute inset-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          role="region"
          aria-label="Staycation carousel"
          aria-roledescription="carousel"
          tabIndex={0}
        >
          <div
            className="hero-carousel-track"
            style={{
              transform: `translateX(calc(50% - (var(--hero-card-width) / 2) - ${activeIndex} * (var(--hero-card-width) + var(--hero-card-gap))))`,
            }}
          >
            {properties.map((property, index) => (
              <div
                key={property.id}
                className={`hero-carousel-card ${index === activeIndex ? 'is-active' : ''}`}
                aria-hidden={index !== activeIndex}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${properties.length}: ${property.name}`}
              >
                <ListingImage
                  src={property.summaryImage || property.image}
                  alt={property.name}
                  width="420"
                  height="560"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover"
                />
                <div className="hero-carousel-card-overlay">
                  <div className="hero-carousel-card-label">{property.location}</div>
                  <div className="hero-carousel-card-title">{property.name}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onStep(-1)}
            className="hero-carousel-arrow hero-carousel-arrow-left"
            aria-label="Show previous staycation"
          >
            <Icon name="arrow-right" className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            className="hero-carousel-arrow hero-carousel-arrow-right"
            aria-label="Show next staycation"
          >
            <Icon name="arrow-right" />
          </button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/20 to-transparent" />
        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-brand-900">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          {properties.length} Staycation Showcase
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Staycation Carousel
                </div>
                <div className="mt-2 font-display text-3xl font-bold">Centered view, easy browse</div>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">
                  Browse one stay at a time with full-photo cards, side peeks for the next options, and quick left-right
                  navigation.
                </p>
              </div>
              <div className="hidden rounded-2xl bg-white/15 px-4 py-3 text-right sm:block">
                <div className="text-xs uppercase tracking-[0.2em] text-white/55">Now Viewing</div>
                <div className="mt-1 text-2xl font-bold">
                  {activeIndex + 1}/{properties.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HeroSection({ onShowPage, featuredProperties, formatCompactNumber }) {
  const [heroActiveIndex, setHeroActiveIndex] = useState(0);
  const heroShowcaseProperties = featuredProperties.slice(0, 7);

  function handleHeroStep(direction) {
    if (!heroShowcaseProperties.length) return;
    setHeroActiveIndex(
      (current) => (current + direction + heroShowcaseProperties.length) % heroShowcaseProperties.length,
    );
  }

  return (
    <section className="hero-bg relative flex min-h-screen items-center overflow-hidden">
      <div className="animate-float absolute right-10 top-20 h-20 w-20 rounded-full bg-accent-400/15 blur-sm" />
      <div className="animate-float-slow absolute bottom-32 left-10 h-32 w-32 rounded-full bg-brand-400/10 blur-sm" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 md:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl text-center lg:text-left">
            <div className="glass-panel mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-accent-400" />
              <span className="text-sm font-medium text-white/80">Curated escapes for guests and owners</span>
            </div>
            <h1 className="font-display text-5xl leading-tight font-black text-white md:text-7xl">Book Your Escape</h1>
            <p className="mt-4 text-lg leading-relaxed text-white/80 md:text-xl">
              HORA Staycation pairs peaceful tiny-house stays, elevated ambience, and owner-ready hospitality tools in
              one refined experience.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {HERO_TRUST_SIGNALS.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur-sm"
                >
                  {signal}
                </span>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <button type="button" onClick={() => onShowPage('booking')} className="btn-primary px-7 py-4 text-base">
                <span className="inline-flex items-center gap-2">
                  Book Your Escape
                  <Icon name="arrow-right" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => onShowPage('owner-signup')}
                className="btn-accent px-7 py-4 text-base"
              >
                Build With Hora
              </button>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STATS.map((stat) => (
                <StatCard key={stat.label} stat={stat} formatter={formatCompactNumber} />
              ))}
            </div>
          </div>

          <div className="relative">
            <HeroCarousel properties={heroShowcaseProperties} activeIndex={heroActiveIndex} onStep={handleHeroStep} />
          </div>
        </div>
      </div>
    </section>
  );
}
