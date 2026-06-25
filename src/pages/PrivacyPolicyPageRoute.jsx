const POLICY_SECTIONS = [
  {
    title: 'What We Collect',
    body: 'We collect booking details, contact information, account profile data, and property-owner submissions needed to deliver Hora Staycation services. Payment forms are used only for checkout flow completion and we only retain limited transaction references required for booking records.',
  },
  {
    title: 'How We Use Data',
    body: 'Personal data is used to confirm reservations, coordinate owner and management reviews, provide customer support, prevent abuse, and meet legal or operational obligations connected to the staycation platform.',
  },
  {
    title: 'Cookies And Local Storage',
    body: 'Essential cookies and local storage keep you signed in, remember booking progress, and store your privacy preferences. Optional analytics or personalization technologies remain disabled unless you explicitly consent through the cookie banner.',
  },
  {
    title: 'GDPR And PDPA Rights',
    body: 'Guests, owners, and partners may request access, correction, deletion, restriction, or export of personal data where applicable under GDPR and Malaysia PDPA. We also honor consent withdrawal requests for any optional processing tied to cookies or marketing.',
  },
  {
    title: 'Retention',
    body: 'We keep personal data only as long as necessary for bookings, account administration, owner onboarding, dispute handling, and legal recordkeeping. Draft information stored in your browser can be cleared by using your browser storage controls or cookie settings.',
  },
  {
    title: 'Security Controls',
    body: 'Production traffic must be served over HTTPS to encrypt data in transit. Booking and profile records are intended to be stored in Supabase/Postgres with provider-managed encryption at rest, scoped access controls, and audited management access.',
  },
];

export function PrivacyPolicyPageRoute({ onShowPage, onManageCookies }) {
  const privacyContactEmail = import.meta.env.VITE_PRIVACY_CONTACT_EMAIL || 'privacy@horastaycation.com';

  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-brand-100 bg-white p-8 shadow-xl md:p-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">Privacy And Compliance</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-brand-950 md:text-5xl">
            GDPR and PDPA Privacy Policy
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Hora Staycation protects personal data for guests, owners, and management users in line with GDPR and
            Malaysia&apos;s Personal Data Protection Act. This page explains what we collect, why we collect it, and how
            consent and security controls are handled across the platform.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-brand-950 p-6 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Data In Transit</p>
            <p className="mt-3 text-2xl font-bold">HTTPS Required</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              Sensitive pages, authentication, and booking traffic should be delivered only over encrypted HTTPS
              connections in production.
            </p>
          </div>
          <div className="rounded-3xl bg-brand-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Data At Rest</p>
            <p className="mt-3 text-2xl font-bold text-brand-950">Database Encryption</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Customer and owner records are intended for encrypted database storage with access controls limited to
              approved operational roles.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5">
          {POLICY_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-3xl border border-ice-200 bg-ice-50 p-6">
              <h2 className="font-display text-2xl font-bold text-brand-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-brand-950">Contact And Consent</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            For privacy requests, contact{' '}
            <a className="font-semibold text-brand-700 hover:text-brand-900" href={`mailto:${privacyContactEmail}`}>
              {privacyContactEmail}
            </a>
            . You can review or update cookie preferences at any time from this page.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button type="button" onClick={onManageCookies} className="btn-outline px-6 py-3 text-sm">
              Manage Cookies
            </button>
            <button type="button" onClick={() => onShowPage('landing')} className="btn-primary px-6 py-3 text-sm">
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
