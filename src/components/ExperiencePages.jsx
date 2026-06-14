import { useMemo, useState } from 'react';
import { FEATURED_PROPERTIES } from '../data/siteData';
import { validateWithSchema, ownerSchema, reviewSchema, loginSchema } from '../lib/validation';
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

function GoogleEntryCard({ title, description, roleLabel, buttonLabel, onContinue }) {
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
      <button type="button" onClick={onContinue} className="btn-primary mt-8 w-full py-4 text-base">
        <span className="inline-flex items-center gap-2">
          {buttonLabel}
          <Icon name="arrow-right" />
        </span>
      </button>
    </div>
  );
}

export function OwnerSignupPage({ onShowPage, onSubmitOwner, isSubmitting }) {
  const [form, setForm] = useState(INITIAL_OWNER_FORM);
  const [errors, setErrors] = useState({});
  const [googleConnected, setGoogleConnected] = useState(false);

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
    setGoogleConnected(false);
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
            onContinue={() => setGoogleConnected(true)}
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

export function ManagementLoginPage({ onShowPage, onLogin, isSubmitting }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(INITIAL_LOGIN_FORM);
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validateWithSchema(loginSchema, form);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onLogin(result.data);
  }

  return (
    <section className="hero-bg min-h-screen px-4 pt-28 md:px-8">
      <div className="mx-auto max-w-md">
        <button type="button" onClick={() => onShowPage('landing')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>
        <form onSubmit={handleSubmit} noValidate className="glass-panel rounded-3xl border border-white/15 bg-brand-950/70 p-8 text-white shadow-2xl">
          <h1 className="font-display text-4xl font-bold">Management Login</h1>
          <p className="mt-3 text-white/70">Sign in to upload staycation photos, videos, facilities, schedules, and every listing detail the client booking flow needs.</p>
          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/80" htmlFor="mgmtEmail">Email</label>
              <input id="mgmtEmail" name="mgmtEmail" type="email" value={form.mgmtEmail} onChange={handleChange} autoComplete="email" className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="admin@horastaycation.com" />
              <FieldError errors={errors} name="mgmtEmail" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/80" htmlFor="mgmtPassword">Password</label>
              <div className="relative">
                <input
                  id="mgmtPassword"
                  name="mgmtPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.mgmtPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder:text-white/40"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} />
                </button>
              </div>
              <FieldError errors={errors} name="mgmtPassword" />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-accent w-full py-4 text-base disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? 'Signing In…' : 'Login to Dashboard'}
            </button>
          </div>
        </form>
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

export function DashboardPage({ bookings, emails, revenue, ownerApplications, reviewSubmissions, onShowPage, formatCurrency }) {
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

  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Operations Dashboard</p>
            <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Management Portal</h1>
          </div>
          <button type="button" onClick={() => onShowPage('landing')} className="btn-outline px-6 py-3 text-sm">
            Return to Site
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <DashboardStat key={stat.id} stat={stat} formatCurrency={formatCurrency} />
          ))}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-ice-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-brand-950">Published Staycation Choices</h2>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">Client Facing</span>
            </div>
            <div className="space-y-4">
              {FEATURED_PROPERTIES.map((property) => (
                <div key={property.id} className="flex items-center gap-4 rounded-2xl border border-ice-200 p-4">
                  <img src={property.thumbnail} alt={property.name} width="80" height="60" loading="lazy" className="h-14 w-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-brand-900">{property.name}</div>
                    <div className="text-sm text-slate-500">{property.location}</div>
                    <div className="mt-1 text-xs text-slate-400">{property.amenities.join(' · ')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-700">{formatCurrency(property.price)}</div>
                    <div className="text-xs text-brand-500">{property.statusNote}</div>
                  </div>
                </div>
              ))}
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
                {ownerApplications.slice(0, 2).map((application) => (
                  <div key={application.id} className="rounded-2xl border border-ice-200 p-4">
                    <div className="font-semibold text-brand-900">{application.ownerName}</div>
                    <div className="text-sm text-slate-500">{application.ownerAddress}</div>
                    <div className="mt-1 text-xs text-brand-600">Owner lead · {application.unitCount} unit(s) · {application.budget}</div>
                  </div>
                ))}
                {reviewSubmissions.slice(0, 2).map((submission) => (
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
