'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function activateTrial(userId: string) {
  const admin = createAdminClient();

  // 1. Check if user already has a trial record
  const { data: existingTrials } = await admin
    .from('subscriptions')
    .select('id')
    .eq('student_id', userId)
    .eq('is_trial', true)
    .limit(1);

  if (existingTrials && existingTrials.length > 0) {
    return { success: false, error: 'You have already used your free trial.' };
  }

  // 2. Block trial if the student already has an active paid subscription
  const today = new Date().toISOString().split('T')[0];
  const { data: activePaidSubs } = await admin
    .from('subscriptions')
    .select('id')
    .eq('student_id', userId)
    .eq('status', 'active')
    .eq('is_trial', false)
    .gte('end_date', today)
    .limit(1);

  if (activePaidSubs && activePaidSubs.length > 0) {
    return { success: false, error: 'You already have an active subscription. The free trial is only for new students.' };
  }

  // 2. Create a 3-day trial subscription that covers ALL services
  // Actually, for "all services", we'll create a single subscription for 'one_on_one' (highest tier)
  // but the user said "gives access to all services for 3 days".
  // So we'll iterate through all plan_types or create a dummy sub that we check for manually.
  // Actually, let's create a subscription for 'one_on_one' with is_trial = true.
  // Then we check globally if user has ANY active subscription.
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 3);

  const { data, error } = await admin
    .from('subscriptions')
    .insert({
      student_id: userId,
      plan_type: 'one_on_one',
      status: 'active',
      is_trial: true,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      duration_months: 0,
      amount: 0,
      metadata: { trial_type: 'full_access' }
    });

  if (error) {
    console.error('Trial creation failed:', error);
    return { success: false, error: 'Failed to create trial' };
  }

  revalidatePath('/student/plans');
  revalidatePath('/(dashboard)', 'layout');
  return { success: true };
}
