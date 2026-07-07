import { useEffect, useMemo, useState } from 'react';
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
  const whatsappBaseUrl = 'https://wa.me/601110629990?text=';
  const wishlistIdSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);
  const locationOptions = useMemo(
    () => [
      'Any location',
      ...new Set([
        ...SEARCH_LOCATIONS.filter((item) => item !== 'Any location'),
        ...properties.map((property) => property.location),
      ]),
    ],
    [properties],
  );
  const searchableProperties = useMemo(
    () =>
      properties.map((property) => ({
        property,
        searchIndex: [property.name, property.location, property.mood, property.bestFor, ...(property.amenities || [])]
          .join(' ')
          .toLowerCase(),
      })),
    [properties],
  );
  const filteredProperties = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return searchableProperties
      .filter(({ property, searchIndex }) => {
        const matchesQuery = !normalizedQuery || searchIndex.includes(normalizedQuery);
        const matchesLocation = selectedLocation === 'Any location' || property.location === selectedLocation;
        const matchesWishlist = !savedOnly || wishlistIdSet.has(property.id);
        const matchesAvailability =
          !bookingForm.checkin ||
          !bookingForm.checkout ||
          !isRangeBlocked(property, bookingForm.checkin, bookingForm.checkout);

        return matchesQuery && matchesLocation && matchesWishlist && matchesAvailability;
      })
      .map(({ property }) => property);
  }, [
    bookingForm.checkin,
    bookingForm.checkout,
    savedOnly,
    searchQuery,
    searchableProperties,
    selectedLocation,
    wishlistIdSet,
  ]);

  function handleWishlistClick(event, propertyId) {
    event.preventDefault();
    event.stopPropagation();
    onToggleWishlist?.(propertyId);
  }

  function getWhatsappEnquiryHref(property) {
    const message = `Hi Hora, I want to ask about ${property.name} in ${property.location}. Can you share availability and booking details?`;
    return `${whatsappBaseUrl}${encodeURIComponent(message)}`;
  }

  function handleQuickEnquiryClick(event, property) {
    event.preventDefault();
    event.stopPropagation();
    window.open(getWhatsappEnquiryHref(property), '_blank', 'noopener,noreferrer');
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

  function handlePropertySelect(propertyId) {
    onBookingChange({
      target: {
        name: 'property',
        value: propertyId,
      },
    });
  }

  const selectedProperty = useMemo(
    () => filteredProperties.find((property) => property.id === bookingForm.property) ?? null,
    [bookingForm.property, filteredProperties],
  );

  useEffect(() => {
    const isCurrentEligible = filteredProperties.some((property) => property.id === bookingForm.property);

    if (isCurrentEligible) {
      return;
    }

    const nextPropertyId = filteredProperties[0]?.id ?? '';

    if ((bookingForm.property || '') === nextPropertyId) {
      return;
    }

    onBookingChange({
      target: {
        name: 'property',
        value: nextPropertyId,
      },
    });
  }, [bookingForm.property, filteredProperties, onBookingChange]);

  return (
    <section className="min-h-screen bg-white px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => onShowPage('landing')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800"
        >
          <Icon name="arrow-right" className="rotate-180" />
          Back to Home
        </button>
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-950 md:text-5xl">Book a Staycation</h1>
          <p className="mt-3 text-lg text-slate-600">
            Pick your perfect escape, choose your dates, and book your stay in minutes.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-5">
            <div className="rounded-[1.2rem] border border-brand-100 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <h2 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">Book Your Staycation</h2>
                  <p className="mt-1.5 text-sm text-slate-500">Pick a property, choose your dates, and check out now.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSavedOnly((current) => !current)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                      savedOnly ? 'bg-brand-600 text-white' : 'bg-ice-100 text-brand-700'
                    }`}
                  >
                    Saved {wishlistIds.length ? `(${wishlistIds.length})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenSupport}
                    className="rounded-full bg-ice-100 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700"
                  >
                    Support
                  </button>
                  {canInstallApp ? (
                    <button
                      type="button"
                      onClick={onInstallApp}
                      className="rounded-full bg-brand-950 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
                    >
                      Install App
                    </button>
                  ) : null}
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.5fr_auto] md:items-end">
                <div>
                  <label className="form-label" htmlFor="searchQuery">
                    Search by name or mood
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
                  <label className="form-label" htmlFor="guests-search">
                    Guests
                  </label>
                  <select
                    id="guests-search"
                    name="guests"
                    value={bookingForm.guests}
                    onChange={onBookingChange}
                    className="form-input"
                  >
                    {GUEST_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-outline px-4 py-2.5 text-sm">
                  Apply
                </button>
              </form>

              <div className="mt-3 text-xs font-medium text-slate-500">
                {filteredProperties.length} active stay option{filteredProperties.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="space-y-3">
              {filteredProperties.map((property) => {
                const isSelected = bookingForm.property === property.id;

                return (
                  <article
                    key={property.id}
                    className={`rounded-[1.2rem] border bg-white shadow-sm transition ${
                      isSelected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-ice-200 hover:border-brand-300'
                    }`}
                  >
                    <div className="grid gap-4 p-4 text-left md:grid-cols-[160px_minmax(0,1fr)_auto]">
                      <button
                        type="button"
                        onClick={() => handlePropertySelect(property.id)}
                        className="overflow-hidden rounded-xl bg-ice-100"
                        aria-label={`Select ${property.name}`}
                      >
                        <img
                          src={property.thumbnail || property.image}
                          alt={property.name}
                          width="320"
                          height="220"
                          loading="lazy"
                          className="h-28 w-full object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePropertySelect(property.id)}
                        className="text-left"
                        aria-label={`Select ${property.name}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            <Icon name="star" className="mr-1 inline" />
                            {property.ratingLabel} ({property.reviewCount})
                          </span>
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                            <Icon name="users" className="mr-1 inline" />
                            {property.guestCapacity} guests
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-brand-950">{property.name}</h3>
                        <p className="text-sm text-slate-500">{property.location}</p>
                        <p className="mt-2 text-sm text-slate-600">&quot;{property.reviewSnippet}&quot;</p>
                      </button>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Per night</p>
                          <p className="text-2xl font-bold text-brand-900">{formatCurrency(property.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => handleWishlistClick(event, property.id)}
                            className={`rounded-full p-2 ${wishlistIdSet.has(property.id) ? 'bg-rose-100 text-rose-600' : 'bg-ice-100 text-slate-400'}`}
                            aria-label={wishlistIdSet.has(property.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                          >
                            <Icon name="heart" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => handleQuickEnquiryClick(event, property)}
                            className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                          >
                            Enquire
                          </button>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isSelected ? 'bg-brand-600 text-white' : 'bg-ice-100 text-slate-500'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Choose'}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {!filteredProperties.length ? (
                <div className="rounded-2xl border border-dashed border-ice-200 bg-white px-4 py-5 text-sm text-slate-500">
                  No stays match this filter set. Try another location or disable saved-only mode.
                </div>
              ) : null}
              {bookingErrors?.property ? <p className="text-sm text-rose-600">{bookingErrors.property[0]}</p> : null}
            </div>
          </div>

          <aside className="h-fit rounded-[1.2rem] border border-ice-200 bg-white p-5 shadow-lg lg:sticky lg:top-24">
            <form onSubmit={onProceedToPayment} className="space-y-5">
              <div className="rounded-2xl bg-brand-950 p-4 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Booking Summary</div>
                {selectedProperty ? (
                  <>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display text-2xl font-bold">{selectedProperty.name}</h2>
                        <p className="text-sm text-white/70">{selectedProperty.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.15em] text-white/60">Rate</p>
                        <p className="text-lg font-bold">{formatCurrency(selectedProperty.price)}</p>
                      </div>
                    </div>
                    <img
                      src={selectedProperty.summaryImage || selectedProperty.image}
                      alt={selectedProperty.name}
                      width="360"
                      height="220"
                      loading="lazy"
                      className="mt-3 h-36 w-full rounded-xl object-cover"
                    />
                  </>
                ) : (
                  <p className="mt-2 text-sm text-white/75">Select a property from the left to start your booking.</p>
                )}
              </div>

              <input type="hidden" name="property" value={bookingForm.property} onChange={onBookingChange} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label" htmlFor="checkin">
                    Check-in
                  </label>
                  <input
                    id="checkin"
                    name="checkin"
                    type="date"
                    value={bookingForm.checkin}
                    onChange={onBookingChange}
                    className={`form-input ${bookingErrors?.checkin ? 'border-rose-400 ring-rose-100' : ''}`}
                    required
                  />
                  {bookingErrors?.checkin ? <p className="mt-1 text-sm text-rose-600">{bookingErrors.checkin[0]}</p> : null}
                </div>
                <div>
                  <label className="form-label" htmlFor="checkout">
                    Check-out
                  </label>
                  <input
                    id="checkout"
                    name="checkout"
                    type="date"
                    value={bookingForm.checkout}
                    onChange={onBookingChange}
                    className={`form-input ${bookingErrors?.checkout ? 'border-rose-400 ring-rose-100' : ''}`}
                    required
                  />
                  {bookingErrors?.checkout ? (
                    <p className="mt-1 text-sm text-rose-600">{bookingErrors.checkout[0]}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="guests">
                  Guests
                </label>
                <select
                  id="guests"
                  name="guests"
                  value={bookingForm.guests}
                  onChange={onBookingChange}
                  className={`form-input ${bookingErrors?.guests ? 'border-rose-400 ring-rose-100' : ''}`}
                  required
                >
                  {GUEST_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {bookingErrors?.guests ? <p className="mt-1 text-sm text-rose-600">{bookingErrors.guests[0]}</p> : null}
              </div>

              <div className="rounded-2xl border border-ice-200 bg-ice-50 p-4">
                {bookingSummary ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {bookingSummary.nights} night{bookingSummary.nights > 1 ? 's' : ''} x{' '}
                        {formatCurrency(bookingSummary.price)}
                      </span>
                      <span className="font-semibold text-brand-900">{formatCurrency(bookingSummary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Service fee</span>
                      <span className="font-semibold text-brand-900">{formatCurrency(bookingSummary.serviceFee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-ice-200 pt-2 text-base font-bold text-brand-950">
                      <span>Total</span>
                      <span>{formatCurrency(bookingSummary.total)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Select valid stay dates to generate your live total breakdown.
                  </p>
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-ice-200 bg-white p-4">
                <h3 className="font-semibold text-brand-950">Guest Details</h3>
                <div>
                  <label className="form-label" htmlFor="guestName">
                    Full Name
                  </label>
                  <input
                    id="guestName"
                    name="guestName"
                    type="text"
                    value={bookingForm.guestName}
                    onChange={onBookingChange}
                    autoComplete="name"
                    className={`form-input ${bookingErrors?.guestName ? 'border-rose-400 ring-rose-100' : ''}`}
                    placeholder="Jane Smith"
                    required
                  />
                  {bookingErrors?.guestName ? <p className="mt-1 text-sm text-rose-600">{bookingErrors.guestName[0]}</p> : null}
                </div>
                <div>
                  <label className="form-label" htmlFor="guestEmail">
                    Email
                  </label>
                  <input
                    id="guestEmail"
                    name="guestEmail"
                    type="email"
                    value={bookingForm.guestEmail}
                    onChange={onBookingChange}
                    autoComplete="email"
                    className={`form-input ${bookingErrors?.guestEmail ? 'border-rose-400 ring-rose-100' : ''}`}
                    placeholder="jane@example.com"
                    required
                  />
                  {bookingErrors?.guestEmail ? (
                    <p className="mt-1 text-sm text-rose-600">{bookingErrors.guestEmail[0]}</p>
                  ) : null}
                </div>
                <div>
                  <label className="form-label" htmlFor="specialRequests">
                    Special Requests
                  </label>
                  <select
                    id="specialRequests"
                    name="specialRequests"
                    value={bookingForm.specialRequests}
                    onChange={onBookingChange}
                    className="form-input"
                  >
                    {SPECIAL_REQUEST_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!googleConnected ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  disabled={isSubmitting || isAuthLoading}
                  className="btn-outline w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sign in as Client to Continue
                </button>
              ) : (
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  Signed in as {authUser?.email || authRole}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !googleConnected}
                className="btn-primary w-full py-3.5 text-base disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Opening secure checkout...' : 'Proceed to Payment'}</span>
              </button>
            </form>
          </aside>
        </div>
      </div>
    </section>
  );
}
