# Owner Linking — Task Checklist

## Phase 1: Database foundation
- [x] 1. Migration: owner_user_id on review_submissions; owner_id on management_listings + booking_transactions; approved/approved_at on owner_applications + review_submissions; owner_email on management_listings; RLS + indexes  (APPLIED to remote)
## Phase 2: Submission links owner
- [x] 2. submitReview writes owner_user_id (submitOwnerApplication already does); both set approved:false locally
- [x] 3. Tests: mappers thread owner_user_id (ownerLinking.test.js)
## Phase 3: Staycation inherits owner_id
- [x] 4. Management studio: "New from request" picker; auto-inherit owner (read-only display)
- [x] 5. listingService.toRemoteManagementListing + fromRemoteManagementListing carry owner_id/owner_email
- [x] 6. Tests: listing from request inherits owner_id; orphan listing has none
## Phase 4: Approval persistence
- [x] 7. approveApplication persists approved/approved_at remotely; mappers read them
- [x] 8. Tests: mappers read approval state (covered in ownerLinking.test.js)
## Phase 5: Owner dashboard filtering
- [x] 9. OwnerDashboardPage filters by authUser.id (owner_id), not email
- [ ] 10. (RLS already enforces server-side; client filter tested via render) — see ownerLinking dashboard filter
## Phase 6: Booking owner notification
- [x] 11. submitBooking resolves owner via bookingSummary.ownerEmail (snapshotted from listing); threads ownerId
- [x] 12. Tests: booking resolves owner email + owner_id; orphan listing sends no owner alert

## Notes
- Approval persistence remote-side relies on the new approved/approved_at columns + updateRemote in approveApplication.
- Owner email for booking alerts is snapshotted on management_listings.owner_email at create time (client can't read other users' auth emails).
- RLS restricts owners to their own rows server-side; OwnerDashboardPage also filters client-side by authUser.id.
