import { Icon } from '../Icon';

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

export function GuestToolsSection({ featuredProperties, analyticsSummary, onShowPage, onOpenSupport }) {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Guest Tools</p>
          <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Search, save, and book faster</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Hora now supports real search, wishlist saving, chat support, mobile install, and live business reporting in
            the operations dashboard.
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
              Guests can filter properties on the booking page by keyword, location, availability window, and guest
              count before choosing a staycation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {featuredProperties.length > 0 ? (
                featuredProperties.slice(0, 3).map((property) => (
                  <span
                    key={property.id}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85"
                  >
                    {property.location}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/60">
                  New locations coming soon
                </span>
              )}
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
              <button
                type="button"
                onClick={onOpenSupport}
                className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-base font-semibold text-white"
              >
                Ask Chat Support
              </button>
            </div>
          </article>

          <div className="grid gap-6">
            <LiveToolCard
              title="Wishlist"
              description="Tap the heart icon on any stay to save it. Your wishlist syncs with your account and makes returning easy."
              icon="heart"
              accentClass="bg-rose-50 text-rose-600"
              action={
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">
                  <Icon name="heart" />
                  {analyticsSummary?.uniqueWishlistedProperties ?? 0} saved
                </span>
              }
            />
            <LiveToolCard
              title="PWA Ready"
              description="Hora can be installed as a Progressive Web App on your home screen for quick access on mobile and desktop."
              icon="download"
              action={
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                  {analyticsSummary?.installPrompts ?? 0} install attempts
                </span>
              }
            />
            <LiveToolCard
              title="Live Dashboard"
              description="Hora now tracks bookings, revenue, owner requests, and review submissions in the management dashboard behind the sign-in."
              icon="chart"
              action={
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600">
                  {analyticsSummary?.pageViews ?? 0} page views tracked
                </span>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
