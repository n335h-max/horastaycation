create extension if not exists pgcrypto;

create table if not exists public.owner_applications (
  id uuid primary key default gen_random_uuid(),
  owner_first_name text not null,
  owner_last_name text not null,
  owner_email text not null,
  owner_phone text not null,
  property_name text not null,
  property_type text not null,
  property_location text not null,
  property_description text not null,
  price_per_night numeric not null,
  max_guests integer not null,
  amenities jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);

create table if not exists public.review_submissions (
  id uuid primary key default gen_random_uuid(),
  review_property text not null,
  reviewer_name text not null,
  stay_date text not null,
  rating integer not null,
  cleanliness text not null,
  location text not null,
  amenities text not null,
  value text not null,
  review_text text not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.booking_transactions (
  id uuid primary key default gen_random_uuid(),
  property_id text not null,
  property_name text not null,
  property_location text not null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  guests integer not null,
  checkin_date date not null,
  checkout_date date not null,
  nights integer not null,
  subtotal numeric not null,
  service_fee numeric not null,
  total numeric not null,
  special_requests text,
  payment_last4 text,
  submitted_at timestamptz not null default now()
);

alter table public.owner_applications enable row level security;
alter table public.review_submissions enable row level security;
alter table public.booking_transactions enable row level security;

drop policy if exists "public_can_insert_owner_applications" on public.owner_applications;
create policy "public_can_insert_owner_applications"
on public.owner_applications
for insert
to anon, authenticated
with check (true);

drop policy if exists "public_can_insert_review_submissions" on public.review_submissions;
create policy "public_can_insert_review_submissions"
on public.review_submissions
for insert
to anon, authenticated
with check (true);

drop policy if exists "public_can_insert_booking_transactions" on public.booking_transactions;
create policy "public_can_insert_booking_transactions"
on public.booking_transactions
for insert
to anon, authenticated
with check (true);
