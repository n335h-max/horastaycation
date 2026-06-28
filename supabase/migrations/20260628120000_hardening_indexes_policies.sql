alter table public.booking_transactions
drop constraint if exists booking_transactions_payment_status_check;

alter table public.booking_transactions
add constraint booking_transactions_payment_status_check
check (payment_status in ('paid', 'pending', 'refunded', 'failed', 'cancelled'));

alter table public.booking_transactions
drop constraint if exists booking_transactions_booking_status_check;

alter table public.booking_transactions
add constraint booking_transactions_booking_status_check
check (booking_status in ('confirmed', 'pending', 'cancelled', 'completed', 'refunded'));

alter table public.booking_transactions
add column if not exists client_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists booking_transactions_stripe_session_id_idx
on public.booking_transactions (stripe_session_id)
where stripe_session_id is not null;

create index if not exists booking_transactions_stripe_payment_intent_id_idx
on public.booking_transactions (stripe_payment_intent_id)
where stripe_payment_intent_id is not null;

create index if not exists booking_transactions_stripe_refund_id_idx
on public.booking_transactions (stripe_refund_id)
where stripe_refund_id is not null;

create index if not exists booking_transactions_client_user_id_idx
on public.booking_transactions (client_user_id)
where client_user_id is not null;

create index if not exists booking_transactions_property_id_idx
on public.booking_transactions (property_id);

create index if not exists owner_applications_owner_user_id_idx
on public.owner_applications (owner_user_id)
where owner_user_id is not null;

create index if not exists management_listings_publish_status_deleted_idx
on public.management_listings (publish_status, is_deleted);

create index if not exists management_users_email_lower_idx
on public.management_users (lower(email));

create index if not exists user_profiles_email_lower_idx
on public.user_profiles (lower(email));

alter table public.review_submissions enable row level security;

drop policy if exists "management_can_select_review_submissions" on public.review_submissions;
create policy "management_can_select_review_submissions"
on public.review_submissions
for select
to authenticated
using (public.is_management_user());
