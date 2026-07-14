import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mutable stubs so hoisted vi.mock factories can read/write them.
const stubs = vi.hoisted(() => ({
  stripeCreate: vi.fn(),
  fetchImpl: vi.fn(),
  authUser: { id: 'client-1', email: 'client@example.com' },
}));

// Stub Stripe so no network call happens; capture the session.create args.
vi.mock('./_lib/stripeServer.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getStripeClient: () => ({ checkout: { sessions: { create: stubs.stripeCreate } } }),
  };
});

// Stub auth so the request is treated as authenticated without a real token.
vi.mock('./_lib/auth.js', () => ({
  resolveAuthenticatedUser: async () => ({ ok: true, status: 200, user: stubs.authUser }),
}));

vi.mock('./_lib/rateLimit.js', () => ({ applyRateLimit: () => null }));
vi.mock('./_lib/cors.js', () => ({ handleCors: () => null }));

import handler from './create-checkout-session.js';

/**
 * Regression guard for the full checkout endpoint.
 *
 * Bug: every booking returned HTTP 400 "Booking details are incomplete." even
 * with a fully-filled form, because pricing looked up an empty static array
 * instead of the Supabase management_listings table. This test mocks the
 * Supabase REST fetch (global fetch) to return a published listing and asserts
 * the endpoint creates a Stripe session instead of rejecting the request.
 */

function jsonResponse(body) {
  return { ok: true, status: 200, text: async () => JSON.stringify(body) };
}

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_x';
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  process.env.APP_BASE_URL = 'https://hora.example.com';

  stubs.stripeCreate.mockResolvedValue({ id: 'sess_123', url: 'https://stripe.example/checkout' });

  // Default: Supabase REST returns a published, non-deleted listing for any id.
  stubs.fetchImpl.mockImplementation((url) => {
    if (String(url).includes('/rest/v1/management_listings')) {
      return Promise.resolve(
        jsonResponse([
          {
            id: 'l1',
            name: 'Beach Villa',
            location: 'Port Dickson',
            price: 200,
            publish_status: 'published',
            is_deleted: false,
          },
        ]),
      );
    }
    return Promise.resolve(jsonResponse({}));
  });
  global.fetch = stubs.fetchImpl;
});

describe('create-checkout-session — prices from Supabase listing (not static array)', () => {
  it('creates a Stripe session for a fully-filled booking of a published listing', async () => {
    const bookingForm = {
      property: 'l1',
      checkin: '2026-07-20',
      checkout: '2026-07-23',
      guestEmail: 'client@example.com',
      guestName: 'Client One',
      guests: 2,
    };
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { bookingForm, bookingSummary: { total: 672 } },
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sessionId: 'sess_123', url: 'https://stripe.example/checkout' });
    expect(stubs.stripeCreate).toHaveBeenCalledTimes(1);

    // The unit amount must reflect the Supabase listing price (200/night * 3 nights + 12% fee = 67200 sen).
    const createArgs = stubs.stripeCreate.mock.calls[0][0];
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(67200);
  });

  it('returns 400 with a clear message when the listing is not found / not published', async () => {
    stubs.fetchImpl.mockImplementation(() => Promise.resolve(jsonResponse([])));

    const bookingForm = {
      property: 'missing',
      checkin: '2026-07-20',
      checkout: '2026-07-23',
      guestEmail: 'client@example.com',
    };
    const req = { method: 'POST', headers: { authorization: 'Bearer token' }, body: { bookingForm } };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/no longer available|incomplete/i);
    expect(stubs.stripeCreate).not.toHaveBeenCalled();
  });

  it('returns 400 "Booking details are incomplete." when required form fields are missing', async () => {
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { bookingForm: { property: 'l1' } }, // missing dates + email
    };
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Booking details are incomplete.');
  });
});
