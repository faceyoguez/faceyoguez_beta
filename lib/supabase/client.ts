import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Prevent build-time crashes if env vars are missing during pre-rendering
  if (!url || !key) {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
        resetPasswordForEmail: async () => ({ error: new Error('Supabase not configured') }),
      },
    } as any;
  }

  return createBrowserClient(url, key);
}

