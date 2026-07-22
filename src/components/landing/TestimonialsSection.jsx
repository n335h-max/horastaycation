import { Icon } from '../Icon';

function TestimonialCard({ testimonial }) {
  return (
    <article className="w-[22rem] shrink-0 rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Icon
            key={i}
            name="star"
            className={`text-sm ${i < testimonial.rating ? 'text-amber-400' : 'text-ice-200'}`}
          />
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold uppercase text-white shadow-sm">
          {testimonial.name?.trim()?.charAt(0) || '?'}
        </div>
        <div>
          <div className="text-sm font-semibold text-brand-950">{testimonial.name}</div>
          <div className="text-xs text-slate-400">{testimonial.role}</div>
        </div>
      </div>
    </article>
  );
}

function MarqueeRow({ items, direction = 'left', speed = '40s' }) {
  const duplicated = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ice-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ice-50 to-transparent" />
      <div
        className={`flex gap-4 py-2 will-change-transform ${
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'
        }`}
        style={{ animationDuration: speed }}
      >
        {duplicated.map((t, i) => (
          <TestimonialCard key={`${direction}-${i}`} testimonial={t} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection({ testimonials = [] }) {
  if (!testimonials.length) return null;

  const half = Math.ceil(testimonials.length / 2);
  const row1 = testimonials.slice(0, half);
  const row2 = testimonials.slice(half).length ? testimonials.slice(half) : [...testimonials].reverse();

  return (
    <section className="overflow-hidden bg-ice-50 py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Testimonials</p>
          <h2 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">What People Say</h2>
        </div>
      </div>
      <div className="space-y-4">
        <MarqueeRow items={row1} direction="left" speed="38s" />
        <MarqueeRow items={row2} direction="right" speed="44s" />
      </div>
    </section>
  );
}
