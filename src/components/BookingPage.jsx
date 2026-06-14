import { useState } from 'react';
import { FEATURED_PROPERTIES, GUEST_OPTIONS } from '../data/siteData';
import { Icon } from './Icon';

export function BookingPage({
  bookingForm,
  bookingErrors,
  isSubmitting,
  onBookingChange,
  onShowPage,
  onProceedToPayment,
  bookingSummary,
  formatCurrency,
  formatDate,
}) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const steps = [
    { number: '01', label: 'Google Client Sign-In' },
    { number: '02', label: 'Browse Staycations' },
    { number: '03', label: 'Guest & Stay Details' },
    { number: '04', label: 'Payment' },
  ];

  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => onShowPage('landing')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800">
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Book Your Staycation</h1>
          <p className="mt-3 text-lg text-slate-600">This client flow starts with Google sign-in, then lets the guest browse placeholder staycations and book with a Booking.com or Airbnb-style structure.</p>
        </div>

        <div className="mb-8 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-display text-sm font-bold ${
                  index < 3 ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'
                }`}>
                  {step.number}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Step</div>
                  <div className="font-medium text-brand-950">{step.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-ice-200 bg-white p-4 shadow-sm">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name="shield" />
            </div>
            <div className="font-semibold text-brand-950">Secure Checkout</div>
            <p className="mt-1 text-sm text-slate-500">Encrypted payment flow with clear totals before confirmation.</p>
          </div>
          <div className="rounded-2xl border border-ice-200 bg-white p-4 shadow-sm">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name="calendar" />
            </div>
            <div className="font-semibold text-brand-950">Flexible Cancellation</div>
            <p className="mt-1 text-sm text-slate-500">Most stays allow free cancellation up to 48 hours before arrival.</p>
          </div>
          <div className="rounded-2xl border border-ice-200 bg-white p-4 shadow-sm">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name="star" />
            </div>
            <div className="font-semibold text-brand-950">Placeholder Stays</div>
            <p className="mt-1 text-sm text-slate-500">Use these sample staycations for now, then replace them with the real options later.</p>
          </div>
        </div>

        {!googleConnected ? (
          <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-lg">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              <Icon name="lock" />
              Client Role
            </div>
            <h2 className="font-display text-3xl font-bold text-brand-950">Sign in as Client</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">After the guest continues with Google, the booking flow opens and they can browse the staycation choices below as a client.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {FEATURED_PROPERTIES.map((property) => (
                <div key={property.id} className="rounded-2xl border border-ice-200 bg-ice-50 p-4">
                  <div className="text-sm font-semibold text-brand-900">{property.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{property.location}</div>
                  <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
                    {property.statusNote}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setGoogleConnected(true)} className="btn-primary mt-8 w-full py-4 text-base">
              <span className="inline-flex items-center gap-2">
                Continue With Google as Client
                <Icon name="arrow-right" />
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.8fr]">
              <form className="space-y-6" onSubmit={onProceedToPayment}>
                <div className="rounded-2xl border border-ice-200 bg-white p-6 shadow-md">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white">
                    <Icon name="lock" />
                    Signed in as Client
                  </div>
                  <h2 className="mb-4 font-display text-xl font-bold text-brand-900">Browse Staycation Choices</h2>
                  <p className="mb-5 text-sm text-slate-500">These are placeholder choices for now. Later you can replace them with your real staycation listings.</p>
                  <div className="space-y-4">
                    {FEATURED_PROPERTIES.map((property) => (
                      <label
                        key={property.id}
                        className={`property-option flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-colors ${
                          bookingForm.property === property.id ? 'border-brand-500 bg-brand-50/50' : 'border-ice-200 hover:border-brand-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="property"
                          value={property.id}
                          checked={bookingForm.property === property.id}
                          onChange={onBookingChange}
                          className="h-5 w-5 accent-brand-600"
                          required
                        />
                        <img
                          src={property.thumbnail}
                          alt={property.name}
                          width="80"
                          height="60"
                          loading="lazy"
                          className="h-14 w-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-brand-900">{property.name}</div>
                          <div className="text-sm text-slate-500">{property.location}</div>
                          <div className="mt-1 text-xs font-semibold text-brand-600">{property.statusNote}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-brand-700">{formatCurrency(property.price)}</div>
                          <div className="text-xs text-slate-400">/night</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {bookingErrors?.property ? <p className="mt-3 text-sm text-rose-600">{bookingErrors.property[0]}</p> : null}
                </div>

                <div className="rounded-2xl border border-ice-200 bg-white p-6 shadow-md">
                  <h2 className="mb-4 font-display text-xl font-bold text-brand-900">Date of Staying</h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="form-label" htmlFor="checkin">
                        Check-in Date
                      </label>
                      <input id="checkin" name="checkin" type="date" value={bookingForm.checkin} onChange={onBookingChange} className={`form-input ${bookingErrors?.checkin ? 'border-rose-400 ring-rose-100' : ''}`} required />
                      <p className="mt-2 text-xs text-slate-400">Typical check-in starts at 3:00 PM.</p>
                      {bookingErrors?.checkin ? <p className="mt-2 text-sm text-rose-600">{bookingErrors.checkin[0]}</p> : null}
                    </div>
                    <div>
                      <label className="form-label" htmlFor="checkout">
                        Check-out Date
                      </label>
                      <input id="checkout" name="checkout" type="date" value={bookingForm.checkout} onChange={onBookingChange} className={`form-input ${bookingErrors?.checkout ? 'border-rose-400 ring-rose-100' : ''}`} required />
                      <p className="mt-2 text-xs text-slate-400">Choose a later date to unlock the full price summary.</p>
                      {bookingErrors?.checkout ? <p className="mt-2 text-sm text-rose-600">{bookingErrors.checkout[0]}</p> : null}
                    </div>
                    <div>
                      <label className="form-label" htmlFor="guests">
                        Guests
                      </label>
                      <select id="guests" name="guests" value={bookingForm.guests} onChange={onBookingChange} className={`form-input ${bookingErrors?.guests ? 'border-rose-400 ring-rose-100' : ''}`} required>
                        {GUEST_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {bookingErrors?.guests ? <p className="mt-2 text-sm text-rose-600">{bookingErrors.guests[0]}</p> : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-ice-200 bg-white p-6 shadow-md">
                  <h2 className="mb-4 font-display text-xl font-bold text-brand-900">Client Details</h2>
                  <p className="mb-4 text-sm text-slate-500">This form keeps the details simple: name, email, and stay information first. You can add special requests if needed.</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="form-label" htmlFor="guestName">
                        Full Name
                      </label>
                      <input id="guestName" name="guestName" type="text" value={bookingForm.guestName} onChange={onBookingChange} autoComplete="name" className={`form-input ${bookingErrors?.guestName ? 'border-rose-400 ring-rose-100' : ''}`} placeholder="Jane Smith" required />
                      {bookingErrors?.guestName ? <p className="mt-2 text-sm text-rose-600">{bookingErrors.guestName[0]}</p> : null}
                    </div>
                    <div>
                      <label className="form-label" htmlFor="guestEmail">
                        Email
                      </label>
                      <input id="guestEmail" name="guestEmail" type="email" value={bookingForm.guestEmail} onChange={onBookingChange} autoComplete="email" className={`form-input ${bookingErrors?.guestEmail ? 'border-rose-400 ring-rose-100' : ''}`} placeholder="jane@example.com" required />
                      {bookingErrors?.guestEmail ? <p className="mt-2 text-sm text-rose-600">{bookingErrors.guestEmail[0]}</p> : null}
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label" htmlFor="specialRequests">
                        Special Requests
                      </label>
                      <input id="specialRequests" name="specialRequests" type="text" value={bookingForm.specialRequests} onChange={onBookingChange} className="form-input" placeholder="Airport pickup, early check-in, room preference, etc." />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
                  <span>{isSubmitting ? 'Opening secure checkout…' : 'Proceed to Payment'}</span>
                </button>
              </form>

              <aside className="h-fit rounded-2xl border border-ice-200 bg-white p-6 shadow-md lg:sticky lg:top-28">
                <h2 className="mb-4 font-display text-xl font-bold text-brand-900">Booking Summary</h2>
                {bookingSummary ? (
                  <div>
                    <img
                      src={bookingSummary.image}
                      alt={bookingSummary.name}
                      width="400"
                      height="200"
                      loading="lazy"
                      className="mb-4 h-32 w-full rounded-xl object-cover"
                    />
                    <h3 className="font-semibold text-brand-900">{bookingSummary.name}</h3>
                    <p className="mb-4 text-sm text-slate-500">
                      {formatDate(bookingSummary.checkin)} — {formatDate(bookingSummary.checkout)}
                    </p>
                    <div className="mb-4 rounded-xl bg-ice-50 px-4 py-3 text-sm text-slate-600">
                      <span className="font-semibold text-brand-900">{bookingSummary.nights} night{bookingSummary.nights > 1 ? 's' : ''}</span> selected with placeholder pricing and booking details shown below.
                    </div>
                    <div className="space-y-2 border-t border-ice-200 pt-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          {formatCurrency(bookingSummary.price)} x {bookingSummary.nights} night(s)
                        </span>
                        <span className="font-medium">{formatCurrency(bookingSummary.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service fee</span>
                        <span className="font-medium">{formatCurrency(bookingSummary.serviceFee)}</span>
                      </div>
                      <div className="flex justify-between border-t border-ice-200 pt-2">
                        <span className="font-bold text-brand-900">Total</span>
                        <span className="text-lg font-bold text-brand-700">{formatCurrency(bookingSummary.total)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
                      <Icon name="shield" />
                      <span>Free cancellation up to 48h before check-in</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">Select a property and dates to see your summary.</p>
                )}
              </aside>
            </div>

            {bookingSummary ? (
              <div className="fixed inset-x-4 bottom-4 z-30 rounded-2xl border border-brand-200 bg-white/96 p-4 shadow-2xl backdrop-blur-sm lg:hidden">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current total</div>
                    <div className="text-lg font-bold text-brand-900">{formatCurrency(bookingSummary.total)}</div>
                    <div className="text-sm text-slate-500">{bookingSummary.nights} night{bookingSummary.nights > 1 ? 's' : ''} · {bookingSummary.name}</div>
                  </div>
                  <button type="button" onClick={onProceedToPayment} disabled={isSubmitting} className="btn-primary px-5 py-3 text-sm disabled:opacity-60">
                    <span>{isSubmitting ? 'Please wait…' : 'Continue'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
