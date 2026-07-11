# Implementation Plan: Remove Fake Placeholders & Placeholder Data

## Overview
Audit and clean the Hora Staycation codebase to remove all fake placeholder text, synthetic data, and placeholder fallbacks. Everything visible to end-users must be real, sourced from actual data, or show a legitimate empty state. This ensures the site looks professional and trustworthy before launch.

## Architecture Decisions
- **Empty states over fake data:** When no real data exists, show a helpful empty state (e.g., "No bookings yet. Guest bookings will appear here...") instead of hardcoded numbers.
- **Descriptive placeholders over fake names:** Use placeholders like "Full name" or "Email address" instead of "John Doe" or "jane@example.com".
- **Presets become prompts, not data:** Management studio presets should scaffold the form with field labels/hints, not inject fake property descriptions that could accidentally be published.
- **Sanitization code removal:** Legacy placeholder sanitization in `localStore.js` becomes unnecessary once all fake data sources are eliminated. Keep it as a safety net but mark for future removal.

## Task List

### Phase 1: Form Placeholders (User-Facing Inputs)

- [ ] **Task 1: BookingPage.jsx placeholders**
  - Replace `placeholder="Jane Smith"` with `placeholder="Full name"`
  - Replace `placeholder="jane@example.com"` with `placeholder="your@email.com"`

- [ ] **Task 2: ExperiencePages.jsx (OwnerSignupPage) placeholders**
  - Replace `placeholder="John Doe"` with `placeholder="Full name"`
  - Replace `placeholder="owner@example.com"` with `placeholder="your@email.com"`

- [ ] **Task 3: ExperiencePages.jsx (ReviewPage) placeholders**
  - Replace `placeholder="Your name"` with `placeholder="Full name"`
  - Replace `placeholder="partner@example.com"` with `placeholder="your@email.com"`

- [ ] **Task 4: SupportWidget.jsx placeholders**
  - Replace `placeholder="Your name"` with `placeholder="Full name"`
  - Replace `placeholder="you@example.com"` with `placeholder="your@email.com"`

### Phase 2: Hardcoded/Synthetic Data

- [ ] **Task 5: Remove hardcoded DASHBOARD_STATS from siteData.js**
  - `DASHBOARD_STATS` array has fake values: 156 bookings, RM 48,290 revenue, 24 properties, 4.8 rating
  - Replace with empty array `[]` so the dashboard renders from real data or empty states
  - Update consumers if they expect the array to always have items

### Phase 3: Management Studio Presets (Fake Templates)

- [ ] **Task 6: ExperiencePages.jsx — replace listing presets with neutral scaffolds**
  - Three presets inject fake property copy ("Beachfront Villa" with "Infinity Pool", "Private Beach Access", etc.)
  - Replace preset content with field-label hints or generic prompts that do not read as real listing data
  - e.g., "Preset: Add title, facilities, schedule, mood, and best-for tags"

- [ ] **Task 7: useManagementStudio.js — sync preset changes**
  - Same three presets duplicated here
  - Apply the same neutralization

- [ ] **Task 8: Default empty listing naming**
  - `createEmptyListing()` returns `name: 'New Staycation Listing'` — acceptable as a draft label, but verify it doesn't leak to public
  - `statusNote: 'Draft listing'` — acceptable as internal status

### Phase 4: Legacy Sanitization Cleanup

- [ ] **Task 9: localStore.js — mark sanitization for removal**
  - `LEGACY_PLACEHOLDER_EMAIL_DETAILS` and `LEGACY_PROPERTY_IDS` were already sanitizing fake data
  - Since we're removing sources, these Sets are now dead code
  - Remove `sanitizeLegacyPlaceholderData()` and the legacy Sets, simplify `loadStore()`

### Phase 5: Verification & Build

- [ ] **Task 10: Audit remaining `example.com` references**
  - Search for any remaining `@example.com` or `example.com` in src/ (excluding .test.js files)
  - `test/` files are acceptable — they are not production code

- [ ] **Task 11: Build check**
  - Run `npm run build` to ensure no syntax errors from edits
  - Run `npm run lint` if available

- [ ] **Task 12: Manual verification checklist**
  - [ ] Booking form shows "Full name" and "your@email.com" placeholders
  - [ ] Owner signup form shows neutral placeholders
  - [ ] Review/evaluate form shows neutral placeholders
  - [ ] Support widget shows neutral placeholders
  - [ ] Dashboard stats show empty states (not 156 bookings / RM 48k)
  - [ ] Management studio presets show neutral prompts (not "Beachfront Villa")

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Removing hardcoded stats breaks admin dashboard visuals | Medium | Empty states already exist in the UI; verify they render correctly |
| Preset neutralization confuses management users | Low | Presets are optional; clear labels like "Apply template scaffold" prevent confusion |
| Build errors from removing sanitization function | Low | The function is self-contained; removal won't affect other imports |

## Open Questions
- Should the default empty listing name remain "New Staycation Listing" or change to something else? (Acceptable as-is — it's a draft label.)
- Are there any other hidden fake data sources in the API layer? (Checked `api/` — no example.com references found.)
