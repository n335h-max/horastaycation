import { describe, it, expect } from 'vitest';
import { bookingSchema } from '../lib/validation';

/**
 * Regression guards for the guest-count input change.
 *
 * Bug context: the guests field was a fixed dropdown (1..4). It is now a number
 * input so customers can enter any count up to the property's capacity.
 * Validation must reject empty, non-numeric, zero, and negative values, and
 * must NOT impose the old hard cap of 4 (capacity is enforced elsewhere).
 */

function validBase(overrides = {}) {
  return {
    property: 'villa-serena',
    checkin: '2026-08-01',
    checkout: '2026-08-03',
    guests: '2',
    guestName: 'Jane Doe',
    guestEmail: 'jane@example.com',
    guestPhone: '+60123456789',
    specialRequests: '',
    ...overrides,
  };
}

describe('bookingSchema — guest count (number input, no hard cap)', () => {
  it('accepts a positive integer guest count', () => {
    expect(bookingSchema.safeParse(validBase({ guests: '3' })).success).toBe(true);
  });

  it('accepts counts above the old dropdown cap of 4', () => {
    expect(bookingSchema.safeParse(validBase({ guests: '6' })).success).toBe(true);
    expect(bookingSchema.safeParse(validBase({ guests: '12' })).success).toBe(true);
  });

  it('rejects an empty guest count', () => {
    const result = bookingSchema.safeParse(validBase({ guests: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects zero guests', () => {
    const result = bookingSchema.safeParse(validBase({ guests: '0' }));
    expect(result.success).toBe(false);
  });

  it('rejects negative guests', () => {
    const result = bookingSchema.safeParse(validBase({ guests: '-2' }));
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric input', () => {
    const result = bookingSchema.safeParse(validBase({ guests: 'abc' }));
    expect(result.success).toBe(false);
  });
});
