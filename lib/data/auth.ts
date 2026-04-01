import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

/**
 * getServerUser — React.cache() deduplicates within a single server render.
 * Auth tokens change frequently, so we don't use unstable_cache here.
 */
export const getServerUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
});

/**
 * getServerProfile — React.cache() for within-request dedup +
 * unstable_cache for cross-request caching (60s TTL).
 * Profile data changes rarely; 60s stale is acceptable.
 * Tagged 'profile' so it can be invalidated on profile update.
 */
const _fetchProfile = unstable_cache(
  async (userId: string) => {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return profile ?? null;
  },
  ['profile'],
  { revalidate: 60, tags: ['profile'] }
);

export const getServerProfile = cache(_fetchProfile);
