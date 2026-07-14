-- Drop the redundant owner_email snapshot from management_listings.
--
-- Owner email is now resolved server-side from owner_id (auth.users) whenever a
-- notification needs to be sent — single source of truth, no duplicated data
-- that can go stale if the owner changes their email. See resolveOwnerEmail in
-- api/_lib/supabaseAdmin.js and the owner_booking_alert paths in
-- api/send-email.js + api/stripe-webhook.js.

alter table public.management_listings
  drop column if exists owner_email;
