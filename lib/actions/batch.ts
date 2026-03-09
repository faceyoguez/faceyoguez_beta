'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createBatch(formData: {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  max_students: number;
  plan_type: string;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('batches').insert({
    ...formData,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/instructor/groups');
}
