-- Add an ordered gallery of photo URLs per management listing.
--
-- gallery_images is a jsonb array of public Supabase storage URLs (strings),
-- kept in display order. Reordering is just array order. Existing listings
-- default to '[]' so they keep working unchanged (backward compatible).
--
-- The existing single-image fields (image, summary_image, thumbnail) are kept
-- as-is for backward compatibility; the gallery is additive. When a listing has
-- gallery images but no explicit thumbnail, the first gallery image is used as
-- the card thumbnail fallback (handled in the app mapper, not here).

alter table public.management_listings
add column if not exists gallery_images jsonb not null default '[]'::jsonb;
