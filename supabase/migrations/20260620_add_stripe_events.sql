-- Migration: add stripe_events table for webhook idempotency

create table if not exists public.stripe_events (
  id bigint primary key generated always as identity,
  event_id text not null unique,
  event_type text not null default '',
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

drop policy if exists "management_can_select_stripe_events" on public.stripe_events;
create policy "management_can_select_stripe_events"
on public.stripe_events
for select
to authenticated
using (public.is_management_user());
