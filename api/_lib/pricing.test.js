import { describe, expect, it } from 'vitest';

import { SERVICE_FEE_RATE, calculateBookingAmounts } from './pricing.js';

/**
 * Regression guards for booking pricing.
 *
 * Bug guarded: api/create-checkout-session.js used to price bookings by looking
 * up the property in the static FEATURED_PROPERTIES array (which is empty), so
 * calculateBookingAmounts always returned null and every booking request failed
 * with HTTP 400 "Booking details are incomplete." — even when the form was fully
 * filled and the listing existed in Supabase.
 *
 * The fix prices against the Supabase management_listings row. These tests pin
 * the pure pricing function: a real listing must price correctly, and invalid
 * inputs must return null rather than throwing or producing wrong amounts.
 */

function makeListing(overrides = {}) {
  return { id: 'l1', name: 'Beach Villa', location: 'Port Dickson', price: 200, ...overrides };
}

describe('calculateBookingAmounts — valid listing prices correctly', () => {
  it('returns amounts for a published listing with valid dates', () => {
    const bookingForm = { property: 'l1', checkin: '2026-07-20', checkout: '2026-07-23', guestEmail: 'c@e.com' };
    const listing = makeListing();
    const result = calculateBookingAmounts(listing, bookingForm);

    expect(result).not.toBeNull();
    expect(result.nights).toBe(3);
    expect(result.subtotal).toBe(600); // 3 * 200
    expect(result.serviceFee).toBe(Math.round(600 * SERVICE_FEE_RATE)); // 72
    expect(result.total).toBe(672);
    expect(result.property).toBe(listing); // listing is threaded through
  });

  it('handles single-night stays', () => {
    const result = calculateBookingAmounts(makeListing({ price: 100 }), {
      checkin: '2026-07-20',
      checkout: '2026-07-21',
    });
    expect(result.nights).toBe(1);
    expect(result.subtotal).toBe(100);
    expect(result.total).toBe(100 + Math.round(100 * SERVICE_FEE_RATE));
  });
});

describe('calculateBookingAmounts — returns null for invalid input (no crash)', () => {
  it('returns null when the listing is null (the old bug path)', () => {
    // Regression: with the empty static lookup, the listing was always null and
    // pricing always failed. Now null listing => null pricing, handled cleanly.
    expect(calculateBookingAmounts(null, { checkin: '2026-07-20', checkout: '2026-07-22' })).toBeNull();
  });

  it('returns null when price is missing, zero, or non-numeric', () => {
    const form = { checkin: '2026-07-20', checkout: '2026-07-22' };
    expect(calculateBookingAmounts(makeListing({ price: 0 }), form)).toBeNull();
    expect(calculateBookingAmounts(makeListing({ price: -5 }), form)).toBeNull();
    expect(calculateBookingAmounts(makeListing({ price: 'free' }), form)).toBeNull();
    expect(calculateBookingAmounts(makeListing({ price: undefined }), form)).toBeNull();
  });

  it('returns null when check-in is not before check-out', () => {
    const listing = makeListing();
    expect(calculateBookingAmounts(listing, { checkin: '2026-07-22', checkout: '2026-07-22' })).toBeNull();
    expect(calculateBookingAmounts(listing, { checkin: '2026-07-23', checkout: '2026-07-20' })).toBeNull();
  });

  it('returns null when dates are missing or unparseable', () => {
    const listing = makeListing();
    expect(calculateBookingAmounts(listing, {})).toBeNull();
    expect(calculateBookingAmounts(listing, { checkin: 'not-a-date', checkout: '2026-07-22' })).toBeNull();
  });
});
