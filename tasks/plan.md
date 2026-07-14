# Implementation Plan: Automatic Owner Linking

## Overview

Every owner submission (Build / Refurbish, and Evaluate With Us) already comes
from an authenticated Owner. We link the authenticated `owner_id` (auth.uid())
as the permanent relationship through the whole lifecycle: request → staycation
(listing) → booking → owner dashboard. Filtering uses `owner_id`, never email
or phone. Management never manually selects an owner when creating a staycation
from a request — it inherits `owner_id` from the source request.

## Architecture Decisions

- **Map spec concepts onto existing tables, don't create parallel ones.** The
  spec names `build_requests`, `evaluation_requests`, `staycations`. The actual
  app uses `owner_applications`, `review_submissions`, `management_listings`.
  Creating new tables would duplicate data and break the existing management
  studio + dashboard + sync code. Mapping:
  - `build_requests`      → `owner_applications`   (already has `owner_user_id`)
  - `evaluation_requests` → `review_submissions`   (needs `owner_user_id` added)
  - `staycations`         → `management_listings`  (needs `owner_id` added)
  - "create staycation from a request" → the management studio listing form
    gains an optional `sourceRequestId`/`sourceType`; when set, the saved
    listing inherits `owner_id` from that request.

- **`owner_id` is a nullable uuid on `management_listings`.** Legacy listings
  have no owner; they stay `null`. New listings created from a request inherit
  the request's `owner_user_id`. Management can also create "orphan" listings
  (no request) with `owner_id = null`. This preserves existing behavior.

- **Approval flow gains `owner_id` inheritance.** When management approves a
  request and then creates a listing from it, the listing inherits
  `owner_user_id`. Approval state itself is also persisted remotely now
  (long-standing gap) via `approved` + `approved_at` columns so it survives
  browser clears (the prior migration already added contact columns; this adds
  the approval columns).

- **Owner dashboard filtering uses `owner_id`.** `fetchRemoteOwnerApplications`
  already returns rows; RLS already restricts owners to their own
  `owner_user_id`. We add owner filtering client-side too (defense in depth)
  and filter `management_listings` + `booking_transactions` by `owner_id` for
  the owner dashboard. RLS policies restrict owners to their own rows.

- **Booking notification resolves owner via listing.owner_id.** Today owner
  notification falls back through `paymentMeta.ownerEmail /
  bookingSummary.ownerEmail / bookingForm.ownerEmail` (all usually empty). We
  resolve the listing's `owner_id` → owner email at booking-submit time and
  thread it into `paymentMeta.ownerEmail`.

## Task List

### Phase 1: Database foundation
- [ ] Task 1: Migration — add `owner_user_id` to `review_submissions`; add
      `owner_id` to `management_listings`; add `approved`/`approved_at` to
      both `owner_applications` and `review_submissions`; add `owner_id` to
      `booking_transactions` (denormalized for fast owner-dashboard queries);
      RLS: owners can select their own listings/bookings/review-submissions;
      index owner_id columns.
- Checkpoint: migration applies clean on remote; columns exist.

### Phase 2: Submission links the authenticated owner
- [ ] Task 2: `applicationService.submitOwnerApplication` already writes
      `owner_user_id`; verify + keep. `submitReview` now writes
      `owner_user_id` from `getAuthenticatedUser()`.
- [ ] Task 3: Tests — both submit paths persist `owner_user_id`; review
      submission no longer relies on email for ownership.

### Phase 3: Staycation inherits owner_id from a request
- [ ] Task 4: Management studio listing form: add an optional "Create from
      request" selector listing approved owner_applications + review_submissions
      (owner name + address). When chosen, `saveManagementListing` resolves the
      request's `owner_user_id` and sets it on the listing; the owner field is
      read-only (auto-filled, not manually selected).
- [ ] Task 5: `listingService.saveManagementListing` / `toRemoteManagementListing`
      carry `owner_id`; `fromRemoteManagementListing` + mapper read it.
- [ ] Task 6: Tests — listing created from a request inherits the request's
      owner_id; management did not manually select an owner.

### Phase 4: Approval persistence + dashboard reads approval from DB
- [ ] Task 7: `approveApplication` now also calls `updateRemote` to set
      `approved=true, approved_at=now()`; mappers read `approved`/`approved_at`
      so approval survives browser clears (was local-only).
- [ ] Task 8: Tests — approval round-trips through remote; merge preserves it.

### Phase 5: Owner dashboard filtering by owner_id
- [ ] Task 9: `useAppStore`/`syncRemoteData` owner-scoped fetch: owners get
      only their own listings, bookings, applications, review submissions.
      `useAppActions` passes the current owner id; `OwnerDashboardPage` filters
      by `owner_id` (not email).
- [ ] Task 10: Tests — owner dashboard only shows the owner's own rows.

### Phase 6: Booking resolves owner via listing.owner_id
- [ ] Task 11: `submitBooking` resolves the booked listing's `owner_id` →
      owner email and threads into `paymentMeta.ownerEmail` so the owner
      booking-alert email is actually sent (today it's usually empty).
- [ ] Task 12: Tests — booking a listing with an owner resolves owner email.

### Checkpoint: Complete
- [ ] All tests pass; build clean; migration applied; manual smoke of both
      submit flows + owner dashboard + a booking.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS regression locks owners out of shared public listings they need to book as client | High | Keep public select on management_listings for clients; owner_id policy is additive, only restricts owner-dashboard-scoped queries |
| Existing listings have no owner → owner dashboard empty | Low | Expected; legacy listings are management-owned. New listings from requests link correctly |
| Approval was local-only; remote column change could conflict | Med | Migration uses `add column if not exists default false`; merge preserves local approval |
| Booking owner-resolution needs the listing's owner email | Med | Resolve via owner_user_id → auth.users join server-side OR store owner_email snapshot on listing |

## Open Questions
- Owner email for booking notification: resolve at booking time via
  `owner_user_id` (needs a server lookup of auth.users email, which the client
  can't do directly) vs. snapshot `owner_email` onto `management_listings` at
  listing-create time. **Decision: snapshot `owner_email` onto the listing at
  create time** — simpler, works client-side, and is what bookingService already
  reads via `bookingSummary.ownerEmail`. (See Task 11.)
