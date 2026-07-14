-- Add proper contact columns to review_submissions and owner_applications
--
-- Background: the dashboard "Owner Leads & Evaluation Requests" cards need
-- name, email, phone, address and unit count to render. owner_applications
-- already stores most of these in real columns (owner_email, owner_phone,
-- property_location, max_guests), but review_submissions crammed them into
-- free-text fields (review_text, cleanliness) with no email or phone column
-- at all. As a result evaluation-request phones could not survive a browser
-- clear or appear on another device — there was nowhere to read them from.
--
-- This migration adds the missing structured columns so the contact info can
-- be persisted on submit and read back into the dashboard from the database.
-- Legacy rows keep their crammed data; the mapper falls back to it.

-- review_submissions: evaluator contact details
alter table public.review_submissions
  add column if not exists contact_phone text not null default '';

alter table public.review_submissions
  add column if not exists evaluator_email text not null default '';

alter table public.review_submissions
  add column if not exists evaluator_address text not null default '';

alter table public.review_submissions
  add column if not exists unit_count text not null default '';

-- owner_applications: budget as a real column (previously only embedded in
-- property_description / amenities)
alter table public.owner_applications
  add column if not exists budget text not null default '';
