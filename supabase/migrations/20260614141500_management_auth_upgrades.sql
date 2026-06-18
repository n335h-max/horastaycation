alter table public.booking_transactions
add column if not exists booking_status text not null default 'confirmed';

alter table public.management_listings
add column if not exists publish_status text not null default 'published';

alter table public.management_listings
add column if not exists availability_notes text not null default '';

alter table public.management_listings
add column if not exists blocked_dates jsonb not null default '[]'::jsonb;

alter table public.management_listings
add column if not exists is_deleted boolean not null default false;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  preferred_role text not null default 'client',
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "public_can_update_booking_transactions" on public.booking_transactions;
create policy "public_can_update_booking_transactions"
on public.booking_transactions
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
