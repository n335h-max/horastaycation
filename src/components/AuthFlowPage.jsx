import { APP_PATHS } from '../lib/routes';
import { Icon } from './Icon';

const ROLE_CARDS = [
  {
    role: 'owner',
    eyebrow: 'Owner / Host',
    title: 'Manage your own property pipeline',
    description:
      'Use the owner role to submit refurbish requests, track onboarding, and access the owner workspace for your listings.',
    destination: 'Refurbish form and owner dashboard',
  },
  {
    role: 'client',
    eyebrow: 'Client / Guest',
    title: 'Browse listings and book stays',
    description:
      'Use the client role to explore published staycations, complete bookings, and keep your guest flow separate from host work.',
    destination: 'Listings and booking flow',
  },
  {
    role: 'management',
    eyebrow: 'Management',
    title: 'Operate listings and approve hosts',
    description:
      'Use the management role for full control over listings, uploads, booking operations, and host approvals.',
    destination: 'Management dashboard',
  },
];

function getActionCopy({ authUser, authRole, availableRoles, role }) {
  if (!authUser) {
    return `Continue with Google as ${labelForRole(role)}`;
  }

  if (authRole === role) {
    return `Open ${labelForRole(role)} workspace`;
  }

  if (availableRoles.includes(role)) {
    return `Switch to ${labelForRole(role)}`;
  }

  return `Add ${labelForRole(role)} role`;
}

function labelForRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getDestinationPreview(role, nextPath) {
  if (nextPath) {
    return nextPath;
  }

  switch (role) {
    case 'owner':
      return APP_PATHS.ownerSignup;
    case 'management':
      return APP_PATHS.dashboard;
    default:
      return APP_PATHS.booking;
  }
}

export function AuthFlowPage({
  authUser,
  authRole,
  availableRoles = ['client'],
  isSubmitting,
  isAuthLoading,
  requestedRole = 'client',
  nextPath = '',
  onSelectRole,
  onShowPage,
  onSignOut,
}) {
  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => onShowPage('landing')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800"
        >
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>

        <div className="rounded-[2rem] border border-brand-100 bg-white p-8 shadow-lg md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                <Icon name="lock" />
                Unified Sign-In
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold text-brand-950 md:text-5xl">
                One Google login, role-based workspaces
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Pick the role you want right now, then Hora sends you straight to the correct workspace and remembers
                your active role for the next visit.
              </p>
            </div>
            <div className="rounded-3xl bg-ice-50 p-5 text-sm text-slate-600 md:max-w-sm">
              <div className="font-semibold text-brand-900">How it works</div>
              <div className="mt-3 space-y-3">
                <div>1. Sign in once with Google.</div>
                <div>2. Choose Owner, Client, or Management.</div>
                <div>3. Switch roles later without signing out.</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-3xl border border-ice-200 bg-ice-50 px-5 py-4">
            <span className="text-sm font-semibold text-brand-900">Current session</span>
            {authUser?.email ? (
              <>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600">
                  {authUser.email}
                </span>
                <span className="rounded-full bg-brand-900 px-3 py-1 text-sm font-medium text-white">
                  Active role: {labelForRole(authRole)}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600">
                  Roles: {availableRoles.map(labelForRole).join(' / ')}
                </span>
                {onSignOut ? (
                  <button type="button" onClick={onSignOut} className="btn-outline px-4 py-2 text-sm">
                    Sign Out
                  </button>
                ) : null}
              </>
            ) : (
              <span className="text-sm text-slate-500">Not signed in yet.</span>
            )}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {ROLE_CARDS.map((card) => {
              const isActive = authRole === card.role;
              const isSelected = requestedRole === card.role;
              const hasRole = availableRoles.includes(card.role);

              return (
                <article
                  key={card.role}
                  className={`rounded-[2rem] border p-7 shadow-sm transition-colors ${
                    isActive
                      ? 'border-brand-900 bg-brand-950 text-white'
                      : isSelected
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-ice-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                        isActive ? 'bg-white/10 text-white' : 'bg-white text-brand-700'
                      }`}
                    >
                      <Icon
                        name={card.role === 'management' ? 'shield' : card.role === 'owner' ? 'home' : 'calendar'}
                      />
                      {card.eyebrow}
                    </div>
                    {hasRole ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive ? 'bg-emerald-400/20 text-emerald-100' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        Enabled
                      </span>
                    ) : null}
                  </div>
                  <h2 className={`mt-5 font-display text-2xl font-bold ${isActive ? 'text-white' : 'text-brand-950'}`}>
                    {card.title}
                  </h2>
                  <p className={`mt-4 text-sm leading-relaxed ${isActive ? 'text-white/75' : 'text-slate-600'}`}>
                    {card.description}
                  </p>
                  <div
                    className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
                      isActive ? 'bg-white/10 text-white/80' : 'bg-ice-50 text-slate-600'
                    }`}
                  >
                    Redirect after login: {getDestinationPreview(card.role, nextPath)}
                  </div>
                  <div
                    className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                      isActive ? 'bg-white/10 text-white/80' : 'bg-ice-50 text-slate-600'
                    }`}
                  >
                    Scope: {card.destination}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectRole(card.role)}
                    disabled={isSubmitting || isAuthLoading}
                    className={`mt-8 w-full rounded-2xl px-5 py-4 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isActive
                        ? 'bg-white text-brand-950 hover:bg-white/90'
                        : 'bg-brand-900 text-white hover:bg-brand-800'
                    }`}
                  >
                    {isSubmitting || isAuthLoading
                      ? 'Opening Google Sign-In...'
                      : getActionCopy({ authUser, authRole, availableRoles, role: card.role })}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
