import { HORA_VALUES } from '../../data/siteData';

export function IntroSection() {
  return (
    <section id="intro" className="relative overflow-hidden bg-white py-24">
      <div className="dot-pattern absolute inset-0 opacity-50" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-16 px-4 md:grid-cols-2 md:px-8">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">The Meaning of Hora</p>
            <h2 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">
              Time, rest, and beautiful moments
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-slate-600">
            <strong className="text-brand-700">Hora</strong> comes from the Greek word for <em>time</em> or{' '}
            <em>season</em>. In the proposal, it represents the belief that every moment is a chance to rest, gather,
            and create meaningful memories.
          </p>
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <picture>
              <source type="image/webp" srcSet="/staycations/hero-interior.webp" />
              <source type="image/jpeg" srcSet="/staycations/hero-interior.jpg" />
              <img
                src="/staycations/hero-interior.jpg"
                alt="Stylish staycation house"
                width="600"
                height="500"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </picture>
          </div>
        </div>

        <div>
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">What HORA stands for</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {HORA_VALUES.map((item) => (
              <article key={item.letter} className="rounded-3xl bg-brand-950 p-6 text-white shadow-xl">
                <div
                  className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.cardClass} font-display text-2xl font-bold`}
                >
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
  );
}
