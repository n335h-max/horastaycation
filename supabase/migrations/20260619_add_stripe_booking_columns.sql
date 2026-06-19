alter table public.booking_transactions
add column if not exists payment_provider text not null default 'manual';

alter table public.booking_transactions
add column if not exists payment_status text not null default 'paid';

alter table public.booking_transactions
add column if not exists stripe_session_id text;

alter table public.booking_transactions
add column if not exists stripe_payment_intent_id text;

alter table public.booking_transactions
add column if not exists stripe_refund_id text;

alter table public.booking_transactions
add column if not exists refund_status text;

alter table public.booking_transactions
add column if not exists refunded_at timestamptz;

alter table public.booking_transactions
add column if not exists cancelled_at timestamptz;

alter table public.booking_transactions
add column if not exists customer_receipt_email text;

alter table public.booking_transactions
add column if not exists status_note text;

create unique index if not exists booking_transactions_stripe_session_id_idx
on public.booking_transactions (stripe_session_id)
where stripe_session_id is not null;

create index if not exists booking_transactions_stripe_payment_intent_id_idx
on public.booking_transactions (stripe_payment_intent_id)
where stripe_payment_intent_id is not null;
