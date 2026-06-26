import { startTransition, useEffect, useMemo, useState } from 'react';
import { BUDGET_OPTIONS, FEATURED_PROPERTIES } from '../data/siteData';
import { deleteMediaFile, saveMediaFile } from '../lib/mediaStorage';
import { validateWithSchema, ownerSchema, reviewSchema } from '../lib/validation';
import { Icon } from './Icon';

const INITIAL_OWNER_FORM = {
  ownerName: '',
  ownerEmail: '',
  ownerAddress: '',
  unitCount: '1',
  budget: '',
};

const INITIAL_REVIEW_FORM = {
  evaluatorName: '',
  evaluatorEmail: '',
  evaluatorAddress: '',
  unitCount: '1',
  exclusivityAgreement: false,
};

const INITIAL_LOGIN_FORM = {
  mgmtEmail: '',
  mgmtPassword: '',
};

function FieldError({ errors, name }) {
  if (!errors?.[name]?.[0]) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-600">{errors[name][0]}</p>;
}

function GoogleEntryCard({ title, description, roleLabel, buttonLabel, onContinue, email, isSubmitting }) {
  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-lg">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
        <Icon name="lock" />
        {roleLabel}
      </div>
      <h2 className="font-display text-3xl font-bold text-brand-950">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-ice-50 p-4">
          <div className="text-sm font-semibold text-brand-900">Unified login</div>
          <p className="mt-1 text-sm text-slate-500">Choose a role once, then keep using the right workspace.</p>
        </div>
        <div className="rounded-2xl bg-ice-50 p-4">
          <div className="text-sm font-semibold text-brand-900">Structured details</div>
          <p className="mt-1 text-sm text-slate-500">Captures only the fields you requested.</p>
        </div>
        <div className="rounded-2xl bg-ice-50 p-4">
          <div className="text-sm font-semibold text-brand-900">Management follow-up</div>
          <p className="mt-1 text-sm text-slate-500">Feeds the next review step for the team.</p>
        </div>
      </div>
      {email ? (
        <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Signed in as {email}
        </div>
      ) : null}
      <button type="button" onClick={onContinue} className="btn-primary mt-8 w-full py-4 text-base">
        <span className="inline-flex items-center gap-2">
          {isSubmitting ? 'Opening Google Sign-In…' : buttonLabel}
          <Icon name="arrow-right" />
        </span>
      </button>
    </div>
  );
}

export function OwnerSignupPage({
  onShowPage,
  onSubmitOwner,
  isSubmitting,
  authUser,
  authRole,
  availableRoles = ['client'],
  isAuthLoading,
  onOpenAuth,
}) {
  const [form, setForm] = useState(INITIAL_OWNER_FORM);
  const [errors, setErrors] = useState({});
  const googleConnected = Boolean(authUser && availableRoles.includes('owner'));

  useEffect(() => {
    if (!authUser?.email) {
      return;
    }

    startTransition(() => {
      setForm((current) => ({
        ...current,
        ownerEmail: current.ownerEmail || authUser.email,
        ownerName: current.ownerName || authUser.user_metadata?.full_name || current.ownerName,
      }));
    });
  }, [authUser]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validateWithSchema(ownerSchema, form);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmitOwner(result.data);
    setForm(INITIAL_OWNER_FORM);
  }

  return (
    <section className="min-h-screen bg-white px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => onShowPage('landing')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800"
        >
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Build / Refurbish With Us</h1>
          <p className="mt-3 text-lg text-slate-600">
            Use unified sign-in to activate the owner role, then submit the refurbish details Hora needs with quick
            mobile-friendly dropdowns.
          </p>
        </div>
        {!googleConnected ? (
          <GoogleEntryCard
            title="Sign in as Owner"
            description="Use the single sign-in flow for owners who want Hora to build or refurbish a location. After role selection, the form below becomes the owner request."
            roleLabel="Owner Role"
            buttonLabel="Continue to Unified Sign-In"
            onContinue={onOpenAuth}
            email={authUser?.email}
            isSubmitting={isSubmitting || isAuthLoading}
          />
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6 rounded-3xl border border-ice-200 bg-ice-50 p-8 shadow-lg"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white">
              <Icon name="lock" />
              Active role: {authRole.charAt(0).toUpperCase() + authRole.slice(1)}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="ownerName">
                  Owner Name
                </label>
                <input
                  id="ownerName"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="name"
                  placeholder="John Doe"
                />
                <FieldError errors={errors} name="ownerName" />
              </div>
              <div>
                <label className="form-label" htmlFor="ownerEmail">
                  Owner Email
                </label>
                <input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  value={form.ownerEmail}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="email"
                  placeholder="owner@example.com"
                />
                <FieldError errors={errors} name="ownerEmail" />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="ownerAddress">
                House Address
              </label>
              <textarea
                id="ownerAddress"
                name="ownerAddress"
                rows="4"
                value={form.ownerAddress}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter the full house address for the staycation location"
              />
              <FieldError errors={errors} name="ownerAddress" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="unitCount">
                  How Many Units Are Needed?
                </label>
                <select
                  id="unitCount"
                  name="unitCount"
                  value={form.unitCount}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="1">1 Unit</option>
                  <option value="2">2 Units</option>
                  <option value="3">3 Units</option>
                  <option value="4">4 Units</option>
                </select>
                <p className="mt-2 text-xs text-slate-400">This owner flow only accepts four units or fewer.</p>
                <FieldError errors={errors} name="unitCount" />
              </div>
              <div>
                <label className="form-label" htmlFor="budget">
                  Budget
                </label>
                <select id="budget" name="budget" value={form.budget} onChange={handleChange} className="form-input">
                  <option value="">Select budget range</option>
                  {BUDGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  Preset ranges reduce typing and keep owner requests consistent.
                </p>
                <FieldError errors={errors} name="budget" />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                {isSubmitting ? 'Submitting Owner Request…' : 'Submit Owner Request'}
                <Icon name="send" />
              </span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export function ReviewPage({ onShowPage, onSubmitReview, isSubmitting }) {
  const [form, setForm] = useState(INITIAL_REVIEW_FORM);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validateWithSchema(reviewSchema, form);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmitReview(result.data);
    setForm(INITIAL_REVIEW_FORM);
  }

  return (
    <section className="min-h-screen bg-white px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => onShowPage('landing')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800"
        >
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Evaluate With Us</h1>
          <p className="mt-3 text-lg text-slate-600">
            Use this form for a first staycation that wants Hora to evaluate and register it before management takes
            over the listing work.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 rounded-3xl border border-ice-200 bg-ice-50 p-8 shadow-lg"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="evaluatorName">
                Name
              </label>
              <input
                id="evaluatorName"
                name="evaluatorName"
                value={form.evaluatorName}
                onChange={handleChange}
                className="form-input"
                autoComplete="name"
                placeholder="Your name"
              />
              <FieldError errors={errors} name="evaluatorName" />
            </div>
            <div>
              <label className="form-label" htmlFor="evaluatorEmail">
                Email
              </label>
              <input
                id="evaluatorEmail"
                name="evaluatorEmail"
                type="email"
                value={form.evaluatorEmail}
                onChange={handleChange}
                className="form-input"
                autoComplete="email"
                placeholder="partner@example.com"
              />
              <FieldError errors={errors} name="evaluatorEmail" />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="evaluatorAddress">
              Address
            </label>
            <textarea
              id="evaluatorAddress"
              name="evaluatorAddress"
              rows="4"
              value={form.evaluatorAddress}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter the address of the staycation you want to register"
            />
            <FieldError errors={errors} name="evaluatorAddress" />
          </div>
          <div>
            <label className="form-label" htmlFor="unitCount">
              Units Provided for Staycation
            </label>
            <select
              id="unitCount"
              name="unitCount"
              value={form.unitCount}
              onChange={handleChange}
              className="form-input"
            >
              <option value="1">1 Unit</option>
              <option value="2">2 Units</option>
              <option value="3">3 Units</option>
              <option value="4">4 Units</option>
            </select>
            <p className="mt-2 text-xs text-slate-400">Evaluation requests must stay within four units or below.</p>
            <FieldError errors={errors} name="unitCount" />
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-ice-200 bg-white px-4 py-4 text-sm text-slate-600">
            <input
              name="exclusivityAgreement"
              type="checkbox"
              checked={form.exclusivityAgreement}
              onChange={handleChange}
              className="mt-1 h-5 w-5 accent-brand-600"
            />
            <span>
              I confirm this staycation is not registered with Airbnb, Booking.com, or any other partnership platform.
            </span>
          </label>
          <FieldError errors={errors} name="exclusivityAgreement" />
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 text-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Submitting Evaluation…' : 'Submit Evaluation Request'}</span>
          </button>
        </form>
      </div>
    </section>
  );
}

export function ManagementLoginPage({
  onShowPage,
  isSubmitting,
  authUser,
  authRole,
  isAuthLoading,
  onGoogleSignIn,
  onSignOut,
}) {
  return (
    <section className="hero-bg min-h-screen px-4 pt-28 md:px-8">
      <div className="mx-auto max-w-md">
        <button
          type="button"
          onClick={() => onShowPage('landing')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
        >
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>
        <div className="glass-panel rounded-3xl border border-white/15 bg-brand-950/70 p-8 text-white shadow-2xl">
          <h1 className="font-display text-4xl font-bold">Management Login</h1>
          <p className="mt-3 text-white/70">
            Sign in to upload staycation photos, videos, facilities, schedules, and every listing detail the client
            booking flow needs.
          </p>
          <div className="mt-8 space-y-5">
            <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/75">
              Management access is granted only to allowed emails after Google sign-in through Supabase Auth.
            </div>
            {authUser?.email ? (
              <div className="rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-200">
                Signed in as {authUser.email}
              </div>
            ) : null}
            {authUser && authRole === 'management' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onShowPage('dashboard')}
                  className="btn-accent w-full py-4 text-base"
                >
                  Open Management Dashboard
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={isSubmitting || isAuthLoading}
                className="btn-accent w-full py-4 text-base disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting || isAuthLoading ? 'Opening Google Sign-In…' : 'Continue With Google as Management'}
              </button>
            )}
            {authUser && authRole !== 'management' ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                This signed-in email is not on the management allowlist yet. Add it to `VITE_MANAGEMENT_EMAILS` before
                using the dashboard.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardStat({ stat, formatCurrency }) {
  const value = stat.currency ? formatCurrency(stat.value) : stat.value;
  const isEmpty = Number(stat.value) === 0;

  return (
    <article className="dash-card rounded-2xl border border-ice-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name={stat.icon} />
        </span>
      </div>
      <div className="number-gradient text-3xl font-black">{value}</div>
      <p className="mt-2 text-sm text-slate-500">{stat.subLabel || 'No updates yet.'}</p>
      {stat.trend ? (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
          <Icon name="trend" />
          {stat.trend} from last month
        </div>
      ) : null}
      {isEmpty && stat.emptyAction ? (
        <button
          type="button"
          onClick={stat.emptyAction.onClick}
          className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-800"
        >
          {stat.emptyAction.label}
        </button>
      ) : null}
    </article>
  );
}

function formatAnalyticsEventLabel(type = 'activity') {
  return String(type)
    .replace(/_/g, ' ')
    .replace(/^\w/, (match) => match.toUpperCase());
}

function getPaymentStatusClasses(status = 'paid') {
  const normalized = String(status || 'paid').toLowerCase();

  if (normalized === 'paid') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'refunded') {
    return 'bg-amber-50 text-amber-700';
  }

  if (normalized === 'failed' || normalized === 'expired') {
    return 'bg-rose-50 text-rose-700';
  }

  if (normalized === 'cancelled') {
    return 'bg-slate-100 text-slate-600';
  }

  return 'bg-ice-50 text-brand-700';
}

function formatStatusCopy(status = 'paid') {
  return String(status || 'paid')
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (match) => match.toUpperCase());
}

export function OwnerDashboardPage({
  ownerApplications,
  bookingTransactions,
  emails,
  onShowPage,
  onSignOut,
  authUser,
  formatCurrency,
}) {
  const latestOwner = ownerApplications[0] ?? null;
  const [isNextStepsExpanded, setIsNextStepsExpanded] = useState(true);
  const [isNextStepsDismissed, setIsNextStepsDismissed] = useState(false);

  const ownerStats = useMemo(
    () => [
      {
        id: 'requests',
        label: 'Owner Requests',
        value: ownerApplications.length,
        icon: 'home',
        subLabel: latestOwner ? `Latest request for ${latestOwner.ownerAddress}` : 'No request submitted yet',
        emptyAction: {
          label: 'Submit your first request ->',
          onClick: () => onShowPage('owner-signup'),
        },
      },
      {
        id: 'booking-alerts',
        label: 'Client Bookings',
        value: bookingTransactions.length,
        icon: 'calendar',
        subLabel: bookingTransactions.length
          ? 'Live guest booking alerts are active'
          : 'Bookings appear once guests complete checkout',
        emptyAction: {
          label: 'Explore booking flow ->',
          onClick: () => onShowPage('booking'),
        },
      },
      {
        id: 'notifications',
        label: 'Notifications',
        value: emails.length,
        icon: 'email',
        subLabel: emails.length ? `${emails.length} unread emails sent` : 'Email alerts appear after activity starts',
        emptyAction: {
          label: 'Start with a request ->',
          onClick: () => onShowPage('owner-signup'),
        },
      },
      {
        id: 'projected-revenue',
        label: 'Projected Revenue',
        value: bookingTransactions.reduce((sum, booking) => sum + (booking.bookingSummary?.total ?? 0), 0),
        icon: 'dollar',
        currency: true,
        subLabel: bookingTransactions.length ? 'Updated from confirmed bookings' : 'Updates after first booking',
        emptyAction: {
          label: 'See booking journey ->',
          onClick: () => onShowPage('booking'),
        },
      },
    ],
    [bookingTransactions, emails.length, latestOwner, onShowPage, ownerApplications.length],
  );

  const requestStages = latestOwner
    ? [
        { title: 'Request Received', detail: `Submitted for ${latestOwner.ownerAddress}`, status: 'done' },
        {
          title: 'Management Review',
          detail: `${latestOwner.unitCount} unit(s) · Budget ${latestOwner.budget}`,
          status: 'active',
        },
        {
          title: 'Listing Preparation',
          detail: 'Photos, facilities, and schedule are prepared after approval.',
          status: 'upcoming',
        },
      ]
    : [];

  const mergedNotifications = useMemo(
    () =>
      emails.map((email, index) => {
        const detail = String(email.detail || '').trim();
        const recipient = detail.replace(/^Sent\s+(to|for)\s+/i, '') || detail || 'Owner mailbox';
        const timestamp =
          email.timestamp || email.sentAt || email.createdAt || (index === 0 ? 'Just now' : `${index} min ago`);

        return {
          id: `${email.title}-${email.detail}-${index}`,
          title: email.title || 'Owner notification',
          recipient,
          timestamp,
        };
      }),
    [emails],
  );

  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Owner Workspace</p>
            <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Owner Dashboard</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Track your build request, bookings, and revenue in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {authUser?.email ? (
              <div className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                {authUser.email}
              </div>
            ) : null}
            <button type="button" onClick={() => onShowPage('owner-signup')} className="btn-primary px-6 py-3 text-sm">
              + New request
            </button>
            <button type="button" onClick={onSignOut} className="btn-outline px-6 py-3 text-sm">
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {ownerStats.map((stat) => (
            <DashboardStat key={stat.id} stat={stat} formatCurrency={formatCurrency} />
          ))}
        </div>

        {!isNextStepsDismissed ? (
          <div className="mt-8 rounded-3xl bg-brand-950 p-6 text-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">What Happens Next</h2>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNextStepsExpanded((current) => !current)}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80"
                >
                  {isNextStepsExpanded ? 'Collapse' : 'Expand'}
                </button>
                {latestOwner ? (
                  <button
                    type="button"
                    onClick={() => setIsNextStepsDismissed(true)}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80"
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>
            </div>
            {isNextStepsExpanded ? (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/8 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">1</div>
                  <div className="mt-2 text-sm text-white/80">
                    Submit your owner request so management can review the build direction.
                  </div>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">2</div>
                  <div className="mt-2 text-sm text-white/80">
                    Hora prepares listing visuals, facilities, and availability once approved.
                  </div>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">3</div>
                  <div className="mt-2 text-sm text-white/80">
                    Booking alerts and projected revenue begin appearing automatically.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 font-display text-2xl font-bold text-brand-950">Request Status</h2>
            {latestOwner ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-brand-950 p-5 text-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">Latest request</div>
                  <div className="mt-3 text-2xl font-bold">{latestOwner.ownerName}</div>
                  <div className="mt-2 text-sm text-white/75">{latestOwner.ownerEmail}</div>
                </div>
                <div className="space-y-3">
                  {requestStages.map((stage) => (
                    <div key={stage.title} className="flex items-start gap-4 rounded-2xl border border-ice-200 p-4">
                      <span
                        className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl ${
                          stage.status === 'done'
                            ? 'bg-emerald-100 text-emerald-600'
                            : stage.status === 'active'
                              ? 'bg-brand-50 text-brand-600'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Icon name={stage.status === 'upcoming' ? 'calendar' : 'shield'} />
                      </span>
                      <div>
                        <div className="font-semibold text-brand-900">{stage.title}</div>
                        <div className="mt-1 text-sm text-slate-500">{stage.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-ice-200 p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ice-50 text-brand-600">
                  <Icon name="home" />
                </span>
                <p className="mt-4 text-base text-slate-600">
                  No request yet. Submit the owner form to get started and this card will show live progress updates.
                </p>
                <button
                  type="button"
                  onClick={() => onShowPage('owner-signup')}
                  className="btn-outline mt-5 px-6 py-3 text-sm"
                >
                  Submit a request
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-brand-950">Client Booking Alerts</h2>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">Owner view</span>
            </div>
            <div className="space-y-4">
              {bookingTransactions.length ? (
                bookingTransactions.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-ice-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-semibold text-brand-900">{booking.bookingSummary.name}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {booking.bookingForm.guestName} · {booking.bookingForm.guestEmail}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          {booking.bookingForm.checkin} to {booking.bookingForm.checkout} · {booking.bookingSummary.nights} night(s)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand-700">{formatCurrency(booking.bookingSummary.total)}</div>
                        <div className="mt-1 text-xs text-slate-400">Client booking alert</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-ice-200 p-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ice-50 text-brand-600">
                    <Icon name="calendar" />
                  </span>
                  <p className="mt-4 text-base text-slate-600">
                    No bookings yet. Guest bookings will appear here in real time once checkout starts.
                  </p>
                  <button
                    type="button"
                    onClick={() => onShowPage('booking')}
                    className="btn-outline mt-5 px-6 py-3 text-sm"
                  >
                    Open booking flow
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-brand-950">Recent Notifications</h2>
            <button type="button" className="text-sm font-semibold text-brand-600 hover:text-brand-800">
              View all
            </button>
          </div>
          {mergedNotifications.length ? (
            <div className="space-y-3">
              {mergedNotifications.map((item) => (
                <article key={item.id} className="rounded-2xl border border-ice-200 bg-ice-50/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                        {item.title.charAt(0)}
                      </span>
                      <div>
                        <div className="font-semibold text-brand-900">{item.title}</div>
                        <div className="text-sm text-slate-500">Sent to {item.recipient}</div>
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">{item.timestamp}</div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-ice-200 p-6 text-sm text-slate-500">
              No notifications yet. Booking emails and owner alerts will appear here as one unified feed.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getListingFormState(listing) {
  return {
    id: listing.id,
    name: listing.name,
    location: listing.location,
    price: String(listing.price),
    image: listing.image || '',
    summaryImage: listing.summaryImage || '',
    thumbnail: listing.thumbnail || '',
    videoUrl: listing.videoUrl || '',
    facilitiesText: (listing.amenities || []).join(', '),
    schedule: listing.schedule || '',
    mood: listing.mood || '',
    bestFor: listing.bestFor || '',
    statusNote: listing.statusNote || '',
    publishStatus: listing.publishStatus || 'published',
    availabilityNotes: listing.availabilityNotes || '',
    blockedDatesText: (listing.blockedDates || []).join(', '),
    imageAsset: listing.imageAsset || null,
    summaryImageAsset: listing.summaryImageAsset || null,
    thumbnailAsset: listing.thumbnailAsset || null,
    videoAsset: listing.videoAsset || null,
  };
}

function createEmptyListing() {
  const id = `listing-${crypto.randomUUID().slice(0, 8)}`;

  return {
    id,
    name: 'New Staycation Listing',
    location: '',
    price: 0,
    image: '',
    summaryImage: '',
    thumbnail: '',
    videoUrl: '',
    amenities: [],
    schedule: '',
    mood: '',
    bestFor: '',
    statusNote: 'Draft listing',
    publishStatus: 'draft',
    availabilityNotes: '',
    blockedDates: [],
    imageAsset: null,
    summaryImageAsset: null,
    thumbnailAsset: null,
    videoAsset: null,
  };
}

const MEDIA_FIELD_CONFIG = {
  image: {
    assetField: 'imageAsset',
    accept: 'image/*',
    label: 'Hero Photo Upload',
    helper: 'Upload the main client-facing hero image.',
  },
  summaryImage: {
    assetField: 'summaryImageAsset',
    accept: 'image/*',
    label: 'Summary Photo Upload',
    helper: 'Upload the image shown in booking summaries.',
  },
  thumbnail: {
    assetField: 'thumbnailAsset',
    accept: 'image/*',
    label: 'Thumbnail Upload',
    helper: 'Upload the smaller card image used in the booking list.',
  },
  videoUrl: {
    assetField: 'videoAsset',
    accept: 'video/*',
    label: 'Video Walkthrough Upload',
    helper: 'Upload a short walkthrough video for the listing.',
  },
};

const LISTING_PRESETS = [
  {
    id: 'beachfront-villa',
    title: 'Beachfront Villa',
    facilities: ['Infinity Pool', 'Private Beach Access', 'BBQ Deck', 'WiFi', 'Outdoor Shower'],
    schedule: 'Daily check-in from 3:00 PM · Sunset concierge from 5:30 PM · Check-out before 11:00 AM',
    statusNote: 'Beachfront highlight now live',
    mood: 'Ocean-facing stay with breezy social spaces, polished arrival moments, and sunset-ready lounging.',
    bestFor: 'Best for family holidays, bridal parties, and premium short escapes',
  },
  {
    id: 'forest-cabin',
    title: 'Forest Cabin',
    facilities: ['Fire Pit', 'Mountain View Deck', 'Coffee Bar', 'WiFi', 'Private Parking'],
    schedule: 'Self check-in from 4:00 PM · Quiet hours from 10:00 PM · Check-out before 11:00 AM',
    statusNote: 'Forest retreat schedule refreshed',
    mood: 'A calm woodland escape shaped for slower mornings, layered textures, and private evening gatherings.',
    bestFor: 'Best for couples, creators, and restorative weekend stays',
  },
  {
    id: 'urban-loft',
    title: 'Urban Loft',
    facilities: ['Rooftop Access', 'Smart Lock', 'Workspace', 'Streaming TV', 'Fast WiFi'],
    schedule: 'Express check-in from 2:00 PM · Weekday priority stays · Check-out before 12:00 PM',
    statusNote: 'Urban quick-stay preset active',
    mood: 'A compact city stay with efficient flow, strong visual styling, and easy work-to-rest transitions.',
    bestFor: 'Best for business trips, staycations, and content shoots',
  },
];

const MEDIA_FIELD_ORDER = ['image', 'summaryImage', 'thumbnail', 'videoUrl'];

function formatFileSize(size = 0) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getMediaPreviewValue(fieldName, mediaPreviews, selectedListing) {
  if (mediaPreviews[fieldName]) {
    return mediaPreviews[fieldName];
  }

  return selectedListing?.[fieldName] || '';
}

export function DashboardPage({
  listings = FEATURED_PROPERTIES,
  bookings,
  bookingTransactions,
  emails,
  revenue,
  ownerApplications,
  reviewSubmissions,
  onSaveListing,
  onDeleteListing,
  onUpdateBookingStatus,
  onRefundBooking,
  onCancelBooking,
  onShowPage,
  onSignOut,
  authUser,
  formatCurrency,
  analyticsSummary,
}) {
  const latestBooking = bookingTransactions[0] ?? null;
  const stats = useMemo(
    () => [
      { id: 'bookings', label: 'Bookings', value: bookings.length, icon: 'calendar' },
      { id: 'revenue', label: 'Revenue', value: revenue, icon: 'dollar', currency: true },
      { id: 'owners', label: 'Owner Leads', value: ownerApplications.length, icon: 'home' },
      { id: 'evaluations', label: 'Evaluate Leads', value: reviewSubmissions.length, icon: 'pen' },
    ],
    [bookings.length, ownerApplications.length, reviewSubmissions.length, revenue],
  );

  const contentRequirements = [
    {
      title: 'Photos',
      description: 'Upload the hero image, room photos, exterior views, and bathroom shots for each place.',
    },
    {
      title: 'Videos',
      description: 'Attach walkthrough or short promo videos so the client can preview the staycation clearly.',
    },
    {
      title: 'Facilities',
      description: 'List the facilities shown to clients, such as pool, WiFi, parking, beds, and bathrooms.',
    },
    {
      title: 'Schedule',
      description:
        'Maintain the staycation schedule and availability so the booking flow follows an Airbnb-style pattern.',
    },
  ];

  const [selectedListingId, setSelectedListingId] = useState(listings[0]?.id ?? '');
  const [listingForm, setListingForm] = useState(() => getListingFormState(listings[0] ?? FEATURED_PROPERTIES[0]));
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [mediaPreviews, setMediaPreviews] = useState({});
  const [pendingMediaFiles, setPendingMediaFiles] = useState({});
  const [draftListing, setDraftListing] = useState(null);
  const [studioMessage, setStudioMessage] = useState('');
  const [draggingField, setDraggingField] = useState('');
  const [bulkUploadField, setBulkUploadField] = useState('image');
  const [bulkListingIds, setBulkListingIds] = useState([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const availableListings = draftListing ? [draftListing, ...listings] : listings;
  const selectedListing = useMemo(
    () =>
      availableListings.find((listing) => listing.id === selectedListingId) ??
      availableListings[0] ??
      FEATURED_PROPERTIES[0],
    [availableListings, selectedListingId],
  );
  const mediaCards = useMemo(
    () =>
      MEDIA_FIELD_ORDER.map((fieldName) => ({
        fieldName,
        config: MEDIA_FIELD_CONFIG[fieldName],
        preview: getMediaPreviewValue(fieldName, mediaPreviews, selectedListing),
        asset: listingForm[MEDIA_FIELD_CONFIG[fieldName].assetField],
      })),
    [listingForm, mediaPreviews, selectedListing],
  );
  const selectedBulkListings = useMemo(
    () => availableListings.filter((listing) => bulkListingIds.includes(listing.id)),
    [availableListings, bulkListingIds],
  );

  useEffect(() => {
    if (!selectedListing) {
      return;
    }

    startTransition(() => {
      setListingForm(getListingFormState(selectedListing));
      setMediaPreviews({});
      setPendingMediaFiles({});
      setUploadError('');
      setStudioMessage('');
    });
  }, [selectedListing]);

  useEffect(() => {
    if (!availableListings.some((listing) => listing.id === selectedListingId)) {
      startTransition(() => {
        setSelectedListingId(availableListings[0]?.id ?? '');
      });
    }
  }, [availableListings, selectedListingId]);

  useEffect(() => {
    startTransition(() => {
      setBulkListingIds((current) =>
        current.filter((listingId) => availableListings.some((listing) => listing.id === listingId)),
      );
    });
  }, [availableListings]);

  useEffect(() => {
    const previewUrls = Object.values(mediaPreviews);

    return () => {
      previewUrls.forEach((previewUrl) => {
        if (typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [mediaPreviews]);

  function handleListingFieldChange(event) {
    const { name, value } = event.target;
    const mediaConfig = MEDIA_FIELD_CONFIG[name];
    const currentAsset = mediaConfig ? listingForm[mediaConfig.assetField] : null;

    if (currentAsset?.id) {
      void deleteMediaFile(currentAsset);
    }

    setListingForm((current) => ({
      ...current,
      [name]: value,
      ...(mediaConfig ? { [mediaConfig.assetField]: null } : {}),
    }));

    if (mediaConfig) {
      setStudioMessage('');
      setMediaPreviews((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
      setPendingMediaFiles((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  async function uploadMediaFileToField(fieldName, file) {
    const mediaConfig = MEDIA_FIELD_CONFIG[fieldName];

    if (!mediaConfig || !(file instanceof File)) {
      return;
    }

    if (mediaConfig.accept === 'image/*' && !file.type.startsWith('image/')) {
      throw new Error('Please drop an image file for this field.');
    }

    if (mediaConfig.accept === 'video/*' && !file.type.startsWith('video/')) {
      throw new Error('Please drop a video file for this field.');
    }

    setIsUploadingMedia(fieldName);
    setUploadError('');
    setStudioMessage('');

    try {
      const currentAsset = listingForm[mediaConfig.assetField];

      if (currentAsset?.id) {
        await deleteMediaFile(currentAsset);
      }

      const mediaRef = await saveMediaFile(file, fieldName);

      if (!mediaRef) {
        throw new Error('Your browser does not support local media uploads in this environment.');
      }

      const previewUrl = URL.createObjectURL(file);

      setListingForm((current) => ({
        ...current,
        [mediaConfig.assetField]: mediaRef,
      }));
      setMediaPreviews((current) => {
        const existingPreview = current[fieldName];

        if (typeof existingPreview === 'string' && existingPreview.startsWith('blob:')) {
          URL.revokeObjectURL(existingPreview);
        }

        return {
          ...current,
          [fieldName]: previewUrl,
        };
      });
      setPendingMediaFiles((current) => ({
        ...current,
        [fieldName]: file,
      }));
      setStudioMessage(
        `${file.name} is staged for ${mediaConfig.label.toLowerCase()}. Save the listing to publish it.`,
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploadingMedia('');
    }
  }

  async function handleMediaUpload(fieldName, event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await uploadMediaFileToField(fieldName, file);
    event.target.value = '';
  }

  function handleCreateListing() {
    const nextDraft = createEmptyListing();
    setDraftListing(nextDraft);
    setSelectedListingId(nextDraft.id);
    setListingForm(getListingFormState(nextDraft));
    setPendingMediaFiles({});
    setMediaPreviews({});
    setUploadError('');
    setStudioMessage('New listing draft created. Apply a preset or start dropping media files into the upload studio.');
  }

  function clearMediaField(fieldName) {
    const mediaConfig = MEDIA_FIELD_CONFIG[fieldName];

    if (!mediaConfig) {
      return;
    }

    const currentAsset = listingForm[mediaConfig.assetField];

    if (currentAsset?.id) {
      void deleteMediaFile(currentAsset);
    }

    setListingForm((current) => ({
      ...current,
      [fieldName]: '',
      [mediaConfig.assetField]: null,
    }));
    setPendingMediaFiles((current) => {
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
    setMediaPreviews((current) => {
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
    setStudioMessage(`${mediaConfig.label} cleared.`);
  }

  function handleMediaDragOver(fieldName, event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';

    if (draggingField !== fieldName) {
      setDraggingField(fieldName);
    }
  }

  function handleMediaDrop(fieldName, event) {
    event.preventDefault();
    setDraggingField('');
    const file = event.dataTransfer.files?.[0];

    if (file) {
      void uploadMediaFileToField(fieldName, file);
    }
  }

  function handlePresetApply(preset) {
    setListingForm((current) => ({
      ...current,
      facilitiesText: preset.facilities.join(', '),
      schedule: preset.schedule,
      statusNote: preset.statusNote,
      mood: preset.mood,
      bestFor: preset.bestFor,
    }));
    setUploadError('');
    setStudioMessage(
      `${preset.title} preset applied. Facilities, schedule, and guest-facing copy are ready for review.`,
    );
  }

  function toggleBulkListing(listingId) {
    setBulkListingIds((current) =>
      current.includes(listingId) ? current.filter((item) => item !== listingId) : [...current, listingId],
    );
  }

  function toggleAllBulkListings() {
    if (bulkListingIds.length === availableListings.length) {
      setBulkListingIds([]);
      return;
    }

    setBulkListingIds(availableListings.map((listing) => listing.id));
  }

  async function handleBulkUpload(event) {
    const files = Array.from(event.target.files || []);
    const mediaConfig = MEDIA_FIELD_CONFIG[bulkUploadField];

    if (!files.length || !mediaConfig) {
      return;
    }

    if (!selectedBulkListings.length) {
      setUploadError('Select at least one property before starting a bulk upload.');
      event.target.value = '';
      return;
    }

    if (files.length !== 1 && files.length !== selectedBulkListings.length) {
      setUploadError(
        'Use one file to apply the same asset to every selected property, or upload one file per selected property.',
      );
      event.target.value = '';
      return;
    }

    setIsBulkUploading(true);
    setUploadError('');
    setStudioMessage('');

    try {
      for (let index = 0; index < selectedBulkListings.length; index += 1) {
        const listing = selectedBulkListings[index];
        const file = files[Math.min(index, files.length - 1)];
        const currentAsset = listing[mediaConfig.assetField];

        if (currentAsset?.id) {
          await deleteMediaFile(currentAsset);
        }

        const mediaRef = await saveMediaFile(file, `${bulkUploadField}-bulk`);

        await onSaveListing({
          ...listing,
          [mediaConfig.assetField]: mediaRef,
          mediaFiles: {
            [bulkUploadField]: file,
          },
        });
      }

      setStudioMessage(
        `${files.length === 1 ? 'One file has' : `${files.length} files have`} been staged across ${selectedBulkListings.length} selected propert${selectedBulkListings.length === 1 ? 'y' : 'ies'}.`,
      );
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Bulk upload failed. Please try again.');
    } finally {
      setIsBulkUploading(false);
      event.target.value = '';
    }
  }

  async function handleListingSubmit(event) {
    event.preventDefault();
    setIsSavingListing(true);
    setUploadError('');
    await onSaveListing({
      ...selectedListing,
      ...listingForm,
      mediaFiles: pendingMediaFiles,
    });
    setDraftListing(null);
    setPendingMediaFiles({});
    setIsSavingListing(false);
    setStudioMessage('Listing content saved. The public staycation cards now use the latest management portal data.');
  }

  async function handleDeleteListing() {
    await onDeleteListing(selectedListing.id);
    setDraftListing(null);
    setSelectedListingId(listings.find((listing) => listing.id !== selectedListing.id)?.id ?? listings[0]?.id ?? '');
    setStudioMessage('Listing removed from the management portal.');
  }

  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Operations Dashboard</p>
            <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Management Portal</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {authUser?.email ? (
              <div className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                {authUser.email}
              </div>
            ) : null}
            <button type="button" onClick={onSignOut} className="btn-outline px-6 py-3 text-sm">
              Sign Out
            </button>
            <button type="button" onClick={() => onShowPage('landing')} className="btn-outline px-6 py-3 text-sm">
              Return to Site
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <DashboardStat key={stat.id} stat={stat} formatCurrency={formatCurrency} />
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Analytics Dashboard</div>
              <h2 className="mt-2 font-display text-3xl font-bold text-brand-950">Discovery and conversion insights</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
                Custom reporting now tracks consented guest discovery, wishlist usage, support activity, installs, and
                search-to-book conversion.
              </p>
            </div>
            <div className="rounded-full bg-ice-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Consent-aware tracking
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl bg-ice-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Searches</div>
              <div className="mt-2 text-3xl font-bold text-brand-950">{analyticsSummary?.searches ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-ice-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Wishlist Saves</div>
              <div className="mt-2 text-3xl font-bold text-brand-950">{analyticsSummary?.wishlistAdds ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-ice-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Support Messages</div>
              <div className="mt-2 text-3xl font-bold text-brand-950">{analyticsSummary?.supportMessages ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-ice-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Install Prompts</div>
              <div className="mt-2 text-3xl font-bold text-brand-950">{analyticsSummary?.installPrompts ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-brand-950 p-4 text-white">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">Search to Book</div>
              <div className="mt-2 text-3xl font-bold">{analyticsSummary?.conversionRate ?? 0}%</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-ice-200 p-4">
              <div className="text-sm font-semibold text-brand-950">At-a-glance insight</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {analyticsSummary?.searches
                  ? `${analyticsSummary.conversionRate}% of tracked searches are already converting into bookings.`
                  : 'Analytics starts filling in as soon as guests begin searching and allow optional analytics.'}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-ice-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Page Views</div>
                  <div className="mt-2 text-2xl font-bold text-brand-950">{analyticsSummary?.pageViews ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-ice-50 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Wishlisted Stays</div>
                  <div className="mt-2 text-2xl font-bold text-brand-950">
                    {analyticsSummary?.uniqueWishlistedProperties ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-ice-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-brand-950">Recent analytics events</div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Latest activity</span>
              </div>
              <div className="space-y-3">
                {analyticsSummary?.recentEvents?.length ? (
                  analyticsSummary.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-ice-50 px-4 py-3"
                    >
                      <div>
                        <div className="font-semibold text-brand-900">{formatAnalyticsEventLabel(event.type)}</div>
                        <div className="text-xs text-slate-500">{event.path || event.page || 'HoraStaycation'}</div>
                      </div>
                      <div className="text-xs font-medium text-slate-400">
                        {new Date(event.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-ice-200 p-4 text-sm text-slate-500">
                    Recent tracked searches, wishlist actions, support opens, and install prompts will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            {latestBooking ? (
              <div className="rounded-3xl border border-accent-300/40 bg-gradient-to-r from-brand-950 via-brand-900 to-accent-500 p-6 text-white shadow-xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                      <Icon name="email" />
                      New booking request!
                    </div>
                    <h2 className="mt-3 font-display text-2xl font-bold">{latestBooking.bookingSummary.name}</h2>
                    <p className="mt-2 text-sm text-white/75">
                      {latestBooking.bookingForm.guestName} for {latestBooking.bookingForm.guests} guest(s) ·{' '}
                      {latestBooking.bookingForm.checkin} to {latestBooking.bookingForm.checkout}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-5 py-4 text-left md:text-right">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/55">Booking total</div>
                    <div className="mt-1 text-2xl font-bold">{formatCurrency(latestBooking.bookingSummary.total)}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-brand-950">Live Booking Queue</h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                  Operations
                </span>
              </div>
              <div className="space-y-4">
                {bookingTransactions.length ? (
                  bookingTransactions.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-ice-200 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="font-semibold text-brand-900">{booking.bookingSummary.name}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {booking.bookingForm.guestName} · {booking.bookingForm.guestEmail}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            {booking.bookingForm.checkin} to {booking.bookingForm.checkout} ·{' '}
                            {booking.bookingSummary.nights} night(s) · {booking.bookingForm.guests} guest(s)
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClasses(booking.paymentStatus)}`}
                            >
                              Payment {formatStatusCopy(booking.paymentStatus || 'paid')}
                            </span>
                            <span className="rounded-full bg-ice-50 px-3 py-1 text-xs font-semibold text-brand-700">
                              {String(booking.paymentProvider || 'manual').toUpperCase()}
                            </span>
                            {booking.refundStatus ? (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Refund {formatStatusCopy(booking.refundStatus)}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 space-y-1 text-xs text-slate-400">
                            {booking.stripeSessionId ? <div>Stripe session: {booking.stripeSessionId}</div> : null}
                            {booking.stripePaymentIntentId ? (
                              <div>Payment intent: {booking.stripePaymentIntentId}</div>
                            ) : null}
                            {booking.customerReceiptEmail ? (
                              <div>Receipt email: {booking.customerReceiptEmail}</div>
                            ) : null}
                            {booking.statusNote ? <div>Status note: {booking.statusNote}</div> : null}
                          </div>
                        </div>
                        <div className="space-y-2 text-right">
                          <div className="font-bold text-brand-700">{formatCurrency(booking.bookingSummary.total)}</div>
                          <select
                            value={booking.bookingStatus || 'confirmed'}
                            onChange={(event) => onUpdateBookingStatus(booking.id, event.target.value)}
                            className="rounded-xl border border-ice-200 px-3 py-2 text-xs font-semibold text-brand-700"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="checked-in">Checked In</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="payment_issue">Payment Issue</option>
                            <option value="refunded">Refunded</option>
                          </select>
                          <div className="flex flex-wrap justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => onCancelBooking?.(booking)}
                              className="rounded-xl border border-ice-200 px-3 py-2 text-xs font-semibold text-slate-600"
                            >
                              Cancel Booking
                            </button>
                            <button
                              type="button"
                              onClick={() => onRefundBooking?.(booking)}
                              disabled={!booking.stripeSessionId || booking.paymentStatus === 'refunded'}
                              className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Refund Payment
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-ice-200 p-6 text-sm text-slate-500">
                    New client bookings will appear here after checkout is completed.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-brand-950">Management Upload Studio</h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                  Drag-and-Drop · Bulk Upload · Presets
                </span>
              </div>
              <form onSubmit={handleListingSubmit} className="space-y-5">
                <div className="grid gap-5 xl:grid-cols-[1fr_1.05fr]">
                  <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">
                          Listing Presets
                        </div>
                        <h3 className="mt-2 font-display text-2xl font-bold text-brand-950">
                          Templates for fast setup
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Apply a ready-made facilities and schedule pack, then fine-tune the details for the selected
                          property.
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
                        <Icon name="list-check" />
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {LISTING_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handlePresetApply(preset)}
                          className="rounded-2xl border border-brand-100 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-brand-900">{preset.title}</div>
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                              Apply
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-500">{preset.schedule}</div>
                          <div className="mt-3 text-xs text-slate-400">{preset.facilities.join(' · ')}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-ice-200 bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                          Bulk Upload
                        </div>
                        <h3 className="mt-2 font-display text-2xl font-bold">Multiple properties in one pass</h3>
                        <p className="mt-2 text-sm text-white/70">
                          Choose the asset type, pick the properties, then upload one shared file or one file per
                          selected property.
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                        <Icon name="upload" />
                      </span>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                      <div>
                        <label className="form-label text-white" htmlFor="bulkUploadField">
                          Asset Type
                        </label>
                        <select
                          id="bulkUploadField"
                          value={bulkUploadField}
                          onChange={(event) => setBulkUploadField(event.target.value)}
                          className="form-input border-white/15 bg-white/8 text-white"
                        >
                          {MEDIA_FIELD_ORDER.map((fieldName) => (
                            <option key={fieldName} value={fieldName} className="text-slate-900">
                              {MEDIA_FIELD_CONFIG[fieldName].label.replace(' Upload', '')}
                            </option>
                          ))}
                        </select>
                        <label className="form-label mt-4 text-white" htmlFor="bulkUploadInput">
                          Bulk Files
                        </label>
                        <input
                          id="bulkUploadInput"
                          type="file"
                          multiple
                          accept={MEDIA_FIELD_CONFIG[bulkUploadField].accept}
                          onChange={handleBulkUpload}
                          disabled={isBulkUploading}
                          className="form-input border-white/15 bg-white/8 text-white"
                        />
                        <p className="mt-2 text-xs text-white/55">
                          Upload 1 file to reuse the same asset for every selected property, or upload{' '}
                          {selectedBulkListings.length || 'matching'} files to map them in property order.
                        </p>
                      </div>
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">
                            Target Properties
                          </div>
                          <button
                            type="button"
                            onClick={toggleAllBulkListings}
                            className="text-xs font-semibold text-cyan-300"
                          >
                            {bulkListingIds.length === availableListings.length ? 'Clear all' : 'Select all'}
                          </button>
                        </div>
                        <div className="grid max-h-48 gap-2 overflow-y-auto pr-1">
                          {availableListings.map((listing) => (
                            <label
                              key={listing.id}
                              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
                            >
                              <input
                                type="checkbox"
                                checked={bulkListingIds.includes(listing.id)}
                                onChange={() => toggleBulkListing(listing.id)}
                                className="mt-1 h-4 w-4 rounded border-white/30"
                              />
                              <span className="min-w-0">
                                <span className="block font-semibold text-white">{listing.name}</span>
                                <span className="block text-sm text-white/60">{listing.location}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleCreateListing} className="btn-primary px-5 py-3 text-sm">
                    + Add New Listing
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteListing}
                    className="rounded-xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600"
                  >
                    Delete Listing
                  </button>
                </div>
                <div>
                  <label className="form-label" htmlFor="listingSelect">
                    Listing to Manage
                  </label>
                  <select
                    id="listingSelect"
                    value={selectedListingId}
                    onChange={(event) => setSelectedListingId(event.target.value)}
                    className="form-input"
                  >
                    {availableListings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="name">
                      Listing Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={listingForm.name}
                      onChange={handleListingFieldChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      value={listingForm.location}
                      onChange={handleListingFieldChange}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="price">
                      Nightly Price
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      value={listingForm.price}
                      onChange={handleListingFieldChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="statusNote">
                      Status Note
                    </label>
                    <input
                      id="statusNote"
                      name="statusNote"
                      value={listingForm.statusNote}
                      onChange={handleListingFieldChange}
                      className="form-input"
                      placeholder="Now live for guests"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="publishStatus">
                      Publish Status
                    </label>
                    <select
                      id="publishStatus"
                      name="publishStatus"
                      value={listingForm.publishStatus}
                      onChange={handleListingFieldChange}
                      className="form-input"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="availabilityNotes">
                      Availability Notes
                    </label>
                    <input
                      id="availabilityNotes"
                      name="availabilityNotes"
                      value={listingForm.availabilityNotes}
                      onChange={handleListingFieldChange}
                      className="form-input"
                      placeholder="Closed on public holidays"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label" htmlFor="blockedDatesText">
                    Blocked Dates
                  </label>
                  <textarea
                    id="blockedDatesText"
                    name="blockedDatesText"
                    rows="3"
                    value={listingForm.blockedDatesText}
                    onChange={handleListingFieldChange}
                    className="form-input"
                    placeholder="2026-06-20, 2026-06-21, 2026-06-22"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Add comma-separated dates to block guest booking on those days.
                  </p>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {mediaCards.map(({ fieldName, config, preview, asset }) => {
                    const isVideoField = fieldName === 'videoUrl';
                    const inputId = `${fieldName}Upload`;

                    return (
                      <div key={fieldName} className="rounded-3xl border border-ice-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <label className="form-label" htmlFor={fieldName}>
                              {config.label.replace(' Upload', ' URL')}
                            </label>
                            <input
                              id={fieldName}
                              name={fieldName}
                              value={listingForm[fieldName]}
                              onChange={handleListingFieldChange}
                              className="form-input"
                              placeholder={isVideoField ? 'https://youtube.com/...' : 'https://...'}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => clearMediaField(fieldName)}
                            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm"
                          >
                            Clear
                          </button>
                        </div>
                        <label
                          htmlFor={inputId}
                          onDragOver={(event) => handleMediaDragOver(fieldName, event)}
                          onDragLeave={() => setDraggingField('')}
                          onDrop={(event) => handleMediaDrop(fieldName, event)}
                          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-5 py-6 text-center transition ${
                            draggingField === fieldName
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-ice-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'
                          }`}
                        >
                          <input
                            id={inputId}
                            type="file"
                            accept={config.accept}
                            onChange={(event) => handleMediaUpload(fieldName, event)}
                            className="hidden"
                          />
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                            <Icon name="upload" />
                          </span>
                          <div className="mt-3 font-semibold text-brand-950">Drag and drop or browse</div>
                          <p className="mt-1 text-sm text-slate-500">{config.helper}</p>
                          {asset?.name ? (
                            <div className="mt-3 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                              {asset.name} · {formatFileSize(asset.size)}
                            </div>
                          ) : null}
                        </label>
                        <div className="mt-4 rounded-2xl border border-ice-200 bg-white p-3">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Preview
                          </div>
                          {isVideoField ? (
                            preview ? (
                              <video src={preview} controls className="h-40 w-full rounded-2xl object-cover" />
                            ) : (
                              <div className="flex h-40 items-center justify-center rounded-2xl bg-ice-50 text-xs text-slate-400">
                                No video uploaded
                              </div>
                            )
                          ) : (
                            <img
                              src={preview || selectedListing?.image}
                              alt={`${listingForm.name} ${config.label.toLowerCase()}`}
                              className="h-40 w-full rounded-2xl object-cover"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <label className="form-label" htmlFor="schedule">
                    Schedule
                  </label>
                  <input
                    id="schedule"
                    name="schedule"
                    value={listingForm.schedule}
                    onChange={handleListingFieldChange}
                    className="form-input"
                    placeholder="Daily check-in from 3:00 PM"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Use this for check-in, check-out, weekday availability, or blackout notes.
                  </p>
                </div>
                <div>
                  <label className="form-label" htmlFor="facilitiesText">
                    Facilities
                  </label>
                  <textarea
                    id="facilitiesText"
                    name="facilitiesText"
                    rows="3"
                    value={listingForm.facilitiesText}
                    onChange={handleListingFieldChange}
                    className="form-input"
                    placeholder="Pool, WiFi, Parking, BBQ Place"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Separate facilities with commas so they publish as client-facing tags.
                  </p>
                </div>
                {uploadError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {uploadError}
                  </div>
                ) : null}
                {studioMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {studioMessage}
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="mood">
                      Guest Experience Copy
                    </label>
                    <textarea
                      id="mood"
                      name="mood"
                      rows="3"
                      value={listingForm.mood}
                      onChange={handleListingFieldChange}
                      className="form-input"
                      placeholder="Describe the stay in one persuasive sentence."
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="bestFor">
                      Best For
                    </label>
                    <textarea
                      id="bestFor"
                      name="bestFor"
                      rows="3"
                      value={listingForm.bestFor}
                      onChange={handleListingFieldChange}
                      className="form-input"
                      placeholder="Best for families, couples, team retreats..."
                    />
                  </div>
                </div>
                <div className="rounded-2xl bg-ice-50 p-4 text-sm text-slate-500">
                  Changes here update the public staycation cards and the booking flow because management is now the
                  source of truth for listing content.
                  {isUploadingMedia ? ` Uploading ${MEDIA_FIELD_CONFIG[isUploadingMedia]?.label.toLowerCase()}...` : ''}
                  {isBulkUploading ? ' Processing the bulk upload queue...' : ''}
                  {!isUploadingMedia && !isBulkUploading && Object.keys(pendingMediaFiles).length
                    ? ' Ready to sync uploaded files on save.'
                    : ''}
                </div>
                <button
                  type="submit"
                  disabled={isSavingListing}
                  className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingListing ? 'Saving Listing…' : 'Save Listing Update'}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-brand-950">Published Staycation Choices</h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                  Client Facing
                </span>
              </div>
              <div className="space-y-4">
                {listings.map((property) => (
                  <div key={property.id} className="flex items-center gap-4 rounded-2xl border border-ice-200 p-4">
                    <img
                      src={property.thumbnail}
                      alt={property.name}
                      width="80"
                      height="60"
                      loading="lazy"
                      className="h-14 w-20 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-brand-900">{property.name}</div>
                      <div className="text-sm text-slate-500">{property.location}</div>
                      <div className="mt-1 text-xs text-slate-400">{property.amenities.join(' · ')}</div>
                      {property.schedule ? (
                        <div className="mt-1 text-xs text-brand-500">{property.schedule}</div>
                      ) : null}
                      {property.videoUrl ? <div className="mt-1 text-xs text-brand-500">Video linked</div> : null}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand-700">{formatCurrency(property.price)}</div>
                      <div className="text-xs text-brand-500">{property.statusNote}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-display text-2xl font-bold text-brand-950">Upload Requirements</h2>
              <div className="space-y-4">
                {contentRequirements.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-ice-200 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon name="upload" />
                      </span>
                      <div>
                        <div className="font-semibold text-brand-900">{item.title}</div>
                        <div className="text-sm text-slate-500">{item.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-display text-2xl font-bold text-brand-950">Recent Owner & Evaluate Requests</h2>
              <div className="space-y-4">
                {ownerApplications.slice(0, 3).map((application) => (
                  <div key={application.id} className="rounded-2xl border border-ice-200 p-4">
                    <div className="font-semibold text-brand-900">{application.ownerName}</div>
                    <div className="text-sm text-slate-500">{application.ownerAddress}</div>
                    <div className="mt-1 text-xs text-brand-600">
                      Owner lead · {application.unitCount} unit(s) · {application.budget}
                    </div>
                  </div>
                ))}
                {reviewSubmissions.slice(0, 3).map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-ice-200 p-4">
                    <div className="font-semibold text-brand-900">{submission.evaluatorName}</div>
                    <div className="text-sm text-slate-500">{submission.evaluatorAddress}</div>
                    <div className="mt-1 text-xs text-brand-600">
                      Evaluate request · {submission.unitCount} unit(s) · {submission.evaluatorEmail}
                    </div>
                  </div>
                ))}
                {!ownerApplications.length && !reviewSubmissions.length ? (
                  <div className="rounded-2xl border border-dashed border-ice-200 p-4 text-sm text-slate-500">
                    New owner and evaluation requests will appear here after submissions.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-display text-2xl font-bold text-brand-950">Triggered Email Activity</h2>
              <div className="space-y-4">
                {emails.length ? (
                  emails.map((email) => (
                    <div key={`${email.title}-${email.detail}`} className="rounded-2xl border border-ice-200 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <Icon name="email" />
                        </span>
                        <div>
                          <div className="font-semibold text-brand-900">{email.title}</div>
                          <div className="text-sm text-slate-500">{email.detail}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-ice-200 p-4 text-sm text-slate-500">
                    Email activity will appear here when bookings and requests trigger notifications.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-brand-950 p-6 text-white shadow-xl">
          <h2 className="font-display text-2xl font-bold">Operations Snapshot</h2>
          <p className="mt-3 text-white/70">
            Management prepares the properties clients see, while bookings, owner leads, evaluate requests, and
            triggered emails continue to feed the operating queue.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/8 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Bookings</div>
              <div className="mt-2 text-2xl font-bold">{bookings.length}</div>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Emails</div>
              <div className="mt-2 text-2xl font-bold">{emails.length}</div>
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Live Revenue</div>
              <div className="mt-2 text-2xl font-bold">{formatCurrency(revenue)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
