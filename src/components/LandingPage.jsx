import { useState } from 'react';
import {
  ADD_ON_OPTIONS,
  CONCEPT_OPTIONS,
  FEATURED_PROPERTIES,
  FEATURE_PILLARS,
  HORA_VALUES,
  OWNER_BENEFITS,
  PREVIOUS_PROJECTS,
  STARTING_PACKAGE,
  STATS,
  TESTIMONIALS,
} from '../data/siteData';
import { Icon } from './Icon';

const HERO_TRUST_SIGNALS = ['100+ Happy Guests', '5-Star Rated', 'Owner-Ready Listings'];

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

function PillarCard({ pillar }) {
  return (
    <article className="group rounded-2xl border border-ice-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 transition-colors duration-300 group-hover:bg-brand-100">
        <Icon name={pillar.icon} className="text-2xl text-brand-600" />
      </div>
      <h3 className="font-display text-lg font-bold text-brand-900">{pillar.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{pillar.description}</p>
    </article>
  );
}

function LiveToolCard({ title, description, icon, action, accentClass = 'bg-brand-50 text-brand-600' }) {
  return (
    <article className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accentClass}`}>
        <Icon name={icon} className="text-xl" />
      </div>
      <h3 className="font-display text-2xl font-bold text-brand-950">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{description}</p>
      <div className="mt-5">{action}</div>
    </article>
  );
}

function PreviousProjectCard({ project }) {
  return (
    <article className="rounded-2xl border border-ice-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
        {project.label}
      </div>
      <h3 className="font-display text-2xl font-bold text-brand-950">{project.name}</h3>
      <p className="mt-1 text-sm font-semibold text-brand-600">{project.location}</p>
      <p className="mt-4 text-sm leading-relaxed text-slate-500">{project.summary}</p>
    </article>
  );
}

function ConceptCard({ concept }) {
  return (
    <article className="rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name={concept.icon} className="text-2xl" />
      </div>
      <h3 className="font-display text-2xl font-bold text-brand-950">{concept.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{concept.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {concept.points.map((point) => (
          <span key={point} className="rounded-full bg-ice-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {point}
          </span>
        ))}
      </div>
    </article>
  );
}

function AddOnCard({ item }) {
  return (
    <article className="rounded-2xl border border-ice-200 bg-white p-6 shadow-sm">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name={item.icon} className="text-xl" />
      </div>
      <h3 className="font-display text-xl font-bold text-brand-950">{item.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.summary}</p>
    </article>
  );
}

export function LandingPage({
  onShowPage,
  onScrollToSection,
  featuredProperties = FEATURED_PROPERTIES,
  formatCompactNumber,
  formatCurrency,
  wishlistCount = 0,
  analyticsSummary,
  onOpenSupport,
  canInstallApp,
  onInstallApp,
}) {
  const [proposalSectionsOpen, setProposalSectionsOpen] = useState(false);
  const [heroActiveIndex, setHeroActiveIndex] = useState(0);
  const [heroTouchStartX, setHeroTouchStartX] = useState(null);
  const heroShowcaseProperties = featuredProperties.slice(0, 7);

  function handleHeroStep(direction) {
    if (!heroShowcaseProperties.length) {
      return;
    }

    setHeroActiveIndex((current) => (current + direction + heroShowcaseProperties.length) % heroShowcaseProperties.length);
  }

  function handleHeroTouchStart(event) {
    setHeroTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleHeroTouchEnd(event) {
    if (heroTouchStartX == null) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX ?? heroTouchStartX;
    const deltaX = touchEndX - heroTouchStartX;
    setHeroTouchStartX(null);

    if (Math.abs(deltaX) < 45) {
      return;
    }

    handleHeroStep(deltaX < 0 ? 1 : -1);
  }

  function handleBuildWithUsReveal() {
    setProposalSectionsOpen(true);
    window.setTimeout(() => {
      window.document.getElementById('proposal-projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  return (
    <div className="page-shell">
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
              <h1 className="font-display text-5xl leading-tight font-black text-white md:text-7xl">
                Book Your Escape
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/80 md:text-xl">
                HORA Staycation pairs peaceful tiny-house stays, elevated ambience, and owner-ready hospitality tools in one refined experience.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {HERO_TRUST_SIGNALS.map((signal) => (
                  <span key={signal} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur-sm">
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
                <button type="button" onClick={() => onShowPage('owner-signup')} className="btn-accent px-7 py-4 text-base">
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
              <article className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-sm">
                <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/5]">
                  <div
                    className="hero-carousel absolute inset-0"
                    onTouchStart={handleHeroTouchStart}
                    onTouchEnd={handleHeroTouchEnd}
                  >
                    <div
                      className="hero-carousel-track"
                      style={{
                        transform: `translateX(calc(50% - (var(--hero-card-width) / 2) - ${heroActiveIndex} * (var(--hero-card-width) + var(--hero-card-gap))))`,
                      }}
                    >
                      {heroShowcaseProperties.map((property, index) => (
                        <article
                          key={property.id}
                          className={`hero-carousel-card ${index === heroActiveIndex ? 'is-active' : ''}`}
                          aria-hidden={index !== heroActiveIndex}
                        >
                          <img
                            src={property.summaryImage || property.image}
                            alt={property.name}
                            width="420"
                            height="560"
                            fetchPriority={index === 0 ? 'high' : 'auto'}
                            className="h-full w-full object-cover"
                          />
                          <div className="hero-carousel-card-overlay">
                            <div className="hero-carousel-card-label">{property.location}</div>
                            <div className="hero-carousel-card-title">{property.name}</div>
                          </div>
                        </article>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleHeroStep(-1)}
                      className="hero-carousel-arrow hero-carousel-arrow-left"
                      aria-label="Show previous staycation"
                    >
                      <Icon name="arrow-right" className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHeroStep(1)}
                      className="hero-carousel-arrow hero-carousel-arrow-right"
                      aria-label="Show next staycation"
                    >
                      <Icon name="arrow-right" />
                    </button>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/20 to-transparent" />
                  <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-brand-900">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    7 Staycation Showcase
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Staycation Carousel</div>
                          <div className="mt-2 font-display text-3xl font-bold">Centered view, easy browse</div>
                          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75">
                            Browse one stay at a time with full-photo cards, side peeks for the next options, and quick left-right navigation.
                          </p>
                        </div>
                        <div className="hidden rounded-2xl bg-white/15 px-4 py-3 text-right sm:block">
                          <div className="text-xs uppercase tracking-[0.2em] text-white/55">Now Viewing</div>
                          <div className="mt-1 text-2xl font-bold">{heroActiveIndex + 1}/{heroShowcaseProperties.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="intro" className="relative overflow-hidden bg-white py-24">
        <div className="dot-pattern absolute inset-0 opacity-50" />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-16 px-4 md:grid-cols-2 md:px-8">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">The Meaning of Hora</p>
              <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Time, rest, and beautiful moments</h2>
            </div>
            <p className="text-lg leading-relaxed text-slate-600">
              <strong className="text-brand-700">Hora</strong> comes from the Greek word for <em>time</em> or <em>season</em>. In the proposal, it represents the belief that every moment is a chance to rest, gather, and create meaningful memories.
            </p>
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <img
                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=stylish%20modern%20tiny-house%20staycation%20interior%20with%20warm%20wood%20textures%2C%20soft%20natural%20light%2C%20premium%20boutique%20hospitality%20photo%2C%20photorealistic&image_size=landscape_4_3"
                alt="Stylish staycation house"
                width="600"
                height="500"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">What HORA stands for</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {HORA_VALUES.map((item) => (
                <article key={item.letter} className="rounded-3xl bg-brand-950 p-6 text-white shadow-xl">
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.cardClass} font-display text-2xl font-bold`}>
                    {item.letter}
                  </div>
                  <h3 className="font-display text-2xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ice-50 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Hora Staycation</p>
            <h2 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">Your Staycation Partner</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {FEATURE_PILLARS.map((pillar) => (
              <PillarCard key={pillar.title} pillar={pillar} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Guest Tools</p>
            <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Search, save, and book faster</h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Hora now supports real search, wishlist saving, chat support, mobile install, and live business reporting in the operations dashboard.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-8 text-white shadow-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                <Icon name="search" />
                Discovery Search
              </div>
              <h3 className="mt-5 font-display text-4xl font-bold">Search by location and stay dates before checkout</h3>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
                Guests can filter properties on the booking page by keyword, location, availability window, and guest count before choosing a staycation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {featuredProperties.slice(0, 3).map((property) => (
                  <span key={property.id} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85">
                    {property.location}
                  </span>
                ))}
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/55">Searches</div>
                  <div className="mt-2 text-3xl font-bold">{analyticsSummary?.searches ?? 0}</div>
                </div>
                <div className="rounded-3xl bg-white/10 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/55">Bookings</div>
                  <div className="mt-2 text-3xl font-bold">{analyticsSummary?.bookings ?? 0}</div>
                </div>
                <div className="rounded-3xl bg-white/10 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/55">Conversion</div>
                  <div className="mt-2 text-3xl font-bold">{analyticsSummary?.conversionRate ?? 0}%</div>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button type="button" onClick={() => onShowPage('booking')} className="btn-accent px-7 py-4 text-base">
                  Search Staycations
                </button>
                <button type="button" onClick={onOpenSupport} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-base font-semibold text-white">
                  Ask Chat Support
                </button>
              </div>
            </article>

            <div className="grid gap-6">
              <LiveToolCard
                title="Wishlist"
                description="Saved properties stay attached to the current guest session or signed-in user so high-intent guests can come back later."
                icon="heart"
                action={
                  <div className="rounded-2xl bg-ice-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Saved Stays</div>
                    <div className="mt-2 text-2xl font-bold text-brand-950">{wishlistCount}</div>
                  </div>
                }
                accentClass="bg-rose-50 text-rose-600"
              />

              <LiveToolCard
                title="Chat Support"
                description="A floating support chat is now available while browsing and booking so guests can ask for help without leaving the flow."
                icon="comment"
                action={
                  <button type="button" onClick={onOpenSupport} className="btn-primary w-full py-3 text-sm">
                    <span className="inline-flex items-center gap-2">
                      Open Support
                      <Icon name="arrow-right" />
                    </span>
                  </button>
                }
                accentClass="bg-emerald-50 text-emerald-600"
              />

              <LiveToolCard
                title="Mobile App"
                description="Hora is now installable as a progressive web app so mobile guests can keep a home-screen booking flow without a separate store build."
                icon="mobile"
                action={
                  canInstallApp ? (
                    <button type="button" onClick={onInstallApp} className="btn-primary w-full py-3 text-sm">
                      <span className="inline-flex items-center gap-2">
                        Install Hora
                        <Icon name="download" />
                      </span>
                    </button>
                  ) : (
                    <div className="rounded-2xl bg-ice-50 px-4 py-3 text-sm font-medium text-brand-900">
                      Mobile-first PWA is live and ready to install when the browser exposes the prompt.
                    </div>
                  )
                }
                accentClass="bg-cyan-50 text-cyan-700"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-ice-200 bg-ice-50 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Consent-aware analytics</div>
              <div className="mt-3 text-3xl font-bold text-brand-950">{analyticsSummary?.pageViews ?? 0}</div>
              <p className="mt-2 text-sm text-slate-500">Page views are tracked only when guests allow analytics in the privacy banner.</p>
            </div>
            <div className="rounded-3xl border border-ice-200 bg-ice-50 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Support activity</div>
              <div className="mt-3 text-3xl font-bold text-brand-950">{analyticsSummary?.supportMessages ?? 0}</div>
              <p className="mt-2 text-sm text-slate-500">Support requests flow into the management workspace so the team can follow up faster.</p>
            </div>
            <div className="rounded-3xl border border-ice-200 bg-ice-50 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Wishlisted stays</div>
              <div className="mt-3 text-3xl font-bold text-brand-950">{analyticsSummary?.uniqueWishlistedProperties ?? 0}</div>
              <p className="mt-2 text-sm text-slate-500">Saved-property behavior now feeds conversion insight inside the operations dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="build" className="dot-pattern relative py-24">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 md:grid-cols-2 md:px-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2">
              <Icon name="home" className="text-sm text-brand-600" />
              <span className="text-sm font-semibold text-brand-700">For Property Owners</span>
            </div>
            <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Build with Us</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Use the owner route for people who want to build or refurbish a staycation with Hora. The proposal frames this as a compact, well-worth-the-experience setup with landscape, ambience, and add-on planning.
            </p>
            <div className="mt-8 rounded-3xl border border-brand-100 bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Budget Guide</p>
                  <h3 className="mt-2 font-display text-3xl font-bold text-brand-950">{STARTING_PACKAGE.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">{STARTING_PACKAGE.description}</p>
                </div>
                <div className="rounded-2xl bg-brand-950 px-6 py-5 text-white shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Proposal Reference</div>
                  <div className="mt-2 font-display text-4xl font-bold">{STARTING_PACKAGE.priceLabel}</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {STARTING_PACKAGE.highlights.map((item) => (
                  <span key={item} className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-8 space-y-4">
              {OWNER_BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
                    <Icon name={benefit.icon} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-900">{benefit.title}</h3>
                    <p className="text-sm text-slate-500">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleBuildWithUsReveal} className="btn-primary mt-8 px-7 py-4 text-base">
              <span className="inline-flex items-center gap-2">
                Build With Us
                <Icon name="arrow-right" />
              </span>
            </button>
          </div>

          <div className="relative">
            <img
              src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=property%20owner%20reviewing%20luxury%20staycation%20development%20plans%20outdoors%2C%20modern%20hospitality%20project%2C%20tropical%20landscape%2C%20photorealistic&image_size=portrait_4_3"
              alt="Property owner dashboard preview"
              width="600"
              height="700"
              loading="lazy"
              className="w-full rounded-3xl object-cover shadow-xl"
            />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-brand-900/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 shadow-lg backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-bold text-brand-900">Starter Build Direction</span>
                <span className="text-sm font-semibold text-brand-600">Proposal</span>
              </div>
              <div className="mb-2 text-3xl font-bold text-brand-700">RM80,000</div>
              <div className="flex items-center gap-1 text-sm text-brand-500">
                <Icon name="trend" className="text-xs" />
                <span>well worth the experience</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {proposalSectionsOpen ? (
        <>
          <section id="proposal-projects" className="bg-white py-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <div className="mb-12 text-center">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Proposal References</p>
                <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Previous Projects</h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
                  These are the seven proposal projects currently shaping the Hora visual direction and owner conversation.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {PREVIOUS_PROJECTS.map((project) => (
                  <PreviousProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </section>

          <section className="bg-ice-50 py-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <div className="mb-12 text-center">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Design Direction</p>
                <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Concept Options</h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
                  The proposal highlights three strong staycation directions that owners can choose from during planning.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                {CONCEPT_OPTIONS.map((concept) => (
                  <ConceptCard key={concept.id} concept={concept} />
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white py-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Owner Persuasion</p>
                  <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Add-On ++</h2>
                  <p className="mt-4 max-w-3xl text-lg text-slate-600">
                    The proposal’s add-on catalogue makes the owner journey more persuasive by showing how Hora can elevate the final experience.
                  </p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {ADD_ON_OPTIONS.map((item) => (
                  <AddOnCard key={item.id} item={item} />
                ))}
              </div>
              <div className="mt-12 text-center">
                <button type="button" onClick={() => onShowPage('owner-signup')} className="btn-primary px-7 py-4 text-base">
                  <span className="inline-flex items-center gap-2">
                    Register as Owner
                    <Icon name="arrow-right" />
                  </span>
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <section id="book" className="relative overflow-hidden bg-brand-950 py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-10 h-64 w-64 rounded-full bg-accent-400 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-48 w-48 rounded-full bg-brand-400 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <img src="/hora-logo.svg" alt="" aria-hidden="true" className="h-4 w-4 rounded-full object-cover" />
              <span className="text-sm font-semibold text-white/80">Featured Staycations</span>
            </div>
            <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Book a Staycation</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
              Guests can now browse all seven staycations here, and the temporary visuals can be replaced once the real project photos are ready.
            </p>
          </div>

          <div className="mb-12 grid gap-8 md:grid-cols-3">
            {featuredProperties.map((property) => (
              <article key={property.id} className="stay-card overflow-hidden rounded-2xl bg-white shadow-lg">
                <div className="prop-img-wrap" style={{ aspectRatio: '4 / 3' }}>
                  <img
                    src={property.image}
                    alt={property.name}
                    width="500"
                    height="375"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-brand-700 backdrop-blur-sm">
                    <span className="inline-flex items-center gap-1">
                      <Icon name={property.badgeIcon} className="text-orange-500" />
                      {property.badge}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center gap-1 text-sm text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Icon key={index} name="star" />
                    ))}
                    <span className="ml-1 text-slate-400">({property.reviewCount})</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-brand-950">{property.name}</h3>
                  <p className="mb-3 mt-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="location" />
                      {property.location}
                    </span>
                  </p>
                  <p className="mb-3 text-sm leading-relaxed text-slate-500">{property.mood}</p>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{property.statusNote}</div>
                  <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{property.amenities[0]}</span>
                    <span>{property.amenities[1]}</span>
                    <span>{property.amenities[2]}</span>
                  </div>
                  {property.schedule ? (
                    <div className="mb-4 rounded-2xl bg-ice-50 px-3 py-2 text-xs font-medium text-slate-500">
                      {property.schedule}
                    </div>
                  ) : null}
                  {property.videoUrl ? (
                    <a href={property.videoUrl} target="_blank" rel="noreferrer" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800">
                      <Icon name="arrow-right" />
                      Watch video walkthrough
                    </a>
                  ) : null}
                  <div className="mb-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                    {property.bestFor}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-brand-700">{formatCurrency(property.price)}</span>
                      <span className="text-sm text-slate-400">/night</span>
                    </div>
                    <button type="button" onClick={() => onShowPage('booking')} className="btn-primary px-4 py-2 text-sm">
                      <span>Book Now</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center">
            <button type="button" onClick={() => onShowPage('booking')} className="btn-accent px-7 py-4 text-base">
              View All Properties
            </button>
          </div>
        </div>
      </section>

      <section id="evaluate" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 md:grid-cols-2 md:px-8">
          <div className="order-2 md:order-1">
            <div className="relative">
              <img
                src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=happy%20guests%20reviewing%20a%20premium%20staycation%20retreat%20with%20warm%20hospitality%20ambience%2C%20modern%20tiny-house%20escape%2C%20photorealistic&image_size=landscape_4_3"
                alt="Guest review moment"
                width="600"
                height="500"
                loading="lazy"
                className="w-full rounded-3xl object-cover shadow-xl"
              />
              {TESTIMONIALS.map((item, index) => (
                <div
                  key={item.author}
                  className={`animate-float absolute max-w-[220px] rounded-2xl bg-white p-4 shadow-xl ${index === 0 ? '-right-4 -top-4' : '-bottom-4 -left-4 animate-float-slow'}`}
                >
                  <div className="mb-1 flex items-center gap-1 text-sm text-amber-400">
                    {Array.from({ length: Math.ceil(item.rating) }).map((_, starIndex) => (
                      <Icon key={starIndex} name="star" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600">“{item.quote}”</p>
                  <p className="mt-1 text-xs text-slate-400">— {item.author}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2">
              <Icon name="pen" className="text-sm text-brand-600" />
              <span className="text-sm font-semibold text-brand-700">Evaluate With Us</span>
            </div>
            <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Evaluate Your Staycation With Us</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              If you have your first staycation and want to register it with Hora, this route collects the address, email, unit count, and exclusivity confirmation before management reviews it.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-brand-50 p-5 text-center">
                <div className="text-3xl font-bold text-brand-700">4</div>
                <div className="text-sm text-slate-500">Units Max</div>
              </div>
              <div className="rounded-2xl bg-accent-300/10 p-5 text-center">
                <div className="text-3xl font-bold text-accent-500">1</div>
                <div className="text-sm text-slate-500">Exclusive Partner</div>
              </div>
            </div>
            <button type="button" onClick={() => onShowPage('evaluate')} className="btn-primary mt-8 px-7 py-4 text-base">
              <span className="inline-flex items-center gap-2">
                Evaluate With Us
                <Icon name="pen" />
              </span>
            </button>
          </div>
        </div>
      </section>

      <section id="management" className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 py-20">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-accent-400 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center md:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <Icon name="lock" className="text-sm text-accent-400" />
            <span className="text-sm font-semibold text-white/70">Admin Access</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-white md:text-5xl">Management Portal</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
            Management is responsible for arranging every place shown to clients by uploading the photos, videos, facilities, and schedules needed for each listing.
          </p>
          <button type="button" onClick={() => onShowPage('management-login')} className="btn-accent mt-8 px-7 py-4 text-base">
            Login to Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}
