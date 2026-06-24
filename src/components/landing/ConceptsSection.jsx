import { ADD_ON_OPTIONS, CONCEPT_OPTIONS, PREVIOUS_PROJECTS } from '../../data/siteData';
import { Icon } from '../Icon';

function PreviousProjectCard({ project }) {
  return (
    <article className="rounded-2xl border border-ice-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden">
      <div className="aspect-video overflow-hidden bg-ice-100">
        <img
          src={project.image}
          alt={project.name}
          width="300"
          height="200"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="mb-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
          {project.label}
        </div>
        <h3 className="font-display text-2xl font-bold text-brand-950">{project.name}</h3>
        <p className="mt-1 text-sm font-semibold text-brand-600">{project.location}</p>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">{project.summary}</p>
      </div>
    </article>
  );
}

function ConceptCard({ concept }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
      <div className="aspect-[4/3] overflow-hidden bg-ice-100">
        <img
          src={concept.image}
          alt={concept.title}
          width="420"
          height="320"
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-8">
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
      </div>
    </article>
  );
}

function AddOnCard({ item }) {
  return (
    <article className="rounded-2xl border border-ice-200 bg-white p-6 shadow-sm">
      {item.image ? (
        <div className="mb-5 overflow-hidden rounded-2xl bg-ice-100">
          <img
            src={item.image}
            alt={item.title}
            width="640"
            height="420"
            loading="lazy"
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon name={item.icon} className="text-xl" />
        </div>
        {item.label ? (
          <span className="rounded-full bg-ice-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            {item.label}
          </span>
        ) : null}
      </div>
      <h3 className="font-display text-xl font-bold text-brand-950">{item.title}</h3>
      {item.highlight ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">{item.highlight}</p> : null}
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.summary}</p>
      {item.bullets ? (
        <div className="mt-5 space-y-2">
          {item.bullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-accent-400" />
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      ) : null}
      {item.varieties ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {item.varieties.map((variety) => (
            <div key={variety.title} className="rounded-2xl bg-ice-50 p-4">
              {variety.image ? (
                <div className="mb-4 overflow-hidden rounded-2xl bg-white">
                  <img
                    src={variety.image}
                    alt={variety.title}
                    width="320"
                    height="240"
                    loading="lazy"
                    className="aspect-[4/3] h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">{variety.title}</h4>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
                {variety.points.map((point) => (
                  <p key={point}>{point}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {item.features ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {item.features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-ice-200 bg-ice-50 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">{feature.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function ConceptsSection({ onShowPage, onScrollToSection }) {
  return (
    <>
      {/* Build With Us Section */}
      <section id="proposal" className="relative overflow-hidden bg-brand-950 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.1)_0%,transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center md:px-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-400">For Owners</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-6xl">Build with Hora</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
            Hora works with property owners to build, design, and list curated staycation spaces. Submit your details and let us help bring your space to life.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button type="button" onClick={() => onShowPage('owner-signup')} className="btn-accent px-8 py-4 text-base">
              Submit Your Property
            </button>
            <button type="button" onClick={() => onScrollToSection('proposal-projects')} className="rounded-xl border border-white/20 bg-transparent px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10">
              See Past Projects
            </button>
          </div>
        </div>
      </section>

      {/* Previous Projects */}
      <section id="proposal-projects" className="bg-ice-50 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Past Work</p>
            <h2 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">Previous Property Projects</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PREVIOUS_PROJECTS.map((project) => (
              <PreviousProjectCard key={project.name} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Concept Options */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Design Concepts</p>
            <h2 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">Choose Your Concept</h2>
            <p className="mt-2 text-slate-500">Each concept comes with curated furniture, colour palette, and spatial layout guidance.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {CONCEPT_OPTIONS.map((concept) => (
              <ConceptCard key={concept.title} concept={concept} />
            ))}
          </div>
        </div>
      </section>

      {/* Add-on Options */}
      <section className="bg-ice-50 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Add-ons</p>
            <h2 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">Optional Enhancements</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {ADD_ON_OPTIONS.map((item) => (
              <AddOnCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}