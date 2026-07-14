import { describe, expect, it } from 'vitest';

import {
  mapRemoteOwnerApplication,
  mapRemoteReviewSubmission,
  mapRemoteBookingTransaction,
} from '../services/supabaseClient';
import { fromRemoteManagementListing, normalizeListingPayload } from '../services/listingMapper';
import { toRemoteManagementListing } from '../services/listingService';

/**
 * Regression guards for automatic owner linking.
 *
 * The authenticated Owner's user id (owner_id / owner_user_id) is the permanent
 * relationship across requests, staycations (management_listings) and bookings.
 * These tests pin that the mappers thread owner_id through remote <-> local
 * conversions in both directions, plus approval state.
 */

describe('mapRemoteReviewSubmission — owner linking + approval', () => {
  it('maps owner_user_id and approval state from the remote row', () => {
    const row = {
      id: 'r1',
      submitted_at: '2026-07-14T00:00:00Z',
      reviewer_name: 'Jane',
      contact_phone: '+60123456789',
      evaluator_email: 'jane@example.com',
      evaluator_address: 'KL',
      unit_count: '3',
      owner_user_id: 'owner-uuid-1',
      approved: true,
      approved_at: '2026-07-15T00:00:00Z',
    };

    const mapped = mapRemoteReviewSubmission(row);

    expect(mapped.ownerUserId).toBe('owner-uuid-1');
    expect(mapped.approved).toBe(true);
    expect(mapped.approvedAt).toBe('2026-07-15T00:00:00Z');
  });

  it('defaults owner_user_id null and approved false for legacy rows', () => {
    const mapped = mapRemoteReviewSubmission({ id: 'r2', reviewer_name: 'Old' });
    expect(mapped.ownerUserId).toBeNull();
    expect(mapped.approved).toBe(false);
    expect(mapped.approvedAt).toBeNull();
  });
});

describe('mapRemoteOwnerApplication — owner linking + approval', () => {
  it('maps owner_user_id and approval state from the remote row', () => {
    const row = {
      id: 'o1',
      submitted_at: '2026-07-14T00:00:00Z',
      owner_first_name: 'Ali',
      owner_last_name: 'Baba',
      owner_email: 'ali@example.com',
      owner_phone: '+60199999999',
      property_location: 'Melaka',
      max_guests: 4,
      budget: 'RM 5k',
      owner_user_id: 'owner-uuid-2',
      approved: true,
      approved_at: '2026-07-15T00:00:00Z',
    };

    const mapped = mapRemoteOwnerApplication(row);

    expect(mapped.ownerUserId).toBe('owner-uuid-2');
    expect(mapped.approved).toBe(true);
    expect(mapped.approvedAt).toBe('2026-07-15T00:00:00Z');
  });
});

describe('management_listings (staycations) — owner_id threading', () => {
  it('fromRemoteManagementListing reads owner_id', () => {
    const row = {
      id: 'l1',
      name: 'Villa',
      location: 'PD',
      price: 200,
      owner_id: 'owner-uuid-3',
      amenities: [],
    };

    const listing = fromRemoteManagementListing(row);

    expect(listing.ownerId).toBe('owner-uuid-3');
  });

  it('normalizeListingPayload preserves ownerId', () => {
    const listing = normalizeListingPayload({
      id: 'l1',
      name: 'Villa',
      price: 100,
      ownerId: 'owner-uuid-4',
    });
    expect(listing.ownerId).toBe('owner-uuid-4');
  });

  it('toRemoteManagementListing writes owner_id', () => {
    const remote = toRemoteManagementListing({
      id: 'l1',
      name: 'Villa',
      location: 'PD',
      price: 200,
      amenities: [],
      blockedDates: [],
      isDeleted: false,
      ownerId: 'owner-uuid-5',
    });

    expect(remote.owner_id).toBe('owner-uuid-5');
    expect(remote).not.toHaveProperty('owner_email');
  });

  it('toRemoteManagementListing writes null owner_id for orphan listings', () => {
    const remote = toRemoteManagementListing({
      id: 'l2',
      name: 'Orphan',
      price: 100,
      amenities: [],
      blockedDates: [],
      isDeleted: false,
    });
    expect(remote.owner_id).toBeNull();
    expect(remote).not.toHaveProperty('owner_email');
  });
});

describe('booking_transactions — owner_id threading', () => {
  it('mapRemoteBookingTransaction reads owner_id', () => {
    const record = {
      id: 'b1',
      submitted_at: '2026-07-14T00:00:00Z',
      booking_status: 'confirmed',
      payment_status: 'paid',
      owner_id: 'owner-uuid-6',
      property_id: 'l1',
      property_name: 'Villa',
      property_location: 'PD',
      guest_name: 'Guest',
      guest_email: 'guest@example.com',
      guests: 2,
      checkin_date: '2026-07-20',
      checkout_date: '2026-07-22',
      nights: 2,
      subtotal: 400,
      service_fee: 48,
      total: 448,
    };

    const mapped = mapRemoteBookingTransaction(record);
    expect(mapped.ownerId).toBe('owner-uuid-6');
  });
});

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useManagementStudio } from '../hooks/useManagementStudio';

describe('useManagementStudio — create listing from request inherits owner_id', () => {
  it('a draft created from an owner request inherits ownerUserId', () => {
    // Management does NOT manually select an owner — it is auto-linked from the
    // request's owner_user_id. The owner email is resolved server-side later.
    const listings = [];
    const { result } = renderHook(() => useManagementStudio(listings, vi.fn(), vi.fn()));
    const ownerRequest = {
      id: 'req-1',
      ownerUserId: 'owner-uuid-7',
      ownerAddress: 'Melaka',
      ownerName: 'Ali',
    };

    act(() => {
      result.current.handleCreateListing(ownerRequest);
    });

    const draft = result.current.selectedListing;
    expect(draft.ownerId).toBe('owner-uuid-7');
    expect(draft.sourceRequestId).toBe('req-1');
    expect(draft.sourceRequestType).toBe('owner');
    expect(draft.location).toBe('Melaka');
  });

  it('a draft created from an evaluation request inherits the evaluator as owner', () => {
    const listings = [];
    const { result } = renderHook(() => useManagementStudio(listings, vi.fn(), vi.fn()));
    const evalRequest = {
      id: 'req-2',
      ownerUserId: 'owner-uuid-8',
      evaluatorAddress: 'Penang',
      evaluatorName: 'Jane',
    };

    act(() => {
      result.current.handleCreateListing(evalRequest);
    });

    const draft = result.current.selectedListing;
    expect(draft.ownerId).toBe('owner-uuid-8');
    expect(draft.sourceRequestType).toBe('evaluation');
  });

  it('a plain new listing has no owner (orphan)', () => {
    const listings = [];
    const { result } = renderHook(() => useManagementStudio(listings, vi.fn(), vi.fn()));
    act(() => {
      result.current.handleCreateListing();
    });
    expect(result.current.selectedListing.ownerId).toBeNull();
    expect(result.current.selectedListing).not.toHaveProperty('ownerEmail');
  });
});
