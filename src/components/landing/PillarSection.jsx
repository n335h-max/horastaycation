import { FEATURE_PILLARS } from '../../data/siteData';
import { Icon } from '../Icon';

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

export function PillarSection() {
  return (
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
  );
}
