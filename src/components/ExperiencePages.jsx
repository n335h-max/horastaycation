import { useEffect, useMemo, useState } from 'react';
import { FEATURED_PROPERTIES } from '../data/siteData';
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
          <div className="text-sm font-semibold text-brand-900">Google entry</div>
          <p className="mt-1 text-sm text-slate-500">Keeps the role clear before the form starts.</p>
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

export function OwnerSignupPage({ onShowPage, onSubmitOwner, isSubmitting, authUser, authRole, isAuthLoading, onGoogleSignIn }) {
  const [form, setForm] = useState(INITIAL_OWNER_FORM);
  const [errors, setErrors] = useState({});
  const googleConnected = Boolean(authUser && authRole === 'owner');

  useEffect(() => {
    if (!authUser?.email) {
      return;
    }

    setForm((current) => ({
      ...current,
      ownerEmail: current.ownerEmail || authUser.email,
      ownerName: current.ownerName || authUser.user_metadata?.full_name || current.ownerName,
    }));
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
        <button type="button" onClick={() => onShowPage('landing')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800">
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Build / Refurbish With Us</h1>
          <p className="mt-3 text-lg text-slate-600">This owner flow starts with Google sign-in, then collects the location, unit count, and budget needed for Hora follow-up.</p>
        </div>
        {!googleConnected ? (
          <GoogleEntryCard
            title="Sign in as Owner"
            description="Use this first step for owners who want Hora to build or refurbish a location. Once the owner continues with Google, the form below becomes their owner request."
            roleLabel="Owner Role"
            buttonLabel="Continue With Google as Owner"
            onContinue={onGoogleSignIn}
            email={authUser?.email}
            isSubmitting={isSubmitting || isAuthLoading}
          />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-3xl border border-ice-200 bg-ice-50 p-8 shadow-lg">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white">
              <Icon name="lock" />
              Signed in as Owner
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="ownerName">Owner Name</label>
                <input id="ownerName" name="ownerName" value={form.ownerName} onChange={handleChange} className="form-input" autoComplete="name" placeholder="John Doe" />
                <FieldError errors={errors} name="ownerName" />
              </div>
              <div>
                <label className="form-label" htmlFor="ownerEmail">Owner Email</label>
                <input id="ownerEmail" name="ownerEmail" type="email" value={form.ownerEmail} onChange={handleChange} className="form-input" autoComplete="email" placeholder="owner@example.com" />
                <FieldError errors={errors} name="ownerEmail" />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="ownerAddress">House Address</label>
              <textarea id="ownerAddress" name="ownerAddress" rows="4" value={form.ownerAddress} onChange={handleChange} className="form-input" placeholder="Enter the full house address for the staycation location" />
              <FieldError errors={errors} name="ownerAddress" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="unitCount">How Many Units Are Needed?</label>
                <select id="unitCount" name="unitCount" value={form.unitCount} onChange={handleChange} className="form-input">
                  <option value="1">1 Unit</option>
                  <option value="2">2 Units</option>
                  <option value="3">3 Units</option>
                  <option value="4">4 Units</option>
                </select>
                <p className="mt-2 text-xs text-slate-400">This owner flow only accepts four units or fewer.</p>
                <FieldError errors={errors} name="unitCount" />
              </div>
              <div>
                <label className="form-label" htmlFor="budget">Budget</label>
                <input id="budget" name="budget" value={form.budget} onChange={handleChange} className="form-input" placeholder="RM 80,000" />
                <FieldError errors={errors} name="budget" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
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
        <button type="button" onClick={() => onShowPage('landing')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800">
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Evaluate With Us</h1>
          <p className="mt-3 text-lg text-slate-600">Use this form for a first staycation that wants Hora to evaluate and register it before management takes over the listing work.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-3xl border border-ice-200 bg-ice-50 p-8 shadow-lg">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="evaluatorName">Name</label>
              <input id="evaluatorName" name="evaluatorName" value={form.evaluatorName} onChange={handleChange} className="form-input" autoComplete="name" placeholder="Your name" />
              <FieldError errors={errors} name="evaluatorName" />
            </div>
            <div>
              <label className="form-label" htmlFor="evaluatorEmail">Email</label>
              <input id="evaluatorEmail" name="evaluatorEmail" type="email" value={form.evaluatorEmail} onChange={handleChange} className="form-input" autoComplete="email" placeholder="partner@example.com" />
              <FieldError errors={errors} name="evaluatorEmail" />
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="evaluatorAddress">Address</label>
            <textarea id="evaluatorAddress" name="evaluatorAddress" rows="4" value={form.evaluatorAddress} onChange={handleChange} className="form-input" placeholder="Enter the address of the staycation you want to register" />
            <FieldError errors={errors} name="evaluatorAddress" />
          </div>
          <div>
            <label className="form-label" htmlFor="unitCount">Units Provided for Staycation</label>
            <select id="unitCount" name="unitCount" value={form.unitCount} onChange={handleChange} className="form-input">
              <option value="1">1 Unit</option>
              <option value="2">2 Units</option>
              <option value="3">3 Units</option>
              <option value="4">4 Units</option>
            </select>
            <p className="mt-2 text-xs text-slate-400">Evaluation requests must stay within four units or below.</p>
            <FieldError errors={errors} name="unitCount" />
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-ice-200 bg-white px-4 py-4 text-sm text-slate-600">
            <input name="exclusivityAgreement" type="checkbox" checked={form.exclusivityAgreement} onChange={handleChange} className="mt-1 h-5 w-5 accent-brand-600" />
            <span>I confirm this staycation is not registered with Airbnb, Booking.com, or any other partnership platform.</span>
          </label>
          <FieldError errors={errors} name="exclusivityAgreement" />
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
            <span>{isSubmitting ? 'Submitting Evaluation…' : 'Submit Evaluation Request'}</span>
          </button>
        </form>
      </div>
    </section>
  );
}

export function ManagementLoginPage({ onShowPage, isSubmitting, authUser, authRole, isAuthLoading, onGoogleSignIn, onSignOut }) {
  return (
    <section className="hero-bg min-h-screen px-4 pt-28 md:px-8">
      <div className="mx-auto max-w-md">
        <button type="button" onClick={() => onShowPage('landing')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>
        <div className="glass-panel rounded-3xl border border-white/15 bg-brand-950/70 p-8 text-white shadow-2xl">
          <h1 className="font-display text-4xl font-bold">Management Login</h1>
          <p className="mt-3 text-white/70">Sign in to upload staycation photos, videos, facilities, schedules, and every listing detail the client booking flow needs.</p>
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
                <button type="button" onClick={() => onShowPage('dashboard')} className="btn-accent w-full py-4 text-base">
                  Open Management Dashboard
                </button>
                <button type="button" onClick={onSignOut} className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80">
                  Sign Out
                </button>
              </div>
            ) : (
              <button type="button" onClick={onGoogleSignIn} disabled={isSubmitting || isAuthLoading} className="btn-accent w-full py-4 text-base disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting || isAuthLoading ? 'Opening Google Sign-In…' : 'Continue With Google as Management'}
              </button>
            )}
            {authUser && authRole !== 'management' ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                This signed-in email is not on the management allowlist yet. Add it to `VITE_MANAGEMENT_EMAILS` before using the dashboard.
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

  return (
    <article className="dash-card rounded-2xl border border-ice-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name={stat.icon} />
        </span>
      </div>
      <div className="number-gradient text-3xl font-black">{value}</div>
      {stat.trend ? (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
          <Icon name="trend" />
          {stat.trend} from last month
        </div>
      ) : null}
    </article>
  );
}

export function OwnerDashboardPage({ ownerApplications, bookingTransactions, emails, onShowPage, onSignOut, authUser, formatCurrency }) {
  const latestOwner = ownerApplications[0] ?? null;
  const ownerStats = useMemo(
    () => [
      { id: 'requests', label: 'Owner Requests', value: ownerApplications.length, icon: 'home' },
      { id: 'booking-alerts', label: 'Client Bookings', value: bookingTransactions.length, icon: 'calendar' },
      { id: 'notifications', label: 'Notifications', value: emails.length, icon: 'email' },
      {
        id: 'projected-revenue',
        label: 'Projected Revenue',
        value: bookingTransactions.reduce((sum, booking) => sum + (booking.bookingSummary?.total ?? 0), 0),
        icon: 'dollar',
        currency: true,
      },
    ],
    [bookingTransactions, emails.length, ownerApplications.length],
  );

  const requestStages = latestOwner
    ? [
        { title: 'Request Received', detail: `Submitted for ${latestOwner.ownerAddress}`, status: 'done' },
        { title: 'Management Review', detail: `${latestOwner.unitCount} unit(s) · Budget ${latestOwner.budget}`, status: 'active' },
        { title: 'Listing Preparation', detail: 'Photos, facilities, and schedule are prepared after approval.', status: 'upcoming' },
      ]
    : [];

  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Owner Workspace</p>
            <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Owner Dashboard</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Track your build request, review client booking alerts, and see how Hora is moving your staycation into the live listing stage.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {authUser?.email ? (
              <div className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                {authUser.email}
              </div>
            ) : null}
            <button type="button" onClick={() => onShowPage('owner-signup')} className="btn-outline px-6 py-3 text-sm">
              Submit Another Request
            </button>
            <button type="button" onClick={onSignOut} className="btn-outline px-6 py-3 text-sm">
              Sign Out
            </button>
            <button type="button" onClick={() => onShowPage('landing')} className="btn-primary px-6 py-3 text-sm">
              Return to Site
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {ownerStats.map((stat) => (
            <DashboardStat key={stat.id} stat={stat} formatCurrency={formatCurrency} />
          ))}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-display text-2xl font-bold text-brand-950">Current Request Status</h2>
              {latestOwner ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-brand-950 p-5 text-white">
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/55">Latest Owner Request</div>
                    <div className="mt-3 text-2xl font-bold">{latestOwner.ownerName}</div>
                    <div className="mt-2 text-sm text-white/75">{latestOwner.ownerEmail}</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-white/50">Location</div>
                        <div className="mt-2 text-sm font-medium">{latestOwner.ownerAddress}</div>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-white/50">Budget & Units</div>
                        <div className="mt-2 text-sm font-medium">{latestOwner.budget} · {latestOwner.unitCount} unit(s)</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {requestStages.map((stage) => (
                      <div key={stage.title} className="flex items-start gap-4 rounded-2xl border border-ice-200 p-4">
                        <span className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl ${
                          stage.status === 'done'
                            ? 'bg-emerald-100 text-emerald-600'
                            : stage.status === 'active'
                              ? 'bg-brand-50 text-brand-600'
                              : 'bg-slate-100 text-slate-400'
                        }`}>
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
                <div className="rounded-2xl border border-dashed border-ice-200 p-6 text-sm text-slate-500">
                  No owner request has been submitted yet. Use the owner form first, then this dashboard will show the live request status.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-display text-2xl font-bold text-brand-950">Owner Notifications</h2>
              <div className="space-y-4">
                {emails.length ? (
                  emails.slice(0, 5).map((email) => (
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
                    Owner notifications appear here after booking and request activity starts.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-brand-950">Client Booking Alerts</h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">Owner View</span>
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
                            {booking.bookingForm.checkin} to {booking.bookingForm.checkout} · {booking.bookingSummary.nights} night(s)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-brand-700">{formatCurrency(booking.bookingSummary.total)}</div>
                          <div className="mt-1 text-xs text-slate-400">Client booking alert</div>
                        </div>
                      </div>
                      {booking.bookingForm.specialRequests ? (
                        <div className="mt-4 rounded-xl bg-ice-50 px-4 py-3 text-sm text-slate-600">
                          <span className="font-semibold text-brand-900">Special requests:</span> {booking.bookingForm.specialRequests}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-ice-200 p-6 text-sm text-slate-500">
                    No client bookings yet. When guests book, the owner dashboard will show them here.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-brand-950 p-6 text-white shadow-xl">
              <h2 className="font-display text-2xl font-bold">What Happens Next</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/8 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">1</div>
                  <div className="mt-2 text-sm text-white/80">Management reviews the owner request and confirms the next build direction.</div>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">2</div>
                  <div className="mt-2 text-sm text-white/80">Hora prepares the listing details, facilities, visuals, and schedule.</div>
                </div>
                <div className="rounded-2xl bg-white/8 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">3</div>
                  <div className="mt-2 text-sm text-white/80">Owner sees new client booking alerts and expected revenue in one place.</div>
                </div>
              </div>
            </div>
          </div>
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
  onShowPage,
  onSignOut,
  authUser,
  formatCurrency,
}) {
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
      description: 'Maintain the staycation schedule and availability so the booking flow follows an Airbnb-style pattern.',
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

  const availableListings = draftListing ? [draftListing, ...listings] : listings;
  const selectedListing = useMemo(
    () => availableListings.find((listing) => listing.id === selectedListingId) ?? availableListings[0] ?? FEATURED_PROPERTIES[0],
    [availableListings, selectedListingId],
  );

  useEffect(() => {
    if (!selectedListing) {
      return;
    }

    setListingForm(getListingFormState(selectedListing));
    setMediaPreviews({});
    setPendingMediaFiles({});
    setUploadError('');
  }, [selectedListing]);

  useEffect(() => {
    if (!availableListings.some((listing) => listing.id === selectedListingId)) {
      setSelectedListingId(availableListings[0]?.id ?? '');
    }
  }, [availableListings, selectedListingId]);

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

  async function handleMediaUpload(fieldName, event) {
    const mediaConfig = MEDIA_FIELD_CONFIG[fieldName];
    const file = event.target.files?.[0];

    if (!mediaConfig || !file) {
      return;
    }

    setIsUploadingMedia(fieldName);
    setUploadError('');

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
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploadingMedia('');
      event.target.value = '';
    }
  }

  function getMediaPreview(fieldName) {
    if (mediaPreviews[fieldName]) {
      return mediaPreviews[fieldName];
    }

    return selectedListing?.[fieldName] || '';
  }

  function handleCreateListing() {
    const nextDraft = createEmptyListing();
    setDraftListing(nextDraft);
    setSelectedListingId(nextDraft.id);
    setListingForm(getListingFormState(nextDraft));
    setPendingMediaFiles({});
    setMediaPreviews({});
    setUploadError('');
  }

  function clearMediaField(fieldName) {
    const mediaConfig = MEDIA_FIELD_CONFIG[fieldName];

    if (!mediaConfig) {
      return;
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
  }

  async function handleListingSubmit(event) {
    event.preventDefault();
    setIsSavingListing(true);
    await onSaveListing({
      ...selectedListing,
      ...listingForm,
      mediaFiles: pendingMediaFiles,
    });
    setDraftListing(null);
    setPendingMediaFiles({});
    setIsSavingListing(false);
  }

  async function handleDeleteListing() {
    await onDeleteListing(selectedListing.id);
    setDraftListing(null);
    setSelectedListingId(listings.find((listing) => listing.id !== selectedListing.id)?.id ?? listings[0]?.id ?? '');
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

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-brand-950">Live Booking Queue</h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">Operations</span>
              </div>
              <div className="space-y-4">
                {bookingTransactions.length ? (
                  bookingTransactions.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border border-ice-200 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="font-semibold text-brand-900">{booking.bookingSummary.name}</div>
                          <div className="mt-1 text-sm text-slate-500">{booking.bookingForm.guestName} · {booking.bookingForm.guestEmail}</div>
                          <div className="mt-2 text-sm text-slate-500">
                            {booking.bookingForm.checkin} to {booking.bookingForm.checkout} · {booking.bookingSummary.nights} night(s) · {booking.bookingForm.guests} guest(s)
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
                          </select>
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
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">Photos · Videos · Facilities · Schedule</span>
              </div>
              <form onSubmit={handleListingSubmit} className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleCreateListing} className="btn-primary px-5 py-3 text-sm">
                    + Add New Listing
                  </button>
                  <button type="button" onClick={handleDeleteListing} className="rounded-xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600">
                    Delete Listing
                  </button>
                </div>
                <div>
                  <label className="form-label" htmlFor="listingSelect">Listing to Manage</label>
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
                    <label className="form-label" htmlFor="name">Listing Name</label>
                    <input id="name" name="name" value={listingForm.name} onChange={handleListingFieldChange} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="location">Location</label>
                    <input id="location" name="location" value={listingForm.location} onChange={handleListingFieldChange} className="form-input" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="price">Nightly Price</label>
                    <input id="price" name="price" type="number" min="0" value={listingForm.price} onChange={handleListingFieldChange} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="statusNote">Status Note</label>
                    <input id="statusNote" name="statusNote" value={listingForm.statusNote} onChange={handleListingFieldChange} className="form-input" placeholder="Now live for guests" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="publishStatus">Publish Status</label>
                    <select id="publishStatus" name="publishStatus" value={listingForm.publishStatus} onChange={handleListingFieldChange} className="form-input">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="availabilityNotes">Availability Notes</label>
                    <input id="availabilityNotes" name="availabilityNotes" value={listingForm.availabilityNotes} onChange={handleListingFieldChange} className="form-input" placeholder="Closed on public holidays" />
                  </div>
                </div>
                <div>
                  <label className="form-label" htmlFor="blockedDatesText">Blocked Dates</label>
                  <textarea id="blockedDatesText" name="blockedDatesText" rows="3" value={listingForm.blockedDatesText} onChange={handleListingFieldChange} className="form-input" placeholder="2026-06-20, 2026-06-21, 2026-06-22" />
                  <p className="mt-2 text-xs text-slate-400">Add comma-separated dates to block guest booking on those days.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="form-label" htmlFor="image">Hero Photo URL</label>
                    <input id="image" name="image" value={listingForm.image} onChange={handleListingFieldChange} className="form-input" placeholder="https://..." />
                    <label className="form-label mt-3" htmlFor="imageUpload">{MEDIA_FIELD_CONFIG.image.label}</label>
                    <input
                      id="imageUpload"
                      type="file"
                      accept={MEDIA_FIELD_CONFIG.image.accept}
                      onChange={(event) => handleMediaUpload('image', event)}
                      className="form-input"
                    />
                    <button type="button" onClick={() => clearMediaField('image')} className="mt-2 text-xs font-semibold text-rose-600">
                      Delete / Replace hero media
                    </button>
                    <p className="mt-2 text-xs text-slate-400">{MEDIA_FIELD_CONFIG.image.helper}</p>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="summaryImage">Summary Photo URL</label>
                    <input id="summaryImage" name="summaryImage" value={listingForm.summaryImage} onChange={handleListingFieldChange} className="form-input" placeholder="https://..." />
                    <label className="form-label mt-3" htmlFor="summaryImageUpload">{MEDIA_FIELD_CONFIG.summaryImage.label}</label>
                    <input
                      id="summaryImageUpload"
                      type="file"
                      accept={MEDIA_FIELD_CONFIG.summaryImage.accept}
                      onChange={(event) => handleMediaUpload('summaryImage', event)}
                      className="form-input"
                    />
                    <button type="button" onClick={() => clearMediaField('summaryImage')} className="mt-2 text-xs font-semibold text-rose-600">
                      Delete / Replace summary media
                    </button>
                    <p className="mt-2 text-xs text-slate-400">{MEDIA_FIELD_CONFIG.summaryImage.helper}</p>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="thumbnail">Thumbnail URL</label>
                    <input id="thumbnail" name="thumbnail" value={listingForm.thumbnail} onChange={handleListingFieldChange} className="form-input" placeholder="https://..." />
                    <label className="form-label mt-3" htmlFor="thumbnailUpload">{MEDIA_FIELD_CONFIG.thumbnail.label}</label>
                    <input
                      id="thumbnailUpload"
                      type="file"
                      accept={MEDIA_FIELD_CONFIG.thumbnail.accept}
                      onChange={(event) => handleMediaUpload('thumbnail', event)}
                      className="form-input"
                    />
                    <button type="button" onClick={() => clearMediaField('thumbnail')} className="mt-2 text-xs font-semibold text-rose-600">
                      Delete / Replace thumbnail media
                    </button>
                    <p className="mt-2 text-xs text-slate-400">{MEDIA_FIELD_CONFIG.thumbnail.helper}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="videoUrl">Video Walkthrough URL</label>
                    <input id="videoUrl" name="videoUrl" value={listingForm.videoUrl} onChange={handleListingFieldChange} className="form-input" placeholder="https://youtube.com/..." />
                    <label className="form-label mt-3" htmlFor="videoUpload">{MEDIA_FIELD_CONFIG.videoUrl.label}</label>
                    <input
                      id="videoUpload"
                      type="file"
                      accept={MEDIA_FIELD_CONFIG.videoUrl.accept}
                      onChange={(event) => handleMediaUpload('videoUrl', event)}
                      className="form-input"
                    />
                    <button type="button" onClick={() => clearMediaField('videoUrl')} className="mt-2 text-xs font-semibold text-rose-600">
                      Delete / Replace video media
                    </button>
                    <p className="mt-2 text-xs text-slate-400">{MEDIA_FIELD_CONFIG.videoUrl.helper}</p>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="schedule">Schedule</label>
                    <input id="schedule" name="schedule" value={listingForm.schedule} onChange={handleListingFieldChange} className="form-input" placeholder="Daily check-in from 3:00 PM" />
                    <p className="mt-2 text-xs text-slate-400">Use this for check-in, check-out, weekday availability, or blackout notes.</p>
                  </div>
                </div>
                <div>
                  <label className="form-label" htmlFor="facilitiesText">Facilities</label>
                  <textarea
                    id="facilitiesText"
                    name="facilitiesText"
                    rows="3"
                    value={listingForm.facilitiesText}
                    onChange={handleListingFieldChange}
                    className="form-input"
                    placeholder="Pool, WiFi, Parking, BBQ Place"
                  />
                  <p className="mt-2 text-xs text-slate-400">Separate facilities with commas so they publish as client-facing tags.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-ice-200 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Hero Preview</div>
                    <img src={getMediaPreview('image') || selectedListing?.image} alt={`${listingForm.name} hero preview`} className="h-28 w-full rounded-xl object-cover" />
                  </div>
                  <div className="rounded-2xl border border-ice-200 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Summary Preview</div>
                    <img src={getMediaPreview('summaryImage') || selectedListing?.summaryImage} alt={`${listingForm.name} summary preview`} className="h-28 w-full rounded-xl object-cover" />
                  </div>
                  <div className="rounded-2xl border border-ice-200 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Thumbnail Preview</div>
                    <img src={getMediaPreview('thumbnail') || selectedListing?.thumbnail} alt={`${listingForm.name} thumbnail preview`} className="h-28 w-full rounded-xl object-cover" />
                  </div>
                  <div className="rounded-2xl border border-ice-200 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Video Preview</div>
                    {getMediaPreview('videoUrl') || selectedListing?.videoUrl ? (
                      <video
                        src={getMediaPreview('videoUrl') || selectedListing?.videoUrl}
                        controls
                        className="h-28 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-xl bg-ice-50 text-xs text-slate-400">
                        No video uploaded
                      </div>
                    )}
                  </div>
                </div>
                {uploadError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {uploadError}
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label" htmlFor="mood">Guest Experience Copy</label>
                    <textarea id="mood" name="mood" rows="3" value={listingForm.mood} onChange={handleListingFieldChange} className="form-input" placeholder="Describe the stay in one persuasive sentence." />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="bestFor">Best For</label>
                    <textarea id="bestFor" name="bestFor" rows="3" value={listingForm.bestFor} onChange={handleListingFieldChange} className="form-input" placeholder="Best for families, couples, team retreats..." />
                  </div>
                </div>
                <div className="rounded-2xl bg-ice-50 p-4 text-sm text-slate-500">
                  Changes here update the public staycation cards and the booking flow because management is now the source of truth for listing content.
                  {isUploadingMedia ? ` Uploading ${MEDIA_FIELD_CONFIG[isUploadingMedia]?.label.toLowerCase()}...` : ''}
                  {!isUploadingMedia && Object.keys(pendingMediaFiles).length ? ' Ready to sync uploaded files on save.' : ''}
                </div>
                <button type="submit" disabled={isSavingListing} className="btn-primary w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60">
                  {isSavingListing ? 'Saving Listing…' : 'Save Listing Update'}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-brand-950">Published Staycation Choices</h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">Client Facing</span>
              </div>
              <div className="space-y-4">
                {listings.map((property) => (
                  <div key={property.id} className="flex items-center gap-4 rounded-2xl border border-ice-200 p-4">
                    <img src={property.thumbnail} alt={property.name} width="80" height="60" loading="lazy" className="h-14 w-20 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-brand-900">{property.name}</div>
                      <div className="text-sm text-slate-500">{property.location}</div>
                      <div className="mt-1 text-xs text-slate-400">{property.amenities.join(' · ')}</div>
                      {property.schedule ? <div className="mt-1 text-xs text-brand-500">{property.schedule}</div> : null}
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
                    <div className="mt-1 text-xs text-brand-600">Owner lead · {application.unitCount} unit(s) · {application.budget}</div>
                  </div>
                ))}
                {reviewSubmissions.slice(0, 3).map((submission) => (
                  <div key={submission.id} className="rounded-2xl border border-ice-200 p-4">
                    <div className="font-semibold text-brand-900">{submission.evaluatorName}</div>
                    <div className="text-sm text-slate-500">{submission.evaluatorAddress}</div>
                    <div className="mt-1 text-xs text-brand-600">Evaluate request · {submission.unitCount} unit(s) · {submission.evaluatorEmail}</div>
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
          <p className="mt-3 text-white/70">Management prepares the properties clients see, while bookings, owner leads, evaluate requests, and triggered emails continue to feed the operating queue.</p>
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
