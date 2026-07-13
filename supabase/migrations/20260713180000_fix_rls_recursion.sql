-- Fix: break infinite RLS recursion in is_management_user() and user_has_role()
--
-- Root cause: is_management_user() queries public.management_users, but that
-- table's own RLS select policy calls is_management_user() -> infinite
-- recursion -> PostgreSQL error 54001 "stack depth limit exceeded". This made
-- every authenticated listing upsert fail with an RLS violation, so the app
-- fell back to "Listing saved locally. Run the Supabase schema...".
--
-- Fix: mark both helper functions SECURITY DEFINER so they execute with the
-- function owner's privileges and bypass row-level security on the tables
-- they read. This is the documented Supabase pattern for RLS helper
-- functions that must read from RLS-protected tables.
--
-- Also grant execute to authenticated/anon so the functions remain callable
-- from PostgREST requests.

create or replace function public.is_management_user()
returns boolean
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
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

revoke all on function public.is_management_user() from public;
revoke all on function public.user_has_role(text) from public;
grant execute on function public.is_management_user() to anon, authenticated;
grant execute on function public.user_has_role(text) to anon, authenticated;
