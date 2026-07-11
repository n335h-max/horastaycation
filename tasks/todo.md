# Remove Fake Placeholders & Placeholder Data — Task Checklist

## Phase 1: Form Placeholders (User-Facing Inputs)
- [x] Task 1: BookingPage.jsx — Replace "Jane Smith" → "Full name"
- [x] Task 1: BookingPage.jsx — Replace "jane@example.com" → "your@email.com"
- [x] Task 2: ExperiencePages.jsx (OwnerSignupPage) — Replace "John Doe" → "Full name"
- [x] Task 2: ExperiencePages.jsx (OwnerSignupPage) — Replace "owner@example.com" → "your@email.com"
- [x] Task 3: ExperiencePages.jsx (ReviewPage) — Replace "Your name" → "Full name"
- [x] Task 3: ExperiencePages.jsx (ReviewPage) — Replace "partner@example.com" → "your@email.com"
- [x] Task 4: SupportWidget.jsx — Replace "Your name" → "Full name"
- [x] Task 4: SupportWidget.jsx — Replace "you@example.com" → "your@email.com"

## Phase 2: Hardcoded/Synthetic Data
- [x] Task 5: siteData.js — Emptied DASHBOARD_STATS (removed 156 bookings, RM 48,290, 24 props, 4.8 rating)
- [x] Task 5: siteData.js — Emptied INITIAL_BOOKINGS and INITIAL_EMAILS arrays
- [x] Task 5: Verified dashboard consumers handle empty arrays gracefully (Empty states + emptyAction buttons)
- [x] Task 5: useFormatters.js — Patched formatCompactNumber to avoid "0" outputs by returning empty string for zero

## Phase 3: Management Studio Presets
- [x] Task 6: ExperiencePages.jsx — Removed entire LISTING_PRESETS array (~30 lines)
- [x] Task 6: ExperiencePages.jsx — Removed handlePresetApply function
- [x] Task 6: ExperiencePages.jsx — Removed preset UI block (Listing Presets card with 3 fake property buttons)
- [x] Task 6: ExperiencePages.jsx — Changed studio badge from "Drag-and-Drop · Bulk Upload · Presets" → "Drag-and-Drop · Bulk Upload"
- [x] Task 6: ExperiencePages.jsx — Changed handleCreateListing success message to remove "Apply a preset" clause
- [x] Task 6: ExperiencePages.jsx — Phone placeholders changed from "+60 12-345 6789" → "+60"
- [x] Task 7: useManagementStudio.js — Removed LISTING_PRESETS array
- [x] Task 7: useManagementStudio.js — Removed handlePresetApply useCallback hook
- [x] Task 7: useManagementStudio.js — Removed handlePresetApply and LISTING_PRESETS from return object and exports
- [x] Task 8: Verified no other files import LISTING_PRESETS or handlePresetApply from useManagementStudio.js

## Phase 4: Legacy Sanitization Cleanup
- [x] Task 9: localStore.js — Removed sanitizeLegacyPlaceholderData function (~30 lines)
- [x] Task 9: localStore.js — Removed LEGACY_PLACEHOLDER_EMAIL_DETAILS and LEGACY_PROPERTY_IDS Sets
- [x] Task 9: localStore.js — Removed withDefaults export (no external consumers)
- [x] Task 9: localStore.js — Changed DEFAULT_STORE to use empty arrays for dashboardBookings, dashboardEmails
- [x] Task 9: localStore.js — Removed unused imports INITIAL_BOOKINGS, INITIAL_EMAILS from siteData.js
- [x] Task 9: Verified no external consumers of removed exports/bookingService still imports only loadStore, saveStore, clone, initialBookingDraft

## Phase 5: Verification & Build
- [x] Task 10: Search src/ for remaining @example.com / example.com (excluding .test.js) — none found
- [x] Task 10: Search src/ for remaining fake names / fake phone placeholders / synthetic stats — none found
- [x] Task 11: Run npm run build — ✅ successful (0 errors, 969ms)
- [x] Task 11: Run npm run lint — ✅ clean (0 errors, 35 pre-existing warnings unrelated to this change)
- [x] Task 12: Manual verification of all placeholder fields — neutral placeholders confirmed
- [x] Task 12: Manual verification of dashboard empty states — emptyAction buttons present for all zero-value stats
- [x] Task 12: Management studio presets fully removed; only bulk upload and drag-and-drop remain

---

## Files Modified
1. `src/components/BookingPage.jsx` — Neutralized name/email placeholders
2. `src/components/ExperiencePages.jsx` — Neutralized placeholders, removed presets & preset UI, updated messages
3. `src/components/SupportWidget.jsx` — Neutralized name/email placeholders
4. `src/data/siteData.js` — Emptied DASHBOARD_STATS, INITIAL_BOOKINGS, INITIAL_EMAILS
5. `src/hooks/useFormatters.js` — Patched formatCompactNumber for zero values
6. `src/hooks/useManagementStudio.js` — Removed preset data and hook
7. `src/services/localStore.js` — Removed legacy sanitization, simplified DEFAULT_STORE

---

## Checkpoint: Complete
- [x] Build succeeds
- [x] Lint passes (0 errors)
- [x] No new warnings introduced
- [x] Manual checklist verified
- [x] Ready for review / launch
