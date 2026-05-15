import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * getStudentSubscriptions - Cached per request.
 */
export const getStudentSubscriptions = cache(async (studentId: string) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('subscriptions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  if (error) console.error('Error fetching subscriptions:', error);
  return data || [];
});

/**
 * getStudentEnrollments - Cached per request.
 */
export const getStudentEnrollments = cache(async (studentId: string) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('batch_enrollments')
    .select('batch_id, status')
    .eq('student_id', studentId)
    .in('status', ['active', 'extended']);

  if (error) console.error('Error fetching enrollments:', error);
  return data || [];
});

/**
 * getStudentNotificationsCount - Cached per request.
 */
export const getStudentNotificationsCount = cache(async (userId: string) => {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) console.error('Error fetching notifications count:', error);
  return count || 0;
});

/**
 * getStudentJourneyLogs - Cached per request.
 */
export const getStudentJourneyLogs = cache(async (studentId: string) => {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('journey_logs')
    .select('*')
    .eq('student_id', studentId)
    .order('day_number', { ascending: true });

  if (error) console.error('Error fetching journey logs:', error);
  return data || [];
});
