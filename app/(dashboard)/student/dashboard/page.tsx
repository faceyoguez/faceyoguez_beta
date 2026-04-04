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

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  // Check if any active subscription has no end_date (lifetime/unlimited plan)
  const hasLifetimeSub = activeSubs.some(s => s.end_date === null || s.end_date === undefined);

  // Among subs with an end_date, find the furthest one that is still in the future
  const furthestEndDate = activeSubs.reduce((furthest, sub) => {
    if (!sub.end_date) return furthest; // skip null (handled by hasLifetimeSub)
    // Only consider subs that haven't expired yet
    if (sub.end_date < todayDateStr) return furthest;
    // Parse as end-of-day local time to avoid UTC midnight issues in UTC+ zones
    const d = new Date(`${sub.end_date}T23:59:59`);
    return !furthest || d > furthest ? d : furthest;
  }, null as Date | null);

  // Priority: real future end_date > lifetime (null) > expired
  // If a real future end_date exists, always show it — even if some subs have null end_date.
  // "Lifetime" only shows when every active sub has null end_date.
  const daysLeft = furthestEndDate
    ? Math.max(0, differenceInDays(furthestEndDate, today))
    : hasLifetimeSub
    ? -1
    : 0;

  // Only show plan types from truly current (non-expired) subscriptions
  const currentSubs = activeSubs.filter(
    s => s.end_date === null || s.end_date >= todayDateStr
  );
  const activePlanTypes = [...new Set(currentSubs.map(s => s.plan_type))];

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

  const expiryDate = furthestEndDate ? furthestEndDate.toISOString().split('T')[0] : null;

  // Calculate Journey Day (Days since joinedDate)
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
      isTrial={activeSubs.some(s => s.is_trial) && !activeSubs.some(s => !s.is_trial)}
    />
  );
}
