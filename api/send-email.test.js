import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stub resend so no real email send happens; capture the send args.
const resendSendMock = vi.fn();
vi.mock('./_lib/resendServer.js', () => ({
  getResendClient: () => ({ emails: { send: resendSendMock } }),
  getFromEmail: () => 'no-reply@example.com',
  getManagementEmail: () => 'admin@example.com',
}));
vi.mock('./_lib/cors.js', () => ({ handleCors: () => null }));
// Stub the server-side owner-email resolver (unit under test is the wiring).
const { resolveOwnerEmailMock } = vi.hoisted(() => ({ resolveOwnerEmailMock: vi.fn() }));
vi.mock('./_lib/supabaseAdmin.js', () => ({ resolveOwnerEmail: resolveOwnerEmailMock }));

import handler from './send-email.js';

/**
 * owner_booking_alert now resolves the owner's CURRENT email server-side from
 * ownerId (single source of truth), instead of trusting a client-supplied
 * ownerEmail snapshot. The client cannot read other users' auth emails.
 */
function makeReq(body) {
  return {
    method: 'POST',
    headers: { origin: 'https://hora.example.com' },
    socket: { remoteAddress: '127.0.0.1' },
    body,
  };
}
function makeRes() {
  return {
    statusCode: 0,
    headers: {},
    setHeader(n, v) { this.headers[n] = v; },
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = 're_test';
  process.env.APP_BASE_URL = 'https://hora.example.com';
  resendSendMock.mockResolvedValue({ data: { id: 'msg_1' } });
});

describe('send-email owner_booking_alert — resolves owner email from ownerId', () => {
  it('resolves the owner email server-side from data.ownerId and sends to it', async () => {
    resolveOwnerEmailMock.mockResolvedValue('owner-current@example.com');
    const req = makeReq({ type: 'owner_booking_alert', data: { propertyName: 'Villa', ownerId: 'owner-uuid-1' } });
    const res = makeRes();

    await handler(req, res);

    expect(resolveOwnerEmailMock).toHaveBeenCalledWith('owner-uuid-1');
    expect(res.statusCode).toBe(200);
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(resendSendMock.mock.calls[0][0].to).toBe('owner-current@example.com');
  });

  it('rejects when ownerId is missing (no silent send to a wrong recipient)', async () => {
    resolveOwnerEmailMock.mockResolvedValue(null);
    const req = makeReq({ type: 'owner_booking_alert', data: { propertyName: 'Villa' } });
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(resendSendMock).not.toHaveBeenCalled();
  });

  it('rejects when the owner id cannot be resolved to an email', async () => {
    resolveOwnerEmailMock.mockResolvedValue(null);
    const req = makeReq({ type: 'owner_booking_alert', data: { propertyName: 'Villa', ownerId: 'no-such-owner' } });
    const res = makeRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(resendSendMock).not.toHaveBeenCalled();
  });
});
