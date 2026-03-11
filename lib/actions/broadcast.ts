'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AudienceType, MessageContentType } from '@/types/database';

export async function sendBroadcastAction(formData: {
  title: string;
  content: string;
  target_audience: AudienceType;
  target_batch_id?: string;
  file_url?: string;
  file_name?: string;
  content_type?: MessageContentType;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // 1. Insert the Broadcast itself
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .insert({
        sender_id: user.id,
        title: formData.title,
        content: formData.content,
        target_audience: formData.target_audience,
        target_batch_id: formData.target_batch_id || null,
        file_url: formData.file_url || null,
        file_name: formData.file_name || null,
        content_type: formData.content_type || 'text',
      })
      .select('*')
      .single();

    if (broadcastError) throw broadcastError;

    // 2. Determine target user IDs Based on Audience
    let targetUserIds: string[] = [];

    if (formData.target_audience === 'all') {
      // Send to ALL active students
      const { data: activeSubs } = await supabase
        .from('subscriptions')
        .select('student_id')
        .eq('status', 'active');

      targetUserIds = [...new Set((activeSubs || []).map(s => s.student_id))];

    } else if (formData.target_audience === 'one_on_one') {
      // Send to all active 1-on-1 default students
      const { data: oneOnOneSubs } = await supabase
        .from('subscriptions')
        .select('student_id')
        .eq('plan_type', 'one_on_one')
        .eq('status', 'active');

      targetUserIds = [...new Set((oneOnOneSubs || []).map(s => s.student_id))];

    } else if (formData.target_audience === 'group_session') {

      if (formData.target_batch_id) {
        // Specific Batch Participants
        const { data: enrolls } = await supabase
          .from('batch_enrollments')
          .select('student_id')
          .eq('batch_id', formData.target_batch_id)
          .in('status', ['active', 'extended', 'completed']); // include everyone that got the content

        targetUserIds = [...new Set((enrolls || []).map(e => e.student_id))];
      } else {
        // All active Group Session plan subscribers (even if unassigned)
        const { data: groupSubs } = await supabase
          .from('subscriptions')
          .select('student_id')
          .eq('plan_type', 'group_session')
          .eq('status', 'active');

        targetUserIds = [...new Set((groupSubs || []).map(s => s.student_id))];
      }

    } else if (formData.target_audience === 'lms') {
      const { data: lmsSubs } = await supabase
        .from('subscriptions')
        .select('student_id')
        .eq('plan_type', 'lms')
        .eq('status', 'active');

      targetUserIds = [...new Set((lmsSubs || []).map(s => s.student_id))];
    }

    if (targetUserIds.length === 0) {
      // Clean up if no recipients? Actually keep the history of the sent message
      return { success: true, count: 0 };
    }

    // 3. Create the notifications payload in a transaction if possible, or bulk insert
    const notificationsData = targetUserIds.map((userId) => ({
      user_id: userId,
      broadcast_id: broadcast.id,
      title: formData.title,
      message: formData.content,
      type: 'broadcast',
      is_read: false
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationsData);

    if (notifError) throw notifError;

    revalidatePath('/instructor/broadcast');
    return { success: true, count: targetUserIds.length };

  } catch (err: any) {
    console.error('Broadcast Error:', err);
    return { success: false, error: err.message };
  }
}

export async function getInstructorBroadcasts() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('broadcasts')
    .select(`
            *,
            batches!target_batch_id(name),
            notifications(count) 
        `)
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch broadcasts error:", error);
    return [];
  }

  return data || [];
}

export async function uploadBroadcastResource(
  fileName: string,
  contentType: string,
  size: number,
  base64Data: string
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const { v4: uuidv4 } = require('uuid');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `broadcasts/${user.id}/${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(uniqueFileName, buffer, { contentType, upsert: false });

    if (uploadError) return { success: false, error: 'Failed to upload file to storage.' };

    const { data: publicUrlData } = supabase.storage
      .from('resources')
      .getPublicUrl(uniqueFileName);

    return { success: true, url: publicUrlData.publicUrl, name: fileName };
  } catch (error) {
    return { success: false, error: 'Unexpected error occurred.' };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { success: false };
  revalidatePath('/student/broadcasts');
  revalidatePath('/student/dashboard'); // For any dashboard summary
  return { success: true };
}
