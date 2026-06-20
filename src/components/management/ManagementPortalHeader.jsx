import { Icon } from '../Icon';

export function ManagementPortalHeader({
  title, eyebrow, description, authUser, onSignOut, onShowPage, primaryAction, secondaryAction,
}) {
  return (
    <div className="rounded-[2rem] border border-brand-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-brand-950 md:text-5xl">{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {authUser?.email ? (
            <div className="inline-flex items-center rounded-full border border-ice-200 bg-ice-50 px-4 py-2 text-sm font-medium text-slate-600">
              {authUser.email}
            </div>
          ) : null}
          {secondaryAction ? (
            <button type="button" onClick={secondaryAction.onClick} className="btn-outline px-5 py-3 text-sm">
              {secondaryAction.label}
            </button>
          ) : null}
          {primaryAction ? (
            <button type="button" onClick={primaryAction.onClick} className="btn-primary px-5 py-3 text-sm">
              <span className="inline-flex items-center gap-2">
                {primaryAction.label}
                <Icon name="arrow-right" />
              </span>
            </button>
          ) : null}
          <button type="button" onClick={() => onShowPage('landing')} className="btn-outline px-5 py-3 text-sm">
            Return to Site
          </button>
          <button type="button" onClick={onSignOut} className="btn-outline px-5 py-3 text-sm">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}