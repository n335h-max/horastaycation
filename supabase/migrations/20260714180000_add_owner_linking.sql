-- Automatic owner linking: make owner_id the permanent relationship across
-- requests, staycations (management_listings) and bookings.
--
-- Concept mapping (spec -> actual tables, to avoid duplicating data and
-- breaking existing management studio + dashboard + sync code):
--   build_requests        -> owner_applications   (already has owner_user_id)
--   evaluation_requests   -> review_submissions   (needs owner_user_id)
--   staycations           -> management_listings  (needs owner_id)

-- 1. Link evaluation requests to the authenticated owner
alter table public.review_submissions
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

-- 2. Link staycations (listings) to their owner. Nullable: legacy listings and
--    management-created orphan listings have no owner. New listings created
--    from a request inherit the request's owner_user_id here.
--    owner_email is a snapshot so booking notifications can reach the owner
--    without a server-side auth.users lookup (client cannot read other users'
--    emails).
alter table public.management_listings
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists owner_email text not null default '';

-- 3. Link bookings to the owner of the booked staycation (denormalized for fast
--    owner-dashboard queries: "my bookings" without joining through listings).
alter table public.booking_transactions
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- 4. Persist approval state remotely (was local-only). Survives browser clears
--    and is visible across devices.
alter table public.owner_applications
  add column if not exists approved boolean not null default false,
  add column if not exists approved_at timestamptz;

alter table public.review_submissions
  add column if not exists approved boolean not null default false,
  add column if not exists approved_at timestamptz;

-- 5. Indexes for owner-scoped queries
create index if not exists review_submissions_owner_user_id_idx
  on public.review_submissions (owner_user_id)
  where owner_user_id is not null;

create index if not exists management_listings_owner_id_idx
  on public.management_listings (owner_id)
  where owner_id is not null;

create index if not exists booking_transactions_owner_id_idx
  on public.booking_transactions (owner_id)
  where owner_id is not null;

-- 6. RLS: owners can read their own requests, staycations and bookings.
--    These are ADDITIVE — existing public/management policies are untouched so
--    clients can still read published listings and owners can still act as
--    clients. The owner policies only gate the owner-dashboard-scoped rows.

-- Owners can select their own evaluation requests
drop policy if exists "owners_can_select_own_review_submissions" on public.review_submissions;
create policy "owners_can_select_own_review_submissions"
  on public.review_submissions
  for select
  to authenticated
  using (owner_user_id = auth.uid());

-- Owners can select their own staycations (listings). Public published-listing
-- reads for clients are still allowed by the existing public select policy.
drop policy if exists "owners_can_select_own_management_listings" on public.management_listings;
create policy "owners_can_select_own_management_listings"
  on public.management_listings
  for select
  to authenticated
  using (owner_id = auth.uid());

-- Owners can select bookings on their own staycations
drop policy if exists "owners_can_select_own_booking_transactions" on public.booking_transactions;
create policy "owners_can_select_own_booking_transactions"
  on public.booking_transactions
  for select
  to authenticated
  using (owner_id = auth.uid());
