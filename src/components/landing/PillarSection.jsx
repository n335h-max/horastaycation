import { FEATURE_PILLARS } from '../../data/siteData';
import { Icon } from '../Icon';

export function PillarSection() {
  const [first, ...rest] = FEATURE_PILLARS;

  return (
    <section className="bg-ice-50 py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Hora Staycation</p>
          <h2 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">Your Staycation Partner</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Featured pillar — spans 2 columns on desktop */}
          <article className="group relative overflow-hidden rounded-3xl bg-brand-950 p-8 text-white shadow-xl md:col-span-2">
            <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-accent-400/15 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Icon name={first.icon} className="text-3xl text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold md:text-3xl">{first.title}</h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">{first.description}</p>
            </div>
          </article>
          {/* Remaining pillars */}
          {rest.map((pillar) => (
            <article
              key={pillar.title}
              className="group rounded-3xl border border-ice-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 transition-colors duration-300 group-hover:bg-brand-100">
                <Icon name={pillar.icon} className="text-2xl text-brand-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-brand-900">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{pillar.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
