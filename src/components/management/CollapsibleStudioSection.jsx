import { Icon } from '../Icon';

export function CollapsibleStudioSection({ id, eyebrow, title, open, onToggle, children }) {
  return (
    <section id={id} className="rounded-[1.8rem] border border-ice-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">{eyebrow}</div>
          <h2 className="mt-2 font-display text-2xl font-bold text-brand-950">{title}</h2>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ice-50 text-brand-600 shadow-sm">
          <Icon name={open ? 'eye-off' : 'eye'} />
        </span>
      </button>
      {open ? (
        <div id={`${id}-panel`} className="mt-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}
