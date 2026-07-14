export const SERVICE_FEE_RATE = 0.12;

/**
 * Compute booking amounts from a resolved listing record and the booking form.
 *
 * `listing` is a management_listings row (or a normalized listing object). It
 * must expose a numeric `price` (> 0). `bookingForm` must provide `checkin` and
 * `checkout` dates with check-out strictly after check-in.
 *
 * Returns { property, nights, subtotal, serviceFee, total } or null when the
 * inputs cannot be priced. Returning null (rather than throwing) lets the
 * caller respond with a clean 400 instead of crashing the request.
 *
 * Why this exists as a pure function: pricing used to be inlined in
 * create-checkout-session.js and looked up the property in a static array that
 * was empty in production, so every booking returned "Booking details are
 * incomplete." Extracting + testing the pure logic guards against that
 * regression.
 */
export function calculateBookingAmounts(listing, bookingForm) {
  if (!listing) return null;

  const nightlyRate = Number(listing.price);
  if (!Number.isFinite(nightlyRate) || nightlyRate <= 0) return null;

  const checkinDate = new Date(bookingForm?.checkin);
  const checkoutDate = new Date(bookingForm?.checkout);
  if (Number.isNaN(checkinDate.getTime()) || Number.isNaN(checkoutDate.getTime())) return null;

  const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(nights) || nights <= 0) return null;

  const subtotal = nights * nightlyRate;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);

  return {
    property: listing,
    nights,
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
  };
}
