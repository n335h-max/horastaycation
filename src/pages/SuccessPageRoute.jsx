import { Icon } from '../components/Icon';

const CONTENT = {
  booking: {
    eyebrow: 'Booking Confirmed',
    title: 'Your staycation is reserved.',
    description:
      'Your booking details are locked in. You can return to the dashboard for activity updates or keep exploring new destinations.',
    primaryLabel: 'View Dashboard',
    primaryPage: 'dashboard',
  },
  owner: {
    eyebrow: 'Application Received',
    title: 'Your property application is in review.',
    description:
      'The Hora team has received your details and will follow up after reviewing the submission.',
    primaryLabel: 'View Owner Dashboard',
    primaryPage: 'owner-dashboard',
  },
  review: {
    eyebrow: 'Evaluation Received',
    title: 'Your staycation is now in evaluation.',
    description:
      'The Hora team has received your first staycation details and will review the registration request before management prepares the listing.',
    primaryLabel: 'Back to Home',
    primaryPage: 'landing',
  },
};

export function SuccessPageRoute({ variant, onShowPage, isLoading = false, errorMessage = '' }) {
  const content = CONTENT[variant] ?? CONTENT.booking;
  const eyebrow = isLoading ? 'Confirming Payment' : errorMessage ? 'Payment Check Needed' : content.eyebrow;
  const title = isLoading
    ? 'Verifying your Stripe payment.'
    : errorMessage
      ? 'We could not confirm payment yet.'
      : content.title;
  const description = isLoading
    ? 'Please wait while Hora confirms your Stripe checkout and saves your booking.'
    : errorMessage || content.description;

  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-brand-100 bg-white p-10 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon name={isLoading ? 'calendar' : errorMessage ? 'close' : 'shield'} className="text-3xl" />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">{eyebrow}</p>
        <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">{description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onShowPage(content.primaryPage)}
            className="btn-primary px-7 py-4 text-base"
            disabled={isLoading}
          >
            <span>{content.primaryLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => onShowPage('booking')}
            className="btn-outline px-7 py-4 text-base"
            disabled={isLoading}
          >
            Explore More Stays
          </button>
        </div>
      </div>
    </section>
  );
}
