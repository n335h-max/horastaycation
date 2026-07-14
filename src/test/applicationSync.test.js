import { describe, expect, it } from 'vitest';

import { mapRemoteOwnerApplication, mapRemoteReviewSubmission } from '../services/supabaseClient';
import { mergeApplications } from '../services/listingService';

/**
 * Regression guards for application (owner lead + evaluation request) remote
 * sync. Background: the dashboard read these only from localStorage, so a
 * browser clear or a second device lost every submitted lead/request —
 * including the phone number. The fix persists them to Supabase and reads them
 * back via mappers, with a merge that preserves local-only records and local
 * approval state.
 */

describe('mapRemoteReviewSubmission — contact columns', () => {
  it('maps the new structured columns to the card shape', () => {
    const row = {
      id: 'r1',
      submitted_at: '2026-07-14T00:00:00Z',
      reviewer_name: 'Jane Evaluator',
      contact_phone: '+60123456789',
      evaluator_email: 'jane@example.com',
      evaluator_address: 'KL',
      unit_count: '3',
    };

    const mapped = mapRemoteReviewSubmission(row);

    expect(mapped.evaluatorName).toBe('Jane Evaluator');
    expect(mapped.evaluatorEmail).toBe('jane@example.com');
    expect(mapped.evaluatorPhone).toBe('+60123456789');
    expect(mapped.evaluatorAddress).toBe('KL');
    expect(mapped.unitCount).toBe('3');
    expect(mapped.approved).toBe(false);
  });

  it('falls back to legacy crammed fields for rows submitted before the migration', () => {
    // Legacy rows had no contact_phone/evaluator_email/unit_count columns;
    // email/units were embedded in review_text/cleanliness.
    const row = {
      id: 'r2',
      submitted_at: '2026-06-01T00:00:00Z',
      reviewer_name: 'Old Evaluator',
      contact_phone: '',
      evaluator_email: '',
      evaluator_address: '',
      unit_count: '',
      location: 'Penang',
      cleanliness: 'Units 2',
      review_text:
        'Evaluation request from Old Evaluator. Email: old@example.com. Address: Penang. Units: 2.',
    };

    const mapped = mapRemoteReviewSubmission(row);

    expect(mapped.evaluatorEmail).toBe('old@example.com');
    expect(mapped.evaluatorAddress).toBe('Penang');
    expect(mapped.unitCount).toBe('2');
    expect(mapped.evaluatorPhone).toBe(''); // no legacy phone existed — empty, not crash
  });
});

describe('mapRemoteOwnerApplication — contact columns', () => {
  it('combines first/last name and maps contact fields', () => {
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
    };

    const mapped = mapRemoteOwnerApplication(row);

    expect(mapped.ownerName).toBe('Ali Baba');
    expect(mapped.ownerEmail).toBe('ali@example.com');
    expect(mapped.ownerPhone).toBe('+60199999999');
    expect(mapped.ownerAddress).toBe('Melaka');
    expect(mapped.unitCount).toBe('4');
    expect(mapped.budget).toBe('RM 5k');
    expect(mapped.approved).toBe(false);
  });
});

describe('mergeApplications — local + remote', () => {
  const baseOwner = (overrides = {}) => ({
    id: 'o1',
    ownerName: 'Ali',
    ownerEmail: 'ali@example.com',
    ownerPhone: '+60199999999',
    ownerAddress: 'Melaka',
    unitCount: '4',
    budget: 'RM 5k',
    submittedAt: '2026-07-14T00:00:00Z',
    approved: false,
    ...overrides,
  });

  it('keeps remote records and preserves local-only records (no data loss)', () => {
    const local = [baseOwner({ id: 'o1', approved: false }), baseOwner({ id: 'local-only', ownerEmail: 'local@example.com' })];
    const remote = [baseOwner({ id: 'o1', ownerPhone: '+60111111111' })];

    const merged = mergeApplications(local, remote);

    expect(merged).toHaveLength(2);
    // Remote wins for contact info.
    const synced = merged.find((m) => m.id === 'o1');
    expect(synced.ownerPhone).toBe('+60111111111');
    // Local-only record survives.
    expect(merged.some((m) => m.id === 'local-only')).toBe(true);
  });

  it('preserves locally-recorded approval state on a synced record', () => {
    const local = [baseOwner({ id: 'o1', approved: true })];
    const remote = [baseOwner({ id: 'o1', approved: false })]; // no approved column remote-side

    const merged = mergeApplications(local, remote);
    expect(merged.find((m) => m.id === 'o1').approved).toBe(true);
  });

  it('dedupes legacy rows whose DB id differs from the local copy (same natural key)', () => {
    // A lead submitted before client ids were synced: local has client uuid,
    // remote has DB-generated uuid, but same email + name.
    const local = [baseOwner({ id: 'client-uuid', approved: true })];
    const remote = [baseOwner({ id: 'db-uuid', ownerPhone: '+60222222222' })];

    const merged = mergeApplications(local, remote);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('db-uuid'); // remote version kept
    expect(merged[0].approved).toBe(true); // local approval carried over
    expect(merged[0].ownerPhone).toBe('+60222222222');
  });
});
