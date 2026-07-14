-- Authorize hijaugrouplandscape@gmail.com as a management login.
--
-- management_users is the server-side gate checked by is_management_user() /
-- requireManagementUser (api/_lib/auth.js). The client allowlist
-- (VITE_MANAGEMENT_EMAILS) is the matching client-side gate. Management login
-- is restricted to ONLY n33sh07@gmail.com and hijaugrouplandscape@gmail.com.
--
-- Note: this authorizes the email; the person must still create a Supabase auth
-- account with this email to actually sign in.

insert into public.management_users (email, is_active)
values ('hijaugrouplandscape@gmail.com', true)
on conflict (email) do update
set is_active = true;
