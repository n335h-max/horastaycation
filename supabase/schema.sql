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
  booking_status text not null default 'confirmed',
  submitted_at timestamptz not null default now()
);

create table if not exists public.management_listings (
  id text primary key,
  name text not null,
  location text not null,
  price numeric not null default 0,
  rating_label text not null default '5.0',
  review_count integer not null default 0,
  badge text not null default 'Featured Stay',
  badge_icon text not null default 'star',
  status_note text not null default '',
  mood text not null default '',
  best_for text not null default '',
  image text not null default '',
  summary_image text not null default '',
  thumbnail text not null default '',
  video_url text not null default '',
  schedule text not null default '',
  publish_status text not null default 'published',
  availability_notes text not null default '',
  blocked_dates jsonb not null default '[]'::jsonb,
  is_deleted boolean not null default false,
  amenities jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  available_roles text[] not null default array['client'],
  preferred_role text not null default 'client',
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
add column if not exists available_roles text[] not null default array['client'];

update public.user_profiles
set available_roles = array[preferred_role, 'client']
where available_roles is null
   or array_length(available_roles, 1) is null;

alter table public.owner_applications enable row level security;
alter table public.review_submissions enable row level security;
alter table public.booking_transactions enable row level security;
alter table public.management_listings enable row level security;
alter table public.user_profiles enable row level security;

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

drop policy if exists "public_can_update_booking_transactions" on public.booking_transactions;
create policy "public_can_update_booking_transactions"
on public.booking_transactions
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "public_can_select_management_listings" on public.management_listings;
create policy "public_can_select_management_listings"
on public.management_listings
for select
to anon, authenticated
using (true);

drop policy if exists "public_can_insert_management_listings" on public.management_listings;
create policy "public_can_insert_management_listings"
on public.management_listings
for insert
to anon, authenticated
with check (true);

drop policy if exists "public_can_update_management_listings" on public.management_listings;
create policy "public_can_update_management_listings"
on public.management_listings
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "users_can_select_own_profile" on public.user_profiles;
create policy "users_can_select_own_profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_can_insert_own_profile" on public.user_profiles;
create policy "users_can_insert_own_profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users_can_update_own_profile" on public.user_profiles;
create policy "users_can_update_own_profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-videos', 'listing-videos', true)
on conflict (id) do nothing;

drop policy if exists "public_can_read_listing_media" on storage.objects;
create policy "public_can_read_listing_media"
on storage.objects
for select
to public
using (bucket_id in ('listing-images', 'listing-videos'));

drop policy if exists "public_can_upload_listing_media" on storage.objects;
create policy "public_can_upload_listing_media"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id in ('listing-images', 'listing-videos'));

drop policy if exists "public_can_update_listing_media" on storage.objects;
create policy "public_can_update_listing_media"
on storage.objects
for update
to anon, authenticated
using (bucket_id in ('listing-images', 'listing-videos'))
with check (bucket_id in ('listing-images', 'listing-videos'));
