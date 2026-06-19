import { useMemo, useState } from 'react';
import { FEATURED_PROPERTIES, GUEST_OPTIONS, SEARCH_LOCATIONS, SPECIAL_REQUEST_OPTIONS } from '../data/siteData';
import { isRangeBlocked } from '../lib/guestFeatures';
import { Icon } from './Icon';

export function BookingPage({
  properties = FEATURED_PROPERTIES,
  bookingForm,
  bookingErrors,
  isSubmitting,
  onBookingChange,
  onShowPage,
  onProceedToPayment,
  bookingSummary,
  formatCurrency,
  formatDate,
  authUser,
  authRole,
  availableRoles = ['client'],
  isAuthLoading,
  onOpenAuth,
  wishlistIds = [],
  onToggleWishlist,
  onSearch,
  onOpenSupport,
  canInstallApp,
  onInstallApp,
}) {
  const googleConnected = Boolean(authUser && availableRoles.includes('client'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Any location');
  const [savedOnly, setSavedOnly] = useState(false);
  const steps = [
    { number: '01', label: 'Unified Sign-In' },
    { number: '02', label: 'Browse Staycations' },
    { number: '03', label: 'Guest & Stay Details' },
    { number: '04', label: 'Payment' },
  ];
  const locationOptions = useMemo(
    () => ['Any location', ...new Set([...SEARCH_LOCATIONS.filter((item) => item !== 'Any location'), ...properties.map((property) => property.location)])],
    [properties],
  );
  const filteredProperties = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return properties.filter((property) => {
      const matchesQuery = !normalizedQuery || [
        property.name,
        property.location,
        property.mood,
        property.bestFor,
        ...(property.amenities || []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesLocation = selectedLocation === 'Any location' || property.location === selectedLocation;
      const matchesWishlist = !savedOnly || wishlistIds.includes(property.id);
      const matchesAvailability =
        !bookingForm.checkin ||
        !bookingForm.checkout ||
        !isRangeBlocked(property, bookingForm.checkin, bookingForm.checkout);

      return matchesQuery && matchesLocation && matchesWishlist && matchesAvailability;
    });
  }, [bookingForm.checkin, bookingForm.checkout, properties, savedOnly, searchQuery, selectedLocation, wishlistIds]);

  function handleWishlistClick(event, propertyId) {
    event.preventDefault();
    event.stopPropagation();
    onToggleWishlist?.(propertyId);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    onSearch?.({
      query: searchQuery.trim(),
      location: selectedLocation,
      checkin: bookingForm.checkin,
      checkout: bookingForm.checkout,
      guests: bookingForm.guests,
      resultCount: filteredProperties.length,
    });
  }

  return (
    <section className="min-h-screen bg-ice-50 px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => onShowPage('landing')} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800">
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>

        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Book Your Staycation</h1>
          <p className="mt-3 text-lg text-slate-600">Sign in once, switch to the client role, then browse staycations and complete the booking flow without juggling separate login entry points.</p>
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

        <form onSubmit={handleSearchSubmit} className="mb-8 rounded-[2rem] border border-brand-100 bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
                <Icon name="search" />
                Smart Search
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold text-brand-950">Search before you decide</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
                Filter by keyword, location, and stay dates, then save favorites to your wishlist or book right away.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSavedOnly((current) => !current)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  savedOnly ? 'bg-brand-600 text-white' : 'bg-ice-50 text-brand-700'
                }`}
              >
                Saved only {wishlistIds.length ? `(${wishlistIds.length})` : ''}
              </button>
              <button type="button" onClick={onOpenSupport} className="rounded-full bg-ice-50 px-4 py-2 text-sm font-semibold text-brand-700">
                Ask support
              </button>
              {canInstallApp ? (
                <button type="button" onClick={onInstallApp} className="rounded-full bg-brand-950 px-4 py-2 text-sm font-semibold text-white">
                  Install app
                </button>
              ) : (
                <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Mobile-ready PWA
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="form-label" htmlFor="searchQuery">
                Search staycation
              </label>
              <input
                id="searchQuery"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="form-input"
                placeholder="Search by property name, mood, or amenity"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="searchLocation">
                Location
              </label>
              <select
                id="searchLocation"
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                className="form-input"
              >
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="checkin-search">
                Check-in
              </label>
              <input
                id="checkin-search"
                name="checkin"
                type="date"
                value={bookingForm.checkin}
                onChange={onBookingChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="checkout-search">
                Check-out
              </label>
              <input
                id="checkout-search"
                name="checkout"
                type="date"
                value={bookingForm.checkout}
                onChange={onBookingChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="form-label" htmlFor="guests-search">
                Guests
              </label>
              <select id="guests-search" name="guests" value={bookingForm.guests} onChange={onBookingChange} className="form-input">
                {GUEST_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary px-6 py-3 text-sm md:w-auto">
              <span className="inline-flex items-center gap-2">
                Search stays
                <Icon name="arrow-right" />
              </span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-ice-50 px-3 py-2 font-semibold text-brand-700">
              {filteredProperties.length} match{filteredProperties.length === 1 ? '' : 'es'}
            </span>
            {bookingForm.checkin && bookingForm.checkout ? (
              <span className="rounded-full bg-ice-50 px-3 py-2">
                Availability is filtered for {formatDate(bookingForm.checkin)} to {formatDate(bookingForm.checkout)}
              </span>
            ) : null}
          </div>
        </form>

        {!googleConnected ? (
          <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-lg">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              <Icon name="lock" />
              Client Role
            </div>
            <h2 className="font-display text-3xl font-bold text-brand-950">Sign in as Client</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">Use the unified login to choose the client role. Hora remembers your session and sends you straight back to listings after Google sign-in.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {filteredProperties.map((property) => (
                <div key={property.id} className="rounded-2xl border border-ice-200 bg-ice-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-brand-900">{property.name}</div>
                    <button
                      type="button"
                      onClick={(event) => handleWishlistClick(event, property.id)}
                      className={`rounded-full p-2 ${wishlistIds.includes(property.id) ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-400'}`}
                      aria-label={wishlistIds.includes(property.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Icon name="heart" />
                    </button>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{property.location}</div>
                  <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
                    {property.statusNote}
                  </div>
                </div>
              ))}
            </div>
            {!filteredProperties.length ? (
              <div className="mt-6 rounded-2xl border border-dashed border-ice-200 bg-ice-50 px-4 py-5 text-sm text-slate-500">
                No stays match these filters yet. Adjust the search, open support, or save a different favorite on this device.
              </div>
            ) : null}
            {authUser?.email ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Signed in as {authUser.email}
              </div>
            ) : null}
            <button type="button" onClick={onOpenAuth} disabled={isSubmitting || isAuthLoading} className="btn-primary mt-8 w-full py-4 text-base disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
              <span className="inline-flex items-center gap-2">
                {isSubmitting || isAuthLoading ? 'Opening unified sign-in...' : 'Continue to Unified Sign-In'}
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
                    Active role: {authRole.charAt(0).toUpperCase() + authRole.slice(1)}
                  </div>
                  <h2 className="mb-4 font-display text-xl font-bold text-brand-900">Browse Staycation Choices</h2>
                  <p className="mb-5 text-sm text-slate-500">These are placeholder choices for now. Later you can replace them with your real staycation listings.</p>
                  <div className="space-y-4">
                    {filteredProperties.map((property) => (
                      <label
                        key={property.id}
                        className={`property-option flex cursor-pointer flex-col gap-4 rounded-xl border-2 p-4 transition-colors sm:flex-row sm:items-center ${
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
                        <div className="flex-1 self-start sm:self-auto">
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-semibold text-brand-900">{property.name}</div>
                            <button
                              type="button"
                              onClick={(event) => handleWishlistClick(event, property.id)}
                              className={`rounded-full p-2 ${wishlistIds.includes(property.id) ? 'bg-rose-100 text-rose-600' : 'bg-ice-50 text-slate-400'}`}
                              aria-label={wishlistIds.includes(property.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                            >
                              <Icon name="heart" />
                            </button>
                          </div>
                          <div className="text-sm text-slate-500">{property.location}</div>
                          <div className="mt-1 text-xs font-semibold text-brand-600">{property.statusNote}</div>
                          {property.schedule ? <div className="mt-1 text-xs text-slate-400">{property.schedule}</div> : null}
                          {property.videoUrl ? <div className="mt-1 text-xs text-brand-500">Video walkthrough available</div> : null}
                        </div>
                        <div className="self-start text-left sm:self-auto sm:text-right">
                          <div className="font-bold text-brand-700">{formatCurrency(property.price)}</div>
                          <div className="text-xs text-slate-400">/night</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {!filteredProperties.length ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-ice-200 bg-ice-50 px-4 py-5 text-sm text-slate-500">
                      No published properties match this search. Try a different location, remove the saved-only filter, or ask support for help choosing a stay.
                    </div>
                  ) : null}
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
                  <p className="mb-4 text-sm text-slate-500">This form keeps typing light on mobile by using quick-select options wherever possible.</p>
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
                      <select id="specialRequests" name="specialRequests" value={bookingForm.specialRequests} onChange={onBookingChange} className="form-input">
                        {SPECIAL_REQUEST_OPTIONS.map((option) => (
                          <option key={option.label} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-slate-400">Choose a common request without needing to type on mobile.</p>
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
