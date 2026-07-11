# Hora Staycation — UI/UX Design Review

**Reviewer**: Design & Frontend Engineering Audit  
**Scope**: Accessibility (a11y), Visual Hierarchy, Component Structure  
**Date**: 2026-07-11  
**Commit**: `6e79502` on `main`

---

## Executive Summary

Hora Staycation is a visually polished property-booking experience with a strong brand identity (deep blue `brand-950` + cyan `accent-400`), elegant typography (Playfair Display + DM Sans), and thoughtful performance optimisations (lazy sections, IntersectionObserver deferred loading). The site feels premium and intentional.

That said, four recurring themes should be addressed before scaling:

1. **Accessibility gaps** — some interactive patterns lack full ARIA contracts and keyboard traps exist in overlays.
2. **Stat-card emptiness** — removing fake stats was correct, but the empty stat cards in the hero now send a confusing visual signal.
3. **Component bloat** — `ExperiencePages.jsx` (2,160 lines) and `useManagementStudio.js` (467 lines) are monoliths that hinder maintainability.
4. **Tailwind v4 token drift** — some hardcoded hex values remain in CSS while the `@theme` system is available.

Below is a structured audit by axis.

---

## 1. Accessibility (WCAG 2.1 AA)

### ✅ What's Working Well

| Pattern | Implementation | Grade |
|---|---|---|
| Focus indicators | Global `*:focus-visible` outline with brand-blue `rgba(37,99,235,0.35)` + 3px offset | A |
| Skip link | `.skip-link` jumps to main content, visible on focus | A |
| Hero carousel | `role="region"`, `aria-roledescription="carousel"`, `aria-label` on arrows, `aria-hidden` on inactive slides, keyboard ArrowLeft/Right support | A- |
| Form labels | Every `<input>`, `<select>`, `<textarea>` has an explicit `<label htmlFor="...">` | A |
| Toast notifications | `aria-live="polite"` on toast stack with `aria-atomic="true"` | A |
| Mobile menu | `aria-expanded`, `aria-controls="mobile-menu"`, close-on-Escape | A- |
| Alt text | Most images have descriptive `alt` attributes; hero carousel uses property names | B+ |

### ⚠️ Issues to Fix (Prioritised)

#### High — Blocks Screen-Reader Usability

1. **Dialog roles missing on overlays**
   - `PaymentModal` is a modal but lacks `role="dialog"` and `aria-modal="true"`.
   - `SupportWidget` chat panel is a modal but lacks `role="dialog"` and does not trap focus.
   - `aria-describedby` pointing to the summary block would help users understand the modal purpose immediately.

2. **Profile menu dropdown is not a semantic menu**
   - The `UserProfileMenu` uses `aria-haspopup="menu"` but the dropdown is a plain `<div>`.
   - Should be `role="menu"` with `role="menuitem"` children, or change `aria-haspopup` to `"listbox"` / `"dialog"` depending on semantics.
   - Arrow key navigation (Up/Down) is not implemented.

3. **No focus trap in overlays**
   - When `PaymentModal` or `SupportWidget` opens, focus can still Tab to the underlying page.
   - Implement a `useFocusTrap(ref, isOpen)` hook that cycles focus within the modal.

4. **SupportWidget toggle lacks state announcement**
   - When the widget opens, screen-reader users do not know context changed.
   - Add `aria-expanded` to the toggle and move focus to the widget heading on open.

#### Medium — Friction for Keyboard Users

5. **Nav buttons lack `aria-current`**
   - The active nav item in `SiteHeader` gets a background style (`activeLinkClass`) but no `aria-current="page"` for screen readers.

6. **Stat cards should probably be `dl > dt + dd` or have `aria-label`**
   - `StatCard` renders a `<div>` with two child `<div>`s. The semantic relationship (term → value) is purely visual.
   - Wrap in `<dl>` with `<dt>` and `<dd>`, or add `aria-label` to the value container.

7. **Carousel pause/stop control missing**
   - If auto-advance is added later, WCAG 2.2.2 requires a pause mechanism. Currently manual-only, so this is a future-proofing note.

8. **`aria-hidden="true"` on all icons prevents icon-only button SR access**
   - The `Icon` component correctly has `aria-hidden="true"`, but buttons that are icon-only (wishlist heart, close buttons) have compensating `aria-label` text.
   - **Verified present** — good. Just maintain this discipline.

#### Low — Polish

9. **Color contrast on trust-signal pills**
   - `text-white/85` on `bg-white/10` over the hero gradient passes WCAG but is borderline on some displays. Consider `text-white/90` or a slightly stronger background.

10. **Testimonial initials might be ambiguous**
    - The avatar fallback in `TestimonialsSection` shows the first initial in uppercase. If two testimonials share an initial, there is no differentiation.
    - Consider using `aria-label="Avatar for {name}"`.

---

## 2. Visual Hierarchy

### ✅ What's Working Well

- **Typographic scale**: Eyebrow (`text-sm`, `uppercase`, `tracking-[0.3em]`) → Display heading (`font-display`, `text-4xl–6xl`) → Body (`text-lg`, `leading-relaxed`) → Muted (`text-slate-500/600`). Consistent across every section.
- **Color discipline**: The `@theme` block defines a tight palette. The deep navy → cyan gradient is distinctive.
- **Spacing rhythm**: `py-20` / `py-24` for major sections, `gap-6` / `gap-8` for grids, `max-w-6xl` / `max-w-7xl` containers.
- **Hover affordances**: Cards lift (`-translate-y-1`), shadows deepen, images scale subtly.
- **Empty state design**: BookingPage "No staycations available yet" is well-crafted (icon, reassuring copy, CTA).

### ⚠️ Issues to Fix

#### High — Undermines Trust

1. **Hero stat cards now show literal empty strings**
   - `StatCard` renders `{formatter(stat.value)}` for a prefix-value-suffix pattern.
   - Since `DASHBOARD_STATS` was emptied for launch correctness, `STATS` now contains empty values.
   - The stat cards still render with `rounded-2xl border border-white/10 bg-white/10`. When values are empty, the user sees ghost cards with only labels.
   - **Fix**: Either hide the stats grid entirely when empty (`STATS.every(s => !s.value)`), or replace with a single trust-pulse line (e.g., "Verified properties · Curated stays · Owner-ready tools").

2. **Glass-panel effect is incomplete**
   - `.glass-panel` only defines `backdrop-filter: blur(10px)`. It has no `background` or `border`.
   - In `HeroSection.jsx`, the glass pill relies on other utility classes for border/bg. This is fragile.
   - **Fix**: Complete the `.glass-panel` class in `index.css`:
     ```css
     .glass-panel {
       backdrop-filter: blur(10px);
       background: rgba(255, 255, 255, 0.08);
       border: 1px solid rgba(255, 255, 255, 0.12);
     }
     ```

3. **AnalyticsSummary zero-state is visually cold**
   - `GuestToolsSection` shows `{analyticsSummary?.searches ?? 0}` in large bold numbers.
   - When zero, three large `0` values dominate the dark card.
   - **Fix**: When all values are zero, replace the numeric grid with a single sentence: "Analytics will appear here once guests start searching and booking."

#### Medium — Visual Noise

4. **AddOnCard conditional styling is hard to follow**
   - `isPlants` ternaries are nested 6+ levels deep. This leaks styling concerns into component logic.
   - **Fix**: Extract a `plantTheme` / `defaultTheme` config object, or use a `cva`-style pattern.

5. **Too many border-radius variations**
   - Used values: `rounded-2xl`, `rounded-3xl`, `rounded-[1.2rem]`, `rounded-[1.75rem]`, `rounded-[2rem]`, `rounded-[3rem]`.
   - Creates visual inconsistency.
   - **Fix**: Standardise to a 3-step system:
     - **Small**: `rounded-xl` (buttons, inputs, chips)
     - **Medium**: `rounded-2xl` (cards, modal panels)
     - **Large**: `rounded-3xl` (hero containers, major CTAs)
   - Remove arbitrary rem values where possible.

6. **Hero gradient overlay may hide image loading failures**
   - `.hero-bg` has a heavy gradient overlay + fixed background image from an external URL.
   - `background-attachment: fixed` can cause performance issues on mobile Safari.
   - **Fix**: Add `background-color: #0c1a3a` fallback. Consider `background-attachment: scroll` on iOS via feature detection.

#### Low — Polish

7. **CTA repetition between HeroSection and LandingPage**
   - Hero has "Book Your Escape" + "Build With Hora". LandingPage has "Submit Your Property" + "Start with Hora".
   - **Fix**: Lock in a single CTA vocabulary per intent and reuse it.

8. **Footer social links hover state is stark**
   - `hover:bg-accent-400 hover:text-brand-900` on dark navy. Ensure `accent-400` is not too bright.

---

## 3. Component Structure & Architecture

### ✅ What's Working Well

- **Page/Component separation**: Page routes are thin 5-line wrappers. Heavy UI lives in `src/components/`.
- **Lazy loading with IntersectionObserver**: `DeferredSection` in `LandingPage.jsx` is well-architected.
- **Single-responsibility sections**: Each landing section does one thing.
- **Custom hooks for cross-cutting concerns**: `useAuth`, `useBooking`, `useAppActions`, `useToast` separate stateful logic from presentation.
- **Explicit prop interfaces**: Components declare full prop interfaces rather than spreading `...props` everywhere.

### ⚠️ Issues to Fix

#### High — Blocks Maintainability

1. **`ExperiencePages.jsx` is a 2,160-line monolith**
   - Likely contains: owner signup, evaluation form, management dashboard, listing studio, and review pages.
   - **Fix**: Split into a directory structure:
     ```
     src/components/experience/
       OwnerSignupPage.jsx
       ReviewPage.jsx
       ManagementDashboard.jsx
       ListingStudio/
         index.jsx
         MediaDropZone.jsx
       index.js               # barrel export
     ```
   - Each component should be < 300 lines.

2. **`useManagementStudio.js` is 467 lines**
   - Handles Supabase listings CRUD, image upload, drag-and-drop, sorting, filtering, draft management, and formatting.
   - **Fix**: Decompose into focused hooks:
     - `useListingsQuery()` — data fetching
     - `useImageUpload()` — file handling
     - `useListingDrafts()` — local state / undo
     - `useListingFilters()` — search/sort

3. **`BookingPage.jsx` (562 lines) mixes 4 concerns**
   - Property search/filter UI, property listing cards, booking form, booking summary sidebar.
   - **Fix**: Extract `PropertySearchBar`, `PropertyList`, `BookingSummarySidebar`, `BookingForm`.

#### Medium — Prop Drilling & Coupling

4. **`BookingPage` accepts 17+ props**
   - Makes the component hard to reuse and the call site hard to read.
   - **Fix**: Group related props into objects, or use a `BookingContext` for shared state like auth, currency formatters, and navigation callbacks.
   - `formatCurrency` and `formatDate` should probably be utility imports, not props.

5. **`LandingPage` passes event handlers 3 levels deep**
   - `onShowPage` and `onScrollToSection` are drilled through `HeroSection`, `DeferredSection`, `LazyGuestToolsSection`, etc.
   - **Fix**: Consider a `useNavigation()` hook that any component can import directly.

#### Low — Polish & Conventions

6. **`SiteChrome.jsx` bundles 5 components in one file**
   - `ToastStack`, `getAuthBadgeCopy`, `UserAvatarIndicator`, `UserProfileMenu`, `SiteHeader`, `SiteFooter`.
   - **Fix**: Move each into its own file under a `SiteChrome/` directory.

7. **CSS-first Tailwind v4 configuration has hex drift**
   - `.btn-primary`, `.btn-accent`, `.form-input`, etc., still use raw hex values like `#1d4ed8`, `#06b6d4`.
   - **Fix**: Replace with Tailwind v4 CSS variable references:
     ```css
     .btn-primary {
       background: linear-gradient(135deg, var(--color-brand-600), var(--color-brand-800));
     }
     ```

8. **`index.css` mixes tokens, global styles, component utilities, keyframes, and media queries**
   - **Fix**: Consider `@import`ing component CSS files, or use `@layer components` / `@utility` for custom utilities.

---

## 4. Quick Wins (One Session)

1. **[A11y] Add `role="dialog" aria-modal="true"` to `PaymentModal` and `SupportWidget`**
2. **[A11y] Add `aria-current="page"` to active nav items in `SiteHeader`**
3. **[Visual] Hide hero stat grid when `STATS` values are empty, or render trust-pulse text**
4. **[Visual] Complete `.glass-panel` CSS definition**
5. **[Structure] Move `formatCurrency` and `formatDate` from props to direct utility imports**
6. **[Structure] Split `SiteChrome.jsx` into separate files by exported component**

---

## 5. Strategic Refactors (Multi-Session)

1. **Decompose `ExperiencePages.jsx`** — highest impact on maintainability.
2. **Decompose `useManagementStudio.js`** — highest impact on testability.
3. **Introduce a `useNavigation()` hook** — eliminates prop-drilling.
4. **Standardise border-radius tokens** — design-system hygiene.
5. **Align custom CSS classes with `@theme` tokens** — future-proofs palette changes.
6. **Add `useFocusTrap` and `useBodyScrollLock` hooks** — full a11y compliance for overlays.

---

## 6. Design-System Observations (React 19 + Tailwind v4 + Shadcn-UI Context)

- **No `tailwind.config.js` is correct** for Tailwind v4. The project already uses CSS-first `@theme` configuration.
- **Shadcn-UI compatibility**: Shadcn v4 components use `cn()` (clsx + tailwind-merge) for conditional classes. Current ternary patterns would refactor cleanly.
- **React 19 `useId()`**: Already used in `UserProfileMenu`. Good.
- **`startTransition` for state updates**: Already used in `DeferredSection`. Good.
- **No React Server Components**: This is a Vite SPA. If migrating to Next.js, the section-based structure ports cleanly.
- **CSS custom properties for animations**: `@keyframes` are global. In a token-based system, consider `tailwindcss-animate`.

---

## Appendix: File-by-File Grade Summary

| File | Lines | Grade | Notes |
|---|---|---|---|
| `src/index.css` | — | B+ | Good token structure; hex drift in utilities; missing `.glass-panel` bg |
| `src/components/SiteChrome.jsx` | 617 | C+ | Well-implemented but too many components in one file |
| `src/components/LandingPage.jsx` | 178 | A- | Excellent lazy-loading pattern; clean section composition |
| `src/components/BookingPage.jsx` | 562 | C+ | Functional but mixes 4 concerns; too many props |
| `src/components/ExperiencePages.jsx` | 2160 | D+ | Monolithic; needs directory decomposition |
| `src/components/SupportWidget.jsx` | 207 | B | Good form UX; missing dialog role and focus trap |
| `src/components/PaymentModal.jsx` | 80 | B+ | Clean layout; missing `role="dialog"` |
| `src/components/AuthFlowPage.jsx` | 219 | B+ | Clear role selection UX; good conditional styling |
| `src/components/landing/HeroSection.jsx` | ~250 | B | Great carousel UX; stat cards need empty-state handling |
| `src/components/landing/IntroSection.jsx` | ~60 | A | Clean, single-purpose, well-structured |
| `src/components/landing/PillarSection.jsx` | ~40 | A | Model component — small, declarative, reusable |
| `src/components/landing/ConceptsSection.jsx` | ~300 | B | Functional but `AddOnCard` has deep nesting |
| `src/components/landing/GuestToolsSection.jsx` | ~150 | B | Good layout; zero-state needs copy |
| `src/components/landing/TestimonialsSection.jsx` | ~60 | A- | Clean; avatar could use `aria-label` |
| `src/hooks/useManagementStudio.js` | 467 | C | Does too much; hardest file to reason about |

---

*End of review.*
