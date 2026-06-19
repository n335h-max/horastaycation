import { Icon } from './Icon';

export function CookieConsentBanner({ open, preferences, onAcceptAll, onEssentialOnly, onManagePrivacy }) {
  if (!open) {
    return null;
  }

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-100 bg-white/95 px-4 py-4 shadow-[0_-18px_45px_rgba(15,23,42,0.14)] backdrop-blur-md md:px-8"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            <Icon name="lock" className="text-sm" />
            Cookie Preferences
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[0.95rem]">
            Hora Staycation uses essential cookies and local storage to keep bookings secure, remember your session,
            and protect account access. Optional analytics and personalization stay off unless you explicitly allow
            them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
            <span className="rounded-full bg-ice-100 px-3 py-1">Essential: always on</span>
            <span className="rounded-full bg-ice-100 px-3 py-1">
              Analytics: {preferences?.analytics ? 'allowed' : 'off'}
            </span>
            <span className="rounded-full bg-ice-100 px-3 py-1">
              Personalization: {preferences?.personalization ? 'allowed' : 'off'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <button type="button" onClick={onManagePrivacy} className="btn-outline px-5 py-3 text-sm">
            Privacy Policy
          </button>
          <button type="button" onClick={onEssentialOnly} className="rounded-xl border border-ice-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700">
            Essential Only
          </button>
          <button type="button" onClick={onAcceptAll} className="btn-primary px-5 py-3 text-sm">
            <span>Accept All</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
