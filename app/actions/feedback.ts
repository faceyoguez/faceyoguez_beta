'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { revalidatePath } from 'next/cache';
import { sendFeedbackThankYouEmail } from '@/lib/email/sender';

export async function submitExitFeedback(data: {
  plan_taken: string;
  rating?: number;
  comments: string;
  improvement_suggestions?: string;
}) {
  const user = await getServerUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('exit_feedbacks')
    .insert({
      student_id: user.id,
      ...data
    });

  if (error) {
    console.error('Failed to submit feedback:', error);
    throw new Error('Database Error: ' + error.message);
  }

  // ── Send feedback thank-you email (non-blocking) ──────────────
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const userEmail = profile?.email || user.email;
    const rawName = profile?.full_name || 'there';
    const firstName = rawName.split(' ')[0];

    if (userEmail) {
      sendFeedbackThankYouEmail(userEmail, {
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
        rating: data.rating,
        comments: data.comments,
        planTaken: data.plan_taken,
      }).catch(err => console.error('[Email] Feedback thank-you failed (non-fatal):', err));
    }
  } catch (emailErr) {
    console.error('[Email] Feedback email setup failed (non-fatal):', emailErr);
  }

  revalidatePath('/staff/feedbacks');
  return { success: true };
}


export async function getExitFeedbacks() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('exit_feedbacks')
    .select(`
      *,
      student:profiles!exit_feedbacks_student_id_fkey(full_name, avatar_url, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feedbacks:', error);
    return [];
  }

  // Enhance with photo data — get first and latest from journey_logs
  const feedbacksWithPhotos = await Promise.all(data.map(async (fb) => {
    const { data: logs } = await admin
      .from('journey_logs')
      .select('photo_url, day_number')
      .eq('student_id', fb.student_id)
      .order('day_number', { ascending: true });

    const firstPhoto = logs?.[0]?.photo_url || null;
    const latestPhoto = (logs && logs.length > 1) ? logs[logs.length - 1].photo_url : null;

    return {
      ...fb,
      firstPhoto,
      latestPhoto
    };
  }));

  return feedbacksWithPhotos;
}
