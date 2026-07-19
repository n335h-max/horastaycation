import { startTransition, useEffect, useId, useRef, useState } from 'react';
import { NAV_ITEMS, SOCIAL_LINKS } from '../data/siteData';
import { Icon } from './Icon';

export function ToastStack({ toasts = [], onDismiss }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <Icon name={toast.icon} className="text-lg" />
          <span className="flex-1">{toast.message}</span>
          {onDismiss ? (
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35 transition-colors"
              aria-label="Dismiss notification"
            >
              <Icon name="close" className="text-xs" />
            </button>
          ) : null}
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
    authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email || 'Signed In User';
  const subtitle = authUser.email || authRole || 'Authenticated User';
  const initialSource = authUser.email || displayName;
  const initial =
    String(initialSource || 'H')
      .trim()
      .charAt(0)
      .toUpperCase() || 'H';

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

function normalizeRoles(availableRoles) {
  if (!Array.isArray(availableRoles)) {
    return ['client'];
  }

  const filteredRoles = availableRoles.filter((role) => typeof role === 'string' && role.trim());
  return filteredRoles.length ? filteredRoles : ['client'];
}

function UserAvatarIndicator({ authUser, authRole, isLanding = false }) {
  const badge = getAuthBadgeCopy(authUser, authRole);

  if (!badge) {
    return null;
  }

  const containerClass = isLanding ? 'border-white/20 bg-white/10' : 'border-brand-100 bg-white shadow-sm';
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
        <img
          src={badge.photoUrl}
          alt={badge.displayName}
          className="h-full w-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full text-sm font-bold ${avatarFallbackClass}`}
        >
          {badge.initial}
        </div>
      )}
      <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ${statusDotClass}`} />
    </div>
  );
}

function UserProfileMenu({
  authUser,
  authRole,
  availableRoles = ['client'],
  onRoleSwitch,
  onGoToDashboard,
  onSignOut,
  isLanding = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownId = useId();
  const badge = getAuthBadgeCopy(authUser, authRole);
  const safeAvailableRoles = normalizeRoles(availableRoles);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    // Use click instead of pointerdown to avoid race conditions with
    // React 18's synthetic click event delegation on the root element.
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!badge) {
    return null;
  }

  const dropdownClass = isLanding
    ? 'border-white/15 bg-brand-950/92 text-white shadow-[0_24px_60px_rgba(2,6,23,0.32)]'
    : 'border-brand-100 bg-white text-brand-950 shadow-[0_20px_50px_rgba(15,23,42,0.14)]';
  const mutedTextClass = isLanding ? 'text-white/60' : 'text-slate-500';
  const roleChipClass = isLanding ? 'bg-white/10 text-white' : 'bg-brand-50 text-brand-700';
  const signOutClass = isLanding
    ? 'bg-white/10 text-white hover:bg-white/16'
    : 'bg-ice-50 text-brand-900 hover:bg-ice-100';
  const goToDashboardClass = isLanding
    ? 'bg-teal-400 text-brand-950 hover:bg-teal-300'
    : 'bg-teal-500 text-white hover:bg-teal-400';
  const canGoToDashboard = String(authRole || '').toLowerCase() !== 'client';

  return (
    <div ref={containerRef} className="relative z-30 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative z-10 cursor-pointer rounded-full pointer-events-auto"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={dropdownId}
        aria-label="Open profile menu"
      >
        <UserAvatarIndicator authUser={authUser} authRole={authRole} isLanding={isLanding} />
      </button>

      {open ? (
        <div
          id={dropdownId}
          className={`pointer-events-auto absolute right-0 mt-3 w-64 rounded-3xl border p-4 ${dropdownClass}`}
        >
          <div className="flex items-center gap-3">
            <UserAvatarIndicator authUser={authUser} authRole={authRole} isLanding={isLanding} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{badge.displayName}</div>
              <div className={`truncate text-xs ${mutedTextClass}`}>{badge.subtitle}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedTextClass}`}>Role</div>
            {safeAvailableRoles.length > 1 ? (
              <select
                value={authRole}
                onChange={(event) => onRoleSwitch?.(event.target.value)}
                className={`mt-2 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none ${isLanding ? 'text-white' : 'text-brand-900'}`}
              >
                {safeAvailableRoles.map((role) => (
                  <option key={role} value={role} className="text-slate-900">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${roleChipClass}`}>
                {badge.roleLabel}
              </div>
            )}
          </div>

          {canGoToDashboard ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onGoToDashboard?.();
              }}
              className={`mt-3 flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${goToDashboardClass}`}
            >
              Go to Dashboard
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut?.();
            }}
            className={`mt-4 flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${signOutClass}`}
          >
            Sign Out
          </button>
        </div>
      ) : null}
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
  onGoToDashboard,
  onOpenAuth,
  onSignOut,
  headerAction,
}) {
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const safeAvailableRoles = normalizeRoles(availableRoles);
  const isLanding = activePage === 'landing';
  const useHomeChrome = true;
  const navTextClass = useHomeChrome ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-brand-600';
  const brandTextClass = useHomeChrome
    ? 'text-white group-hover:text-white/80'
    : 'text-brand-950 group-hover:text-brand-600';
  const menuButtonClass = useHomeChrome ? 'text-white' : 'text-brand-800';
  const authButtonClass = useHomeChrome
    ? 'rounded-xl border border-white/25 bg-white/10 px-5 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/20'
    : 'btn-outline px-5 py-2 text-sm';
  const activeLinkClass = useHomeChrome ? 'bg-white/14 text-white shadow-sm' : 'bg-brand-50 text-brand-700 shadow-sm';
  const mobileMenuContainerClass = useHomeChrome
    ? 'mx-auto mt-4 max-w-7xl rounded-3xl border border-white/10 bg-brand-950/95 p-6 text-white shadow-xl backdrop-blur-md md:hidden'
    : 'mx-auto mt-4 max-w-7xl rounded-3xl bg-white p-6 shadow-xl md:hidden';
  const mobileProfileCardClass = useHomeChrome
    ? 'overflow-hidden rounded-[1.6rem] border border-white/15 bg-white/5'
    : 'overflow-hidden rounded-[1.6rem] border border-ice-200 bg-ice-50';
  const mobileProfileMenuClass = useHomeChrome
    ? 'border-t border-white/10 bg-brand-950/70 px-4 py-4'
    : 'border-t border-ice-200 bg-white px-4 py-4';
  const mobileRolePanelClass = useHomeChrome
    ? 'rounded-2xl border border-white/10 bg-white/5 px-4 py-3'
    : 'rounded-2xl border border-ice-200 bg-ice-50 px-4 py-3';
  const mobileRoleLabelClass = useHomeChrome
    ? 'text-xs font-semibold uppercase tracking-[0.2em] text-white/60'
    : 'text-xs font-semibold uppercase tracking-[0.2em] text-slate-400';
  const mobileRoleSelectClass = useHomeChrome
    ? 'mt-2 w-full rounded-xl border border-white/20 bg-brand-950 px-3 py-2 text-sm text-white'
    : 'mt-2 w-full rounded-xl border border-ice-200 bg-white px-3 py-2 text-sm text-slate-700';
  const mobileRoleChipClass = useHomeChrome
    ? 'mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white'
    : 'mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700';
  const mobileSignOutClass = useHomeChrome
    ? 'mt-3 flex w-full items-center justify-center rounded-2xl bg-white/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/18'
    : 'mt-3 flex w-full items-center justify-center rounded-2xl bg-brand-950 px-4 py-3 text-sm font-semibold text-white';
  const mobileGoToDashboardClass = useHomeChrome
    ? 'mt-3 flex w-full items-center justify-center rounded-2xl bg-teal-400 px-4 py-3 text-sm font-semibold text-brand-950 transition hover:bg-teal-300'
    : 'mt-3 flex w-full items-center justify-center rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-400';
  const canGoToDashboard = String(authRole || '').toLowerCase() !== 'client';
  const mobileNavItemClass = useHomeChrome
    ? 'block w-full rounded-2xl border border-transparent px-3 py-3 text-left font-medium text-white/85 transition hover:border-white/20 hover:bg-white/10 hover:text-white'
    : 'block w-full rounded-2xl border border-transparent px-3 py-3 text-left font-medium text-slate-700 transition hover:border-ice-200 hover:bg-ice-50';

  function itemIsActive(item) {
    if (item.page) {
      return activePage === item.page;
    }

    return isLanding && item.sectionId === 'intro';
  }

  useEffect(() => {
    if (!mobileOpen) {
      startTransition(() => {
        setMobileProfileOpen(false);
      });
    }
  }, [mobileOpen]);

  const mobileBadge = authUser ? getAuthBadgeCopy(authUser, authRole) : null;

  return (
    <header
      className={`navbar-glass fixed inset-x-0 top-0 z-40 px-4 py-4 md:px-8 ${useHomeChrome ? 'landing' : 'scrolled'}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button
          type="button"
          onClick={() => onShowPage('landing')}
          className="group flex items-center gap-3"
          aria-label="Go to the home page"
        >
          <img src="/hora-logo.png" alt="Hora Staycation logo" className="h-10 w-10 rounded-xl object-cover" />
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
                  aria-current={itemIsActive(item) ? 'page' : undefined}
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
                  aria-current={itemIsActive(item) ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ),
            )}
            {headerAction ? (
              <button type="button" onClick={headerAction.onClick} className="btn-primary px-5 py-2 text-sm">
                <span>{headerAction.label}</span>
              </button>
            ) : null}
            <button type="button" onClick={() => onShowPage('booking')} className="btn-accent px-5 py-2 text-sm">
              Book Now
            </button>
            {authUser ? null : (
              <button type="button" onClick={onOpenAuth} className={authButtonClass}>
                Sign In
              </button>
            )}
          </nav>
          {authUser ? (
            <UserProfileMenu
              authUser={authUser}
              authRole={authRole}
              availableRoles={safeAvailableRoles}
              onRoleSwitch={onRoleSwitch}
              onGoToDashboard={onGoToDashboard}
              onSignOut={onSignOut}
              isLanding={useHomeChrome}
            />
          ) : null}
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
        <div id="mobile-menu" className={mobileMenuContainerClass}>
          <div className="space-y-4">
            {authUser ? (
              <div className={mobileProfileCardClass}>
                <button
                  type="button"
                  onClick={() => setMobileProfileOpen((current) => !current)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left"
                  aria-expanded={mobileProfileOpen}
                  aria-controls="mobile-profile-menu"
                >
                  <UserAvatarIndicator authUser={authUser} authRole={authRole} isLanding={useHomeChrome} />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm font-semibold ${useHomeChrome ? 'text-white' : 'text-brand-950'}`}>
                      {mobileBadge?.displayName}
                    </div>
                    <div className={`truncate text-xs ${useHomeChrome ? 'text-white/65' : 'text-slate-500'}`}>
                      Tap to manage account
                    </div>
                  </div>
                  <Icon
                    name="arrow-right"
                    className={`text-sm ${useHomeChrome ? 'text-white/50' : 'text-slate-400'} transition-transform ${mobileProfileOpen ? 'rotate-90' : ''}`}
                  />
                </button>

                {mobileProfileOpen ? (
                  <div id="mobile-profile-menu" className={mobileProfileMenuClass}>
                    <div className={mobileRolePanelClass}>
                      <div className={mobileRoleLabelClass}>Role</div>
                      {safeAvailableRoles.length > 1 ? (
                        <select
                          value={authRole}
                          onChange={(event) => onRoleSwitch?.(event.target.value)}
                          className={mobileRoleSelectClass}
                        >
                          {safeAvailableRoles.map((role) => (
                            <option key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className={mobileRoleChipClass}>
                          {mobileBadge?.roleLabel}
                        </div>
                      )}
                    </div>

                    {canGoToDashboard ? (
                      <button
                        type="button"
                        onClick={() => {
                          onGoToDashboard?.();
                          onToggleMobile(false);
                        }}
                        className={mobileGoToDashboardClass}
                      >
                        Go to Dashboard
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        onSignOut?.();
                        onToggleMobile(false);
                      }}
                      className={mobileSignOutClass}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {NAV_ITEMS.map((item) =>
              item.sectionId ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onScrollToSection(item.sectionId, true)}
                  className={`${mobileNavItemClass} ${itemIsActive(item) ? (useHomeChrome ? 'border-white/20 bg-white/10 text-white font-bold' : 'border-brand-200 bg-brand-50 text-brand-700 font-bold') : ''}`}
                  aria-current={itemIsActive(item) ? 'page' : undefined}
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
                  className={`${mobileNavItemClass} ${itemIsActive(item) ? (useHomeChrome ? 'border-white/20 bg-white/10 text-white font-bold' : 'border-brand-200 bg-brand-50 text-brand-700 font-bold') : ''}`}
                  aria-current={itemIsActive(item) ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ),
            )}
            {headerAction ? (
              <button
                type="button"
                onClick={() => {
                  headerAction.onClick?.();
                  onToggleMobile(false);
                }}
                className="btn-primary w-full py-3 text-sm"
              >
                <span>{headerAction.label}</span>
              </button>
            ) : null}
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
            {!authUser ? (
              <button
                type="button"
                onClick={() => {
                  onOpenAuth?.();
                  onToggleMobile(false);
                }}
                className="btn-primary w-full py-3 text-sm"
              >
                <span>Sign In</span>
              </button>
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
              <img src="/hora-logo.png" alt="Hora Staycation logo" className="h-8 w-8 rounded-lg object-cover" />
              <span className="font-display text-lg font-bold text-white">HORA Staycation</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              Your staycation partner, curating unique stays and authentic experiences with GDPR and PDPA-aware privacy
              controls.
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Platform</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onShowPage('booking')}
                className="block text-sm text-white/50 transition-colors hover:text-accent-400"
              >
                Book a Stay
              </button>
              <button
                type="button"
                onClick={() => onShowPage('owner-signup')}
                className="block text-sm text-white/50 transition-colors hover:text-accent-400"
              >
                List Property
              </button>
              <button
                type="button"
                onClick={() => onShowPage('evaluate')}
                className="block text-sm text-white/50 transition-colors hover:text-accent-400"
              >
                Write Review
              </button>
            </div>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Company</h3>
            <div className="space-y-2 text-sm text-white/50">
              <button
                type="button"
                onClick={() => onShowPage('privacy-policy')}
                className="block text-left transition-colors hover:text-accent-400"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={onManageCookies}
                className="block text-left transition-colors hover:text-accent-400"
              >
                Cookie Preferences
              </button>
               <a href="mailto:n33sh07@gmail.com" className="block transition-colors hover:text-accent-400">
                n33sh07@gmail.com
              </a>
               <a href="mailto:hijaugrouplandscape@gmail.com" className="block transition-colors hover:text-accent-400">
                hijaugrouplandscape@gmail.com
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
