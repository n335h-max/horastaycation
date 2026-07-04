/* global process */
import { beforeEach, expect, it, vi } from 'vitest';

const getJsonBodyMock = vi.fn();
const getStripeClientMock = vi.fn();
const resolveAuthenticatedUserMock = vi.fn();
const resendSendMock = vi.fn();

vi.mock('../../api/_lib/stripeServer.js', () => ({
  getJsonBody: getJsonBodyMock,
  getStripeClient: getStripeClientMock,
}));

vi.mock('../../api/_lib/auth.js', () => ({
  resolveAuthenticatedUser: resolveAuthenticatedUserMock,
}));

vi.mock('../../api/_lib/resendServer.js', () => ({
  getResendClient: vi.fn(() => ({
    emails: {
      send: resendSendMock,
    },
  })),
  getFromEmail: vi.fn(() => 'no-reply@example.com'),
  getManagementEmail: vi.fn(() => 'admin@example.com'),
}));

const [{ FEATURED_PROPERTIES }, createCheckoutSessionModule, sendEmailModule] = await Promise.all([
  import('../data/siteData.js'),
  import('../../api/create-checkout-session.js'),
  import('../../api/send-email.js'),
]);

const createCheckoutSessionHandler = createCheckoutSessionModule.default;
const sendEmailHandler = sendEmailModule.default;

function createResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_BASE_URL = 'https://horastaycation.test';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.STRIPE_CURRENCY = 'myr';
  process.env.RESEND_API_KEY = 're_test_123';

  resolveAuthenticatedUserMock.mockResolvedValue({
    ok: true,
    user: { id: 'user_123', email: 'guest@example.com' },
  });
});

it('calculates checkout amount from server-side property pricing', async () => {
  const stripeCreateMock = vi.fn().mockResolvedValue({ id: 'cs_test_123', url: 'https://stripe.test/session' });
  getStripeClientMock.mockReturnValue({
    checkout: {
      sessions: {
        create: stripeCreateMock,
      },
    },
  });

  getJsonBodyMock.mockReturnValue({
    bookingForm: {
      property: FEATURED_PROPERTIES[0].id,
      checkin: '2026-07-01',
      checkout: '2026-07-03',
      guestEmail: 'guest@example.com',
      guestName: 'Test Guest',
      guests: '2',
    },
    bookingSummary: {
      name: FEATURED_PROPERTIES[0].name,
      location: FEATURED_PROPERTIES[0].location,
      nights: 2,
      total: 1,
    },
  });

  const req = {
    method: 'POST',
    headers: {
      'idempotency-key': 'abc123',
    },
  };
  const res = createResponse();

  await createCheckoutSessionHandler(req, res);

  expect(res.statusCode).toBe(200);
  expect(stripeCreateMock).toHaveBeenCalledTimes(1);

  const [payload] = stripeCreateMock.mock.calls[0];
  expect(payload.line_items[0].price_data.unit_amount).toBe(200);
  expect(payload.metadata.total).toBe('2');
  expect(payload.metadata.propertyName).toBe(FEATURED_PROPERTIES[0].name);
});

it('rejects cross-origin email requests and owner relay overrides', async () => {
  getJsonBodyMock.mockReturnValue({
    type: 'owner_booking_alert',
    data: {
      propertyName: 'Demo Stay',
      ownerEmail: 'owner@example.com',
    },
    to: 'attacker@example.com',
  });

  const req = {
    method: 'POST',
    headers: {
      origin: 'https://evil.example.com',
    },
    socket: {
      remoteAddress: '127.0.0.1',
    },
  };
  const res = createResponse();

  await sendEmailHandler(req, res);

  expect(res.statusCode).toBe(403);
  expect(res.body).toEqual({ error: 'Cross-origin email requests are not allowed.' });
  expect(resendSendMock).not.toHaveBeenCalled();
});