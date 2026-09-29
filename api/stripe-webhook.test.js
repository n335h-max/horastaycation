import { beforeEach, describe, expect, it, vi } from 'vitest';

const stubs = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  hasProcessed: vi.fn(),
  recordProcessed: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  resolveOwnerEmail: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('./_lib/stripeServer.js', () => ({
  getStripeClient: () => ({ webhooks: { constructEvent: stubs.constructEvent } }),
  readRawRequestBody: async (req) => req.body,
}));

vi.mock('./_lib/supabaseAdmin.js', () => ({
  mapWebhookMetadataToBookingRecord: (metadata, defaults) => ({ metadata, defaults }),
  hasProcessedStripeEvent: stubs.hasProcessed,
  recordProcessedStripeEvent: stubs.recordProcessed,
  upsertBookingTransactionAdmin: stubs.upsert,
  updateBookingTransactionAdmin: stubs.update,
  resolveOwnerEmail: stubs.resolveOwnerEmail,
}));

vi.mock('./_lib/resendServer.js', () => ({
  getResendClient: () => ({ emails: { send: stubs.sendEmail } }),
  getFromEmail: () => 'noreply@example.com',
}));

vi.mock('./_lib/logger.js', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import handler from './stripe-webhook.js';

function makeRes() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function request() {
  return { method: 'POST', headers: { 'stripe-signature': 'sig' }, body: '{"raw":true}' };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NODE_ENV = 'test';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.MANAGEMENT_EMAIL = '';
  stubs.hasProcessed.mockResolvedValue(false);
  stubs.recordProcessed.mockResolvedValue({ recorded: true });
  stubs.upsert.mockResolvedValue({ saved: true });
  stubs.update.mockResolvedValue({ saved: true });
  stubs.resolveOwnerEmail.mockResolvedValue(null);
  stubs.sendEmail.mockResolvedValue({ id: 'email_1' });
});

describe('stripe webhook', () => {
  it('upserts paid bookings and records the event before acknowledging', async () => {
    stubs.constructEvent.mockReturnValue({
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      data: { object: { id: 'sess_1', payment_status: 'paid', payment_intent: 'pi_1', metadata: { guestEmail: 'guest@example.com' } } },
    });
    const res = makeRes();

    await handler(request(), res);

    expect(res.statusCode).toBe(200);
    expect(stubs.upsert).toHaveBeenCalledTimes(1);
    expect(stubs.recordProcessed).toHaveBeenCalledWith('evt_checkout', 'checkout.session.completed');
  });

  it('skips duplicate deliveries without repeating side effects', async () => {
    stubs.hasProcessed.mockResolvedValue(true);
    stubs.constructEvent.mockReturnValue({ id: 'evt_duplicate', type: 'charge.refunded', data: { object: {} } });
    const res = makeRes();

    await handler(request(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true, skipped: 'duplicate_event' });
    expect(stubs.upsert).not.toHaveBeenCalled();
    expect(stubs.update).not.toHaveBeenCalled();
    expect(stubs.recordProcessed).not.toHaveBeenCalled();
  });

  it('normalizes Stripe object references when processing refunds', async () => {
    stubs.constructEvent.mockReturnValue({
      id: 'evt_refund',
      type: 'charge.refunded',
      data: { object: { payment_intent: { id: 'pi_refund' }, refunded: true, refunds: { data: [{ id: 're_1' }] } } },
    });
    const res = makeRes();

    await handler(request(), res);

    expect(res.statusCode).toBe(200);
    expect(stubs.update).toHaveBeenCalledWith('stripe_payment_intent_id', 'pi_refund', expect.objectContaining({ payment_status: 'refunded' }));
  });
});
