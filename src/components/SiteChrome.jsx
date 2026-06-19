import { NAV_ITEMS, SOCIAL_LINKS } from '../data/siteData';
import { Icon } from './Icon';

export function ToastStack({ toasts }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <Icon name={toast.icon} className="text-lg" />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function getAuthBadgeCopy(authUser, authRole) {
  if (!authUser) {
    return null;
  }

  const displayName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email ||
    'Signed In User';
  const subtitle = authUser.email || authRole || 'Authenticated User';
  const initialSource = authUser.email || displayName;
  const initial = String(initialSource || 'H').trim().charAt(0).toUpperCase() || 'H';

  return {
    displayName,
    subtitle,
    initial,
    roleLabel: String(authRole || 'client').replace(/^\w/, (match) => match.toUpperCase()),
    photoUrl:
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      authUser.identities?.find((identity) => identity.provider === 'google')?.identity_data?.avatar_url ||
      '',
  };
}

function UserAvatarIndicator({ authUser, authRole, isLanding = false }) {
  const badge = getAuthBadgeCopy(authUser, authRole);

  if (!badge) {
    return null;
  }

  const containerClass = isLanding
    ? 'border-white/20 bg-white/10'
    : 'border-brand-100 bg-white shadow-sm';
  const avatarFallbackClass = isLanding ? 'bg-white/15 text-white' : 'bg-brand-600 text-white';
  const statusDotClass = isLanding ? 'bg-emerald-300 ring-brand-950' : 'bg-emerald-500 ring-white';
  const title = `${badge.displayName} · ${badge.roleLabel}${badge.subtitle ? ` · ${badge.subtitle}` : ''}`;

  return (
    <div
      className={`relative flex h-11 w-11 items-center justify-center rounded-full border p-1 ${containerClass}`}
      title={title}
      aria-label={title}
    >
      {badge.photoUrl ? (
        <img src={badge.photoUrl} alt={badge.displayName} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className={`flex h-full w-full items-center justify-center rounded-full text-sm font-bold ${avatarFallbackClass}`}>
          {badge.initial}
        </div>
      )}
      <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ${statusDotClass}`} />
    </div>
  );
}

export function SiteHeader({
  activePage,
  mobileOpen,
  onToggleMobile,
  onShowPage,
  onScrollToSection,
  authUser,
  authRole,
  availableRoles = ['client'],
  onRoleSwitch,
  onOpenAuth,
  onSignOut,
}) {
  const isLanding = activePage === 'landing';
  const navTextClass = isLanding ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-brand-600';
  const brandTextClass = isLanding ? 'text-white group-hover:text-white/80' : 'text-brand-950 group-hover:text-brand-600';
  const menuButtonClass = isLanding ? 'text-white' : 'text-brand-800';
  const authButtonClass = isLanding
    ? 'rounded-xl border border-white/25 bg-white/10 px-5 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20'
    : 'btn-outline px-5 py-2 text-sm';
  const activeLinkClass = isLanding
    ? 'bg-white/14 text-white shadow-sm'
    : 'bg-brand-50 text-brand-700 shadow-sm';

  function itemIsActive(item) {
    if (item.page) {
      return activePage === item.page;
    }

    return isLanding && item.sectionId === 'intro';
  }

  return (
    <header
      className={`navbar-glass fixed inset-x-0 top-0 z-40 px-4 py-4 md:px-8 ${
        isLanding ? 'landing' : 'scrolled'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button
          type="button"
          onClick={() => onShowPage('landing')}
          className="group flex items-center gap-3"
          aria-label="Go to the home page"
        >
          <img src="/hora-logo.svg" alt="Hora Staycation logo" className="h-10 w-10 rounded-xl object-cover" />
          <span className={`font-display text-xl font-bold transition-colors ${brandTextClass}`}>
            HORA<span className="text-accent-500"> Staycation</span>
          </span>
        </button>

        <div className="hidden items-center gap-4 md:flex">
          <nav className="flex items-center gap-8" aria-label="Primary">
            {NAV_ITEMS.map((item) =>
              item.sectionId ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onScrollToSection(item.sectionId)}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${navTextClass} ${
                    itemIsActive(item) ? activeLinkClass : ''
                  }`}
                >
                  {item.label}
                </button>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onShowPage(item.page)}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${navTextClass} ${
                    itemIsActive(item) ? activeLinkClass : ''
                  }`}
                >
                  {item.label}
                </button>
              ),
            )}
            <button type="button" onClick={() => onShowPage('booking')} className="btn-accent px-5 py-2 text-sm">
              Book Now
            </button>
            {authUser ? (
              <>
                {availableRoles.length > 1 ? (
                  <label className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isLanding ? 'bg-white/10 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
                    <span>Role</span>
                    <select
                      value={authRole}
                      onChange={(event) => onRoleSwitch?.(event.target.value)}
                      className={`bg-transparent text-sm outline-none ${isLanding ? 'text-white' : 'text-slate-700'}`}
                    >
                      {availableRoles.map((role) => (
                        <option key={role} value={role} className="text-slate-900">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button type="button" onClick={onSignOut} className={authButtonClass}>
                  Sign Out
                </button>
              </>
            ) : (
              <button type="button" onClick={onOpenAuth} className={authButtonClass}>
                Sign In
              </button>
            )}
          </nav>
          <UserAvatarIndicator authUser={authUser} authRole={authRole} isLanding={isLanding} />
        </div>

        <button
          type="button"
          onClick={onToggleMobile}
          className={`rounded-xl p-2 text-2xl md:hidden ${menuButtonClass}`}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <Icon name="bars" />
        </button>
      </div>

      {mobileOpen ? (
        <div id="mobile-menu" className="mx-auto mt-4 max-w-7xl rounded-3xl bg-white p-6 shadow-xl md:hidden">
          <div className="space-y-4">
            {authUser ? (
              <div className="flex items-center gap-3 rounded-2xl border border-ice-200 bg-ice-50 px-4 py-3">
                <UserAvatarIndicator authUser={authUser} authRole={authRole} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-brand-950">
                    {authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    Signed in
                  </div>
                </div>
              </div>
            ) : null}
            {NAV_ITEMS.map((item) =>
              item.sectionId ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onScrollToSection(item.sectionId, true)}
                  className="block w-full text-left font-medium text-slate-700"
                >
                  {item.label}
                </button>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onShowPage(item.page);
                    onToggleMobile(false);
                  }}
                  className="block w-full text-left font-medium text-slate-700"
                >
                  {item.label}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => {
                onShowPage('owner-signup');
                onToggleMobile(false);
              }}
              className="btn-accent w-full py-3 text-sm"
            >
              Register Now
            </button>
            <button
              type="button"
              onClick={() => {
                if (authUser) {
                  onSignOut?.();
                } else {
                  onOpenAuth?.();
                }
                onToggleMobile(false);
              }}
              className="btn-primary w-full py-3 text-sm"
            >
              <span>{authUser ? 'Sign Out' : 'Sign In'}</span>
            </button>
            {authUser && availableRoles.length > 1 ? (
              <div className="rounded-2xl border border-ice-200 bg-ice-50 px-4 py-3">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400" htmlFor="mobile-role-switch">
                  Active role
                </label>
                <select
                  id="mobile-role-switch"
                  value={authRole}
                  onChange={(event) => onRoleSwitch?.(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-ice-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter({ onShowPage, onManageCookies }) {
  return (
    <footer className="border-t border-white/10 bg-brand-950 py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <img src="/hora-logo.svg" alt="Hora Staycation logo" className="h-8 w-8 rounded-lg object-cover" />
              <span className="font-display text-lg font-bold text-white">HORA Staycation</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              Your staycation partner, curating unique stays and authentic experiences with GDPR and PDPA-aware
              privacy controls.
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Platform</h3>
            <div className="space-y-2">
              <button type="button" onClick={() => onShowPage('booking')} className="block text-sm text-white/50 transition-colors hover:text-accent-400">
                Book a Stay
              </button>
              <button type="button" onClick={() => onShowPage('owner-signup')} className="block text-sm text-white/50 transition-colors hover:text-accent-400">
                List Property
              </button>
              <button type="button" onClick={() => onShowPage('evaluate')} className="block text-sm text-white/50 transition-colors hover:text-accent-400">
                Write Review
              </button>
            </div>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Company</h3>
            <div className="space-y-2 text-sm text-white/50">
              <button type="button" onClick={() => onShowPage('privacy-policy')} className="block text-left transition-colors hover:text-accent-400">
                Privacy Policy
              </button>
              <button type="button" onClick={onManageCookies} className="block text-left transition-colors hover:text-accent-400">
                Cookie Preferences
              </button>
              <a href="mailto:privacy@horastaycation.com" className="block transition-colors hover:text-accent-400">
                privacy@horastaycation.com
              </a>
            </div>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Connect</h3>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/60 transition-all hover:bg-accent-400 hover:text-brand-900"
                >
                  <Icon name={link.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-sm text-white/30">
          © 2026 Hora Staycation. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
