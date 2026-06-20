import { useState } from 'react';
import {
  FEATURED_PROPERTIES,
  OWNER_BENEFITS,
  STARTING_PACKAGE,
  TESTIMONIALS,
} from '../data/siteData';
import { Icon } from './Icon';
import { HeroSection } from './landing/HeroSection';
import { IntroSection } from './landing/IntroSection';
import { PillarSection } from './landing/PillarSection';
import { GuestToolsSection } from './landing/GuestToolsSection';
import { ConceptsSection } from './landing/ConceptsSection';
import { TestimonialsSection } from './landing/TestimonialsSection';

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
  const [selectedFeaturedLocation, setSelectedFeaturedLocation] = useState('All locations');
  const whatsappBaseUrl = 'https://wa.me/601110629990?text=';
  const featuredLocationOptions = ['All locations', ...new Set(featuredProperties.map((property) => property.location))];
  const visibleFeaturedProperties = selectedFeaturedLocation === 'All locations'
    ? featuredProperties
    : featuredProperties.filter((property) => property.location === selectedFeaturedLocation);

  function handleBuildWithUsReveal() {
    window.setTimeout(() => {
      window.document.getElementById('proposal-projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  return (
    <div className="page-shell">
      <HeroSection
        onShowPage={onShowPage}
        featuredProperties={featuredProperties}
        formatCompactNumber={formatCompactNumber}
      />

      <IntroSection />

      <PillarSection />

      <GuestToolsSection
        featuredProperties={featuredProperties}
        analyticsSummary={analyticsSummary}
        onShowPage={onShowPage}
        onOpenSupport={onOpenSupport}
      />

      <ConceptsSection
        onShowPage={onShowPage}
        onScrollToSection={onScrollToSection}
      />

      <TestimonialsSection
        ownerBenefits={OWNER_BENEFITS}
        testimonials={TESTIMONIALS}
      />

      {/* Starting Package / CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 text-center md:px-8">
          <div className="mx-auto max-w-3xl rounded-[3rem] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-8 py-16 text-white shadow-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-400">Start Building</p>
            <h2 className="font-display text-4xl font-bold md:text-5xl">{STARTING_PACKAGE.title}</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{STARTING_PACKAGE.summary}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              {STARTING_PACKAGE.includes.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold">
                  <span className="inline-flex h-2 w-2 rounded-full bg-accent-400" />
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-10">
              <button type="button" onClick={() => onShowPage('owner-signup')} className="btn-accent px-8 py-4 text-base">
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
    </div>
  );
}