import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { StudentDashboardClient } from './StudentDashboardClient';

export default async function StudentDashboardPage() {
  // ─── Auth & Profile ───
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const profile = await getServerProfile(user.id);
  if (!profile || profile.role !== 'student') redirect('/auth/login');

  // ─── Batch 1: Fire all independent queries in parallel ───
  const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const [subsResult, enrollResult, firstPhotoResult, latestPhotoResult, oneOnOneResult] = await Promise.all([
    admin
      .from('subscriptions')
      .select('*')
      .eq('student_id', user.id)
      .in('status', ['active', 'pending'])
      .order('start_date', { ascending: true }),
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
    admin
      .from('meetings')
      .select('*, host:profiles!meetings_host_id_fkey(full_name, avatar_url)')
      .eq('student_id', user.id)
      .eq('meeting_type', 'one_on_one')
      .gte('start_time', windowStart)
      .order('start_time', { ascending: true }),
  ]);

  const subscriptions = subsResult.data;
  const enrollments = enrollResult.data;
  const firstPhoto = firstPhotoResult.data;
  const latestPhoto = latestPhotoResult.data;
  const oneOnOneMeetings = oneOnOneResult.data;

  const batchIds = (enrollments || []).map((e: { batch_id: string }) => e.batch_id);

  // ─── Batch 2: Group meetings (depends on batchIds from batch 1) ───
  let groupMeetings: any[] = [];
  if (batchIds.length > 0) {
    const { data: gMeetings } = await admin
      .from('meetings')
      .select('*, host:profiles!meetings_host_id_fkey(full_name, avatar_url)')
      .in('batch_id', batchIds)
      .eq('meeting_type', 'group_session')
      .gte('start_time', windowStart)
      .order('start_time', { ascending: true });
    groupMeetings = gMeetings || [];
  }

  const todaysMeetings = [...(oneOnOneMeetings || []), ...groupMeetings]
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());


  // ─── Compute derived state ───
  const activeSubs = subscriptions || [];

  const joinedDate = activeSubs.length > 0 && activeSubs[0].start_date
    ? new Date(activeSubs[0].start_date)
    : null;

  const lastRenewed = activeSubs.length > 0
    ? activeSubs.reduce((latest: Date | null, sub: any) => {
        if (!sub.start_date) return latest;
        const d = new Date(sub.start_date);
        return !latest || d > latest ? d : latest;
      }, null as Date | null)
    : null;

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  const hasLifetimeSub = activeSubs.some((s: any) => s.end_date === null || s.end_date === undefined);

  const furthestEndDate = activeSubs.reduce((furthest: Date | null, sub: any) => {
    if (!sub.end_date) return furthest;
    if (sub.end_date < todayDateStr) return furthest;
    const d = new Date(`${sub.end_date}T23:59:59`);
    return !furthest || d > furthest ? d : furthest;
  }, null as Date | null);

  const daysLeft = furthestEndDate
    ? Math.max(0, differenceInDays(furthestEndDate, today))
    : hasLifetimeSub
    ? -1
    : 0;

  const currentSubs = activeSubs.filter(
    (s: any) => s.end_date === null || s.end_date >= todayDateStr
  );
  const activePlanTypes = [...new Set(currentSubs.map((s: any) => s.plan_type))];

  const expiryDate = furthestEndDate ? furthestEndDate.toISOString().split('T')[0] : null;

  const journeyDay = joinedDate 
    ? Math.max(1, differenceInDays(new Date(), joinedDate) + 1)
    : 1;

  return (
    <StudentDashboardClient 
      profile={profile}
      todaysMeetings={todaysMeetings}
      activePlanTypes={activePlanTypes}
      daysLeft={daysLeft}
      journeyDay={journeyDay}
      expiryDate={expiryDate}
      firstPhoto={firstPhoto}
      latestPhoto={latestPhoto}
      joinedDate={joinedDate}
      lastRenewed={lastRenewed}
      batchIds={batchIds}
      isTrial={activeSubs.some((s: any) => s.is_trial) && !activeSubs.some((s: any) => !s.is_trial)}
    />
  );
}
