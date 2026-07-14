import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock supabaseClient (auth + remote insert) and email service so submitBooking
// is isolated. loadStore/saveStore use the real localStorage-backed store.
vi.mock('../services/supabaseClient', () => ({
  getAuthenticatedUser: vi.fn(async () => ({ id: 'client-uuid', email: 'client@example.com' })),
  insertRemote: vi.fn(async () => ({ saved: true, error: null })),
  updateRemote: vi.fn(async () => ({ saved: true, error: null })),
}));
vi.mock('../services/emailService', () => ({
  sendBookingConfirmation: vi.fn(async () => {}),
  sendManagementBookingAlert: vi.fn(async () => {}),
  sendOwnerBookingAlert: vi.fn(async () => {}),
}));

import { submitBooking } from '../services/bookingService';
import { insertRemote } from '../services/supabaseClient';
import { sendOwnerBookingAlert } from '../services/emailService';

/**
 * Booking workflow: when a customer books, the owner is resolved via the
 * staycation's owner_id -> owner_email (snapshotted on the listing), then the
 * owner is notified. These tests pin that resolution and the owner_id link on
 * the booking record (used by the owner dashboard "my bookings").
 */
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('submitBooking — owner resolution + notification', () => {
  it('passes ownerId (not a snapshot email) so the server resolves the current owner email', async () => {
    // The owner's current email is resolved server-side from ownerId at
    // notification time — the client never passes or trusts an owner email
    // snapshot. The owner alert is dispatched with ownerId as the recipient key.
    const bookingForm = {
      property: 'l1',
      checkin: '2026-07-20',
      checkout: '2026-07-22',
      guests: '2',
      guestName: 'Client One',
      guestEmail: 'client@example.com',
      guestPhone: '+60123333333',
    };
    const bookingSummary = {
      name: 'Beach Villa',
      location: 'PD',
      price: 200,
      nights: 2,
      subtotal: 400,
      serviceFee: 48,
      total: 448,
      ownerId: 'owner-uuid-9',
    };

    const result = await submitBooking({ bookingForm, bookingSummary, paymentMeta: { provider: 'manual' } });

    // The local booking record carries ownerId for owner-dashboard filtering.
    const saved = result.store.bookingTransactions[0];
    expect(saved.ownerId).toBe('owner-uuid-9');

    // The remote insert payload carries owner_id.
    expect(insertRemote).toHaveBeenCalledWith(
      'booking_transactions',
      expect.objectContaining({ owner_id: 'owner-uuid-9' }),
    );

    // The owner alert is dispatched with ownerId (server resolves the email).
    expect(sendOwnerBookingAlert).toHaveBeenCalledWith(expect.any(Object), 'owner-uuid-9');
  });

  it('does not notify an owner when the listing has none (orphan listing)', async () => {
    const bookingForm = {
      property: 'l2',
      checkin: '2026-07-20',
      checkout: '2026-07-22',
      guests: '2',
      guestName: 'Client Two',
      guestEmail: 'client2@example.com',
    };
    const bookingSummary = {
      name: 'Orphan Villa',
      location: 'KL',
      price: 100,
      nights: 2,
      subtotal: 200,
      serviceFee: 24,
      total: 224,
      ownerId: null,
    };

    const result = await submitBooking({ bookingForm, bookingSummary, paymentMeta: { provider: 'manual' } });

    expect(result.store.bookingTransactions[0].ownerId).toBeNull();
    expect(sendOwnerBookingAlert).not.toHaveBeenCalled();
  });
});
