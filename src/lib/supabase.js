import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_BUCKETS = {
  listingImages: 'listing-images',
  listingVideos: 'listing-videos',
};

export const MANAGEMENT_EMAILS = String(import.meta.env.VITE_MANAGEMENT_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

export function isManagementEmailAllowed(email) {
  return MANAGEMENT_EMAILS.includes(String(email || '').trim().toLowerCase());
}
