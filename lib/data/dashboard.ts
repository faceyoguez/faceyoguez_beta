import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * getStudentSubscriptions — Cross-request cached (60s).
 * Called in both layout and page; unstable_cache means second+ requests
 * within the TTL window skip the DB entirely.
 * Tagged so it can be invalidated on purchase.
 */
export const getStudentSubscriptions = cache(async (studentId: string) =>
  unstable_cache(
    async (id: string) => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('subscriptions')
        .select('id, status, plan_type, amount, duration_months, start_date, end_date, is_trial, student_id, created_at, updated_at, payment_id')
        .eq('student_id', id)
        .order('created_at', { ascending: false });
      if (error) console.error('Error fetching subscriptions:', error);
      return data || [];
    },
    ['subscriptions', studentId],
    { revalidate: 60, tags: ['subscriptions', `subscriptions-${studentId}`] }
  )(studentId)
);

/**
 * getStudentEnrollments — Cross-request cached (120s).
 * Enrollments change rarely (admin action required).
 */
export const getStudentEnrollments = cache(async (studentId: string) =>
  unstable_cache(
    async (id: string) => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('batch_enrollments')
        .select('batch_id, status')
        .eq('student_id', id)
        .in('status', ['active', 'extended']);
      if (error) console.error('Error fetching enrollments:', error);
      return data || [];
    },
    ['enrollments', studentId],
    { revalidate: 120, tags: ['enrollments', `enrollments-${studentId}`] }
  )(studentId)
);

/**
 * getStudentNotificationsCount — Cross-request cached (30s).
 * Short TTL so new notifications appear within ~30s.
 */
export const getStudentNotificationsCount = cache(async (userId: string) =>
  unstable_cache(
    async (id: string) => {
      const admin = createAdminClient();
      const { count, error } = await admin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id)
        .eq('is_read', false);
      if (error) console.error('Error fetching notifications count:', error.message || error, error.code || '');
      return count || 0;
    },
    ['notifications-count', userId],
    { revalidate: 30, tags: ['notifications', `notifications-${userId}`] }
  )(userId)
);

/**
 * getStudentJourneyLogs — Cross-request cached (120s).
 * Journey logs are append-only and change at most once per day.
 */
export const getStudentJourneyLogs = cache(async (studentId: string) =>
  unstable_cache(
    async (id: string) => {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('journey_logs')
        .select('*')
        .eq('student_id', id)
        .order('day_number', { ascending: true });
      if (error) console.error('Error fetching journey logs:', error);
      return data || [];
    },
    ['journey-logs', studentId],
    { revalidate: 120, tags: ['journey-logs', `journey-logs-${studentId}`] }
  )(studentId)
);

