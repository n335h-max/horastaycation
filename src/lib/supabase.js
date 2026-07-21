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

let clientInstance = null;
let clientPromise = null;

/**
 * Dynamically loads and initializes the Supabase client on demand.
 * Keeps @supabase/supabase-js out of the initial homepage bundle.
 */
export async function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (clientInstance) return clientInstance;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      clientInstance = createClient(supabaseUrl, supabasePublishableKey);
      return clientInstance;
    });
  }
  return clientPromise;
}

/**
 * Transparent proxy for legacy synchronous reference checks and API calls.
 */
export const supabase = isSupabaseConfigured
  ? new Proxy(
      {},
      {
        get(_target, prop) {
          if (clientInstance) {
            return clientInstance[prop];
          }
          if (prop === 'auth') {
            return new Proxy(
              {},
              {
                get(_t, authProp) {
                  if (authProp === 'onAuthStateChange') {
                    return (callback) => {
                      let subscription = null;
                      let unsubscribed = false;
                      getSupabase().then((client) => {
                        if (unsubscribed || !client) return;
                        const res = client.auth.onAuthStateChange(callback);
                        subscription = res?.data?.subscription;
                      });
                      return {
                        data: {
                          subscription: {
                            unsubscribe: () => {
                              unsubscribed = true;
                              if (subscription) subscription.unsubscribe();
                            },
                          },
                        },
                      };
                    };
                  }
                  return async (...args) => {
                    const client = await getSupabase();
                    if (!client) return { data: { session: null, user: null }, error: null };
                    const targetFunc = client.auth[authProp];
                    if (typeof targetFunc === 'function') {
                      return targetFunc.apply(client.auth, args);
                    }
                    return client.auth[authProp];
                  };
                },
              },
            );
          }
          if (prop === 'from') {
            return (...args) => ({
              select: (...sArgs) => getSupabase().then((c) => c ? c.from(...args).select(...sArgs) : { data: null, error: null }),
              insert: (...iArgs) => getSupabase().then((c) => c ? c.from(...args).insert(...iArgs) : { error: null }),
              upsert: (...uArgs) => getSupabase().then((c) => c ? c.from(...args).upsert(...uArgs) : { data: null, error: null }),
              update: (...upArgs) => getSupabase().then((c) => c ? c.from(...args).update(...upArgs) : { data: null, error: null }),
              delete: (...dArgs) => getSupabase().then((c) => c ? c.from(...args).delete(...dArgs) : { error: null }),
            });
          }
          if (prop === 'storage') {
            return {
              from: (bucket) => ({
                upload: (...args) => getSupabase().then((c) => c ? c.storage.from(bucket).upload(...args) : { error: null }),
                getPublicUrl: (...args) => (clientInstance ? clientInstance.storage.from(bucket).getPublicUrl(...args) : { data: { publicUrl: '' } }),
              }),
            };
          }
          return undefined;
        },
      },
    )
  : null;

export function isManagementEmailAllowed(email) {
  return MANAGEMENT_EMAILS.includes(
    String(email || '')
      .trim()
      .toLowerCase(),
  );
}
