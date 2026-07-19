import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';

// U-3: Confetti particle config — pure CSS, no library
const CONFETTI_COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const CONFETTI_COUNT = 48;

function ConfettiParticle({ color, style }) {
  return (
    <span
      aria-hidden="true"
      className="confetti-particle pointer-events-none absolute block rounded-sm"
      style={{ background: color, ...style }}
    />
  );
}

function ConfettiBurst() {
  const particles = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    duration: `${0.8 + Math.random() * 0.8}s`,
    width: `${6 + Math.random() * 7}px`,
    height: `${10 + Math.random() * 6}px`,
    rotate: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <ConfettiParticle
          key={p.id}
          color={p.color}
          style={{
            left: p.left,
            top: '-12px',
            width: p.width,
            height: p.height,
            transform: `rotate(${p.rotate})`,
            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

const CONTENT = {
  booking: {
    eyebrow: 'Booking Confirmed',
    title: 'Your staycation is reserved.',
    description:
      'Your booking details are locked in. You can head back home or keep exploring new destinations.',
    primaryLabel: 'Back to Home',
    primaryPage: 'landing',
    showConfetti: true,
  },
  owner: {
    eyebrow: 'Application Received',
    title: 'Your property application is in review.',
    description: 'The Hora team has received your details and will follow up after reviewing the submission.',
    primaryLabel: 'View Owner Dashboard',
    primaryPage: 'owner-dashboard',
    showConfetti: false,
  },
  review: {
    eyebrow: 'Evaluation Received',
    title: 'Your staycation is now in evaluation.',
    description:
      'The Hora team has received your first staycation details and will review the registration request before management prepares the listing.',
    primaryLabel: 'Back to Home',
    primaryPage: 'landing',
    showConfetti: false,
  },
};

export function SuccessPageRoute({
  variant,
  onShowPage,
  isLoading = false,
  errorMessage = '',
  bookingTransactions = [],
}) {
  const content = CONTENT[variant];
  const [showConfetti, setShowConfetti] = useState(false);

  // U-3: trigger confetti burst once on mount for booking success
  useEffect(() => {
    if (content?.showConfetti && !isLoading && !errorMessage) {
      const timer = setTimeout(() => setShowConfetti(true), 120);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [content?.showConfetti, isLoading, errorMessage]);

  const latestBooking = bookingTransactions[bookingTransactions.length - 1] ?? null;

  if (!content) {
    return (
      <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-brand-100 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Icon name="close" className="text-3xl" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-500">Invalid Success View</p>
          <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">This result page is unavailable.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            We could not determine which success flow to show. Please return home and retry.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button type="button" onClick={() => onShowPage('landing')} className="btn-primary px-7 py-4 text-base">
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

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
    <section className="relative min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      {showConfetti && <ConfettiBurst />}

      <div className="mx-auto max-w-3xl rounded-[2rem] border border-brand-100 bg-white p-10 text-center shadow-xl">
        <div
          className={`mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full ${
            errorMessage ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
          }`}
        >
          <Icon name={isLoading ? 'calendar' : errorMessage ? 'close' : 'shield'} className="text-3xl" />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">{eyebrow}</p>
        <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">{description}</p>

        {/* U-3: Booking recap — show property + dates so user can verify what they just paid for */}
        {variant === 'booking' && !isLoading && !errorMessage && latestBooking?.bookingSummary ? (
          <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-brand-100 bg-ice-50 p-5 text-left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Your Booking</p>
            <div className="space-y-1.5 text-sm text-slate-700">
              {latestBooking.bookingForm?.property ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Property</span>
                  <span className="font-semibold capitalize">{latestBooking.bookingForm.property.replace(/-/g, ' ')}</span>
                </div>
              ) : null}
              {latestBooking.bookingForm?.checkin ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-in</span>
                  <span className="font-semibold">{latestBooking.bookingForm.checkin}</span>
                </div>
              ) : null}
              {latestBooking.bookingForm?.checkout ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-out</span>
                  <span className="font-semibold">{latestBooking.bookingForm.checkout}</span>
                </div>
              ) : null}
              {latestBooking.bookingSummary?.nights ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Nights</span>
                  <span className="font-semibold">{latestBooking.bookingSummary.nights}</span>
                </div>
              ) : null}
              {latestBooking.bookingSummary?.total ? (
                <div className="flex justify-between border-t border-brand-100 pt-2 text-base font-bold text-brand-950">
                  <span>Total Paid</span>
                  <span>
                    RM {Number(latestBooking.bookingSummary.total).toLocaleString('en-MY', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

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
