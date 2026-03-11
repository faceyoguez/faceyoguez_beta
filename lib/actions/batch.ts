'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createBatch(formData: {
  name: string;
  start_date: string;
  end_date: string;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // 1. Create Batch
  const { data: batch, error } = await supabase.from('batches').insert({
    name: formData.name,
    start_date: formData.start_date,
    end_date: formData.end_date,
    instructor_id: user.id,
    status: 'upcoming'
  }).select().single();

  if (error) throw new Error(error.message);

  // 2. Create linked Conversation automatically
  const { data: convo } = await supabase.from('conversations').insert({
    type: 'group',
    title: `${formData.name} Chat`,
    batch_id: batch.id,
    is_chat_enabled: true
  }).select().single();

  if (convo) {
    await supabase.from('batches').update({ conversation_id: convo.id }).eq('id', batch.id);
  }

  revalidatePath('/instructor/group-session');
  return batch;
}

export async function getInstructorBatches() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function activateBatch(batchId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Update batch status
  const { error: activateError } = await supabase
    .from('batches')
    .update({ status: 'active' })
    .eq('id', batchId);

  if (activateError) throw new Error(activateError.message);

  // 2. Process Waiting Queue (New Purchases)
  const { data: waitingQueue } = await supabase
    .from('waiting_queue')
    .select('*')
    .eq('status', 'waiting');

  if (waitingQueue && waitingQueue.length > 0) {
    for (const wu of waitingQueue) {
      // Enroll Waitlister
      await supabase.from('batch_enrollments').insert({
        batch_id: batchId,
        student_id: wu.student_id,
        subscription_id: wu.subscription_id,
        status: 'active',
      });

      // Update queue status
      await supabase.from('waiting_queue').update({ status: 'assigned' }).eq('id', wu.id);

      // Activate subscription if start_date is null
      await supabase
        .from('subscriptions')
        .update({
          start_date: new Date().toISOString(),
          status: 'active'
        })
        .eq('id', wu.subscription_id)
        .is('start_date', null);
    }
  }

  // 3. Process Multi-Month Rollovers
  // Users with active group subs who aren't currently in an active batch
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('id, student_id, batches_remaining')
    .eq('plan_type', 'group_session')
    .eq('status', 'active')
    .gt('batches_remaining', 0);

  if (activeSubs && activeSubs.length > 0) {
    for (const sub of activeSubs) {
      // Check if already in an active batch
      const { data: currentEnrollment } = await supabase
        .from('batch_enrollments')
        .select('id')
        .eq('student_id', sub.student_id)
        .eq('status', 'active')
        .limit(1);

      if (!currentEnrollment || currentEnrollment.length === 0) {
        // Rollover: Enroll them in this new batch
        await supabase.from('batch_enrollments').insert({
          batch_id: batchId,
          student_id: sub.student_id,
          subscription_id: sub.id,
          status: 'active',
        });

        // Decrement batches remaining
        await supabase.from('subscriptions')
          .update({ batches_remaining: sub.batches_remaining - 1 })
          .eq('id', sub.id);
      }
    }
  }

  revalidatePath('/instructor/group-session');
  return { success: true };
}

export async function enrollInWaitlist(studentId: string, subscriptionId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('waiting_queue').insert({
    student_id: studentId,
    subscription_id: subscriptionId,
    status: 'waiting'
  });

  if (error) throw new Error(error.message);
  return { success: true };
}
