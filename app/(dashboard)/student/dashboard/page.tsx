import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { StudentDashboardClient } from './StudentDashboardClient';

export default async function StudentDashboardPage() {
  // ─── Auth & Profile (cached — shared with layout, no extra round-trip) ───
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const profile = await getServerProfile(user.id);
  if (!profile || profile.role !== 'student') redirect('/auth/login');

  // ─── Subscriptions + photos in parallel ──────────────────────────
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const [
    { data: subscriptions },
    { data: oneOnOneMeetings },
    { data: enrollments },
    { data: firstPhoto },
    { data: latestPhoto },
  ] = await Promise.all([
    admin
      .from('subscriptions')
      .select('*')
      .eq('student_id', user.id)
      .in('status', ['active', 'pending'])
      .order('start_date', { ascending: true }),
    admin
      .from('meetings')
      .select('*')
      .eq('student_id', user.id)
      .eq('meeting_type', 'one_on_one')
      .gte('start_time', todayStart)
      .lte('start_time', todayEnd)
      .order('start_time', { ascending: true }),
    admin
      .from('batch_enrollments')
      .select('batch_id')
      .eq('student_id', user.id)
      .in('status', ['active', 'extended']),
    admin
      .from('journey_logs')
      .select('*')
      .eq('student_id', user.id)
      .not('photo_url', 'is', null)
      .order('day_number', { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from('journey_logs')
      .select('*')
      .eq('student_id', user.id)
      .not('photo_url', 'is', null)
      .order('day_number', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const activeSubs = subscriptions || [];

  const joinedDate = activeSubs.length > 0 && activeSubs[0].start_date
    ? new Date(activeSubs[0].start_date)
    : null;

  const lastRenewed = activeSubs.length > 0
    ? activeSubs.reduce((latest, sub) => {
        if (!sub.start_date) return latest;
        const d = new Date(sub.start_date);
        return !latest || d > latest ? d : latest;
      }, null as Date | null)
    : null;

  const furthestEndDate = activeSubs.reduce((furthest, sub) => {
    if (!sub.end_date) return furthest;
    const d = new Date(sub.end_date);
    return !furthest || d > furthest ? d : furthest;
  }, null as Date | null);

  const daysLeft = furthestEndDate
    ? Math.max(0, differenceInDays(furthestEndDate, new Date()))
    : 0;

  const activePlanTypes = [...new Set(activeSubs.map(s => s.plan_type))];

  // ─── Group meetings (depends on enrollments from parallel fetch) ──
  const batchIds = (enrollments || []).map(e => e.batch_id);

  let groupMeetings: any[] = [];
  if (batchIds.length > 0) {
    const { data: gMeetings } = await admin
      .from('meetings')
      .select('*')
      .in('batch_id', batchIds)
      .eq('meeting_type', 'group_session')
      .gte('start_time', todayStart)
      .lte('start_time', todayEnd)
      .order('start_time', { ascending: true });
    groupMeetings = gMeetings || [];
  }

  const todaysMeetings = [...(oneOnOneMeetings || []), ...groupMeetings]
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <StudentDashboardClient 
      profile={profile}
      todaysMeetings={todaysMeetings}
      activePlanTypes={activePlanTypes}
      daysLeft={daysLeft}
      firstPhoto={firstPhoto}
      latestPhoto={latestPhoto}
      joinedDate={joinedDate}
      lastRenewed={lastRenewed}
    />
  );
}
