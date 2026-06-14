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

export function SiteHeader({ activePage, mobileOpen, onToggleMobile, onShowPage, onScrollToSection }) {
  const isLanding = activePage === 'landing';
  const navTextClass = isLanding ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-brand-600';
  const brandTextClass = isLanding ? 'text-white group-hover:text-white/80' : 'text-brand-950 group-hover:text-brand-600';
  const menuButtonClass = isLanding ? 'text-white' : 'text-brand-800';
  const managementButtonClass = isLanding
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
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-400 text-white">
            <Icon name="umbrella" className="text-lg" />
          </span>
          <span className={`font-display text-xl font-bold transition-colors ${brandTextClass}`}>
            HORA<span className="text-accent-500"> Staycation</span>
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
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
          <button type="button" onClick={() => onShowPage('management-login')} className={managementButtonClass}>
            Management Login
          </button>
        </nav>

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
                onShowPage('management-login');
                onToggleMobile(false);
              }}
              className="btn-primary w-full py-3 text-sm"
            >
              <span>Management Login</span>
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter({ onShowPage }) {
  return (
    <footer className="border-t border-white/10 bg-brand-950 py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-400 text-white">
                <Icon name="umbrella" className="text-sm" />
              </span>
              <span className="font-display text-lg font-bold text-white">HORA Staycation</span>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              Your staycation partner, curating unique stays and authentic experiences for the modern traveler.
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
              <a href="#" className="block transition-colors hover:text-accent-400">
                About Us
              </a>
              <a href="#" className="block transition-colors hover:text-accent-400">
                Careers
              </a>
              <a href="#" className="block transition-colors hover:text-accent-400">
                Press
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
