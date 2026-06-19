alter table public.user_profiles
add column if not exists available_roles text[] not null default array['client'];

update public.user_profiles
set available_roles = array[preferred_role, 'client']
where available_roles is null
   or array_length(available_roles, 1) is null;

create table if not exists public.management_users (
  email text primary key,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.owner_applications
add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.booking_transactions
add column if not exists client_user_id uuid references auth.users(id) on delete set null;

alter table public.management_listings
add column if not exists updated_by uuid references auth.users(id) on delete set null;

create or replace function public.is_management_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.management_users management_user
    where lower(management_user.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and management_user.is_active = true
  );
$$;

create or replace function public.user_has_role(target_role text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and (
        target_role = any(coalesce(profile.available_roles, array['client']))
        or profile.preferred_role = target_role
      )
  );
$$;

alter table public.management_users enable row level security;

drop policy if exists "public_can_insert_owner_applications" on public.owner_applications;
drop policy if exists "owners_can_insert_own_applications" on public.owner_applications;
create policy "owners_can_insert_own_applications"
on public.owner_applications
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and public.user_has_role('owner')
);

drop policy if exists "owners_and_management_can_select_owner_applications" on public.owner_applications;
create policy "owners_and_management_can_select_owner_applications"
on public.owner_applications
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.is_management_user()
);

drop policy if exists "public_can_insert_booking_transactions" on public.booking_transactions;
drop policy if exists "clients_can_insert_own_booking_transactions" on public.booking_transactions;
create policy "clients_can_insert_own_booking_transactions"
on public.booking_transactions
for insert
to authenticated
with check (
  client_user_id = auth.uid()
  and public.user_has_role('client')
);

drop policy if exists "clients_and_management_can_select_booking_transactions" on public.booking_transactions;
create policy "clients_and_management_can_select_booking_transactions"
on public.booking_transactions
for select
to authenticated
using (
  client_user_id = auth.uid()
  or public.is_management_user()
);

drop policy if exists "public_can_update_booking_transactions" on public.booking_transactions;
drop policy if exists "management_can_update_booking_transactions" on public.booking_transactions;
create policy "management_can_update_booking_transactions"
on public.booking_transactions
for update
to authenticated
using (public.is_management_user())
with check (public.is_management_user());

drop policy if exists "public_can_insert_management_listings" on public.management_listings;
drop policy if exists "management_can_insert_management_listings" on public.management_listings;
create policy "management_can_insert_management_listings"
on public.management_listings
for insert
to authenticated
with check (
  public.is_management_user()
  and updated_by = auth.uid()
);

drop policy if exists "public_can_update_management_listings" on public.management_listings;
drop policy if exists "management_can_update_management_listings" on public.management_listings;
create policy "management_can_update_management_listings"
on public.management_listings
for update
to authenticated
using (public.is_management_user())
with check (
  public.is_management_user()
  and updated_by = auth.uid()
);

drop policy if exists "management_can_delete_management_listings" on public.management_listings;
create policy "management_can_delete_management_listings"
on public.management_listings
for delete
to authenticated
using (public.is_management_user());

drop policy if exists "management_users_are_private" on public.management_users;
create policy "management_users_are_private"
on public.management_users
for select
to authenticated
using (public.is_management_user());

drop policy if exists "public_can_upload_listing_media" on storage.objects;
drop policy if exists "management_can_upload_listing_media" on storage.objects;
create policy "management_can_upload_listing_media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('listing-images', 'listing-videos')
  and public.is_management_user()
);

drop policy if exists "public_can_update_listing_media" on storage.objects;
drop policy if exists "management_can_update_listing_media" on storage.objects;
create policy "management_can_update_listing_media"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('listing-images', 'listing-videos')
  and public.is_management_user()
)
with check (
  bucket_id in ('listing-images', 'listing-videos')
  and public.is_management_user()
);

drop policy if exists "management_can_delete_listing_media" on storage.objects;
create policy "management_can_delete_listing_media"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('listing-images', 'listing-videos')
  and public.is_management_user()
);
