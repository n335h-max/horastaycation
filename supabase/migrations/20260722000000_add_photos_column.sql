-- Add photos jsonb array column to management_listings, matching gallery_images for schema completeness.
alter table public.management_listings
add column if not exists photos jsonb not null default '[]'::jsonb;
