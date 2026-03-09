'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createBroadcast(formData: {
  title: string;
  content: string;
  target_audience: string;
  target_batch_id?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('broadcasts').insert({
    sender_id: user.id,
    ...formData,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/instructor/broadcast');
}
