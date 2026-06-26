import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getServerUser, getServerProfile } from '@/lib/data/auth';
import { getStudentSubscriptions, getStudentEnrollments, getStudentJourneyLogs } from '@/lib/data/dashboard';
import { differenceInDays } from 'date-fns';
import { StudentDashboardClient } from './StudentDashboardClient';

export default async function StudentDashboardPage() {
  // ─── Auth & Profile ───
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  // ─── Phase 1: All independent queries run in parallel ───
  // journeyLogs only needs user.id so it runs here, not in Phase 2.
  const [profile, enrollments, subscriptions, journeyLogs] = await Promise.all([
    getServerProfile(user.id),
    getStudentEnrollments(user.id),
    getStudentSubscriptions(user.id),
    getStudentJourneyLogs(user.id),
  ]);

  if (!profile || profile.role !== 'student') redirect('/auth/login');

  const batchIds = enrollments.map((e: { batch_id: string }) => e.batch_id);
  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];

  const currentSubs = subscriptions.filter(
    (s: any) => s.end_date === null || s.end_date >= todayDateStr
  );
  const activePlanTypes: string[] = [...new Set<string>(currentSubs.map((s: any) => s.plan_type as string))];

  const admin = createAdminClient();

  // ─── Phase 2: Meetings only (depends on Phase 1 batchIds/activePlanTypes) ───
  const todaysMeetings = await Promise.all([
      // Query 1: Individual or assigned meetings (assigned directly to this student)
      admin
        .from('meetings')
        .select('*, host:profiles!meetings_host_id_fkey(full_name, avatar_url)')
        .eq('student_id', user.id)
        .order('start_time', { ascending: true })
        .then((res: { data: any[] | null }) => res.data || []),
      // Query 2: Group sessions related to the student's enrolled batches (only if they have active Group Plan)
      activePlanTypes.includes('group_session') && batchIds.length > 0
        ? admin
            .from('meetings')
            .select('*, host:profiles!meetings_host_id_fkey(full_name, avatar_url)')
            .in('batch_id', batchIds)
            .eq('meeting_type', 'group_session')
            .order('start_time', { ascending: true })
            .then((res: { data: any[] | null }) => res.data || [])
        : Promise.resolve([])
  ]).then(([oneOnOne, group]) => {
    const all = [...oneOnOne, ...group];
    // Deduplicate by meeting ID
    const unique = all.filter((m, i) => all.findIndex(x => x.id === m.id) === i);
    return unique.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  });

  // ─── Compute derived state ───
  // Determine the journey start date from the ACTIVE plan the student is currently on.
  // We intentionally avoid using the oldest subscription (which could be a trial from months ago).
  // Priority: most recent active paid subscription > most recent active subscription > oldest.
  const activePaidSubs = subscriptions.filter(
    (s: any) => !s.is_trial && s.status === 'active' && (s.end_date === null || s.end_date >= todayDateStr)
  );
  const activeAnySubs = subscriptions.filter(
    (s: any) => s.status === 'active' && (s.end_date === null || s.end_date >= todayDateStr)
  );

  // Pick the subscription whose start_date to use for the journey counter.
  // Use the earliest start_date among the student's current active paid subs (so the journey
  // counter resets if they renew, but covers the full active period if they purchased multiple).
  const journeySourceSub =
    activePaidSubs.length > 0
      ? activePaidSubs.reduce((earliest: any, s: any) =>
          !earliest || new Date(s.start_date) < new Date(earliest.start_date) ? s : earliest,
        null)
      : activeAnySubs.length > 0
      ? activeAnySubs[0]
      : subscriptions.length > 0
      ? subscriptions[subscriptions.length - 1]  // oldest as last resort
      : null;

  const joinedDate = journeySourceSub?.start_date
    ? new Date(journeySourceSub.start_date)
    : null;

  const lastRenewed = subscriptions.length > 0
    ? subscriptions.reduce((latest: Date | null, sub: any) => {
        if (!sub.start_date) return latest;
        const d = new Date(sub.start_date);
        return !latest || d > latest ? d : latest;
      }, null as Date | null)
    : null;

  const hasLifetimeSub = subscriptions.some((s: any) => s.end_date === null || s.end_date === undefined);

  const furthestEndDate = subscriptions.reduce((furthest: Date | null, sub: any) => {
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

  const expiryDate = furthestEndDate ? furthestEndDate.toISOString().split('T')[0] : null;

  const journeyDay = joinedDate 
    ? Math.max(1, differenceInDays(new Date(), joinedDate) + 1)
    : 1;

  return (
    <StudentDashboardClient 
      profile={profile}
      emailVerified={!!user.email_confirmed_at}
      phoneVerified={!!user.phone_confirmed_at}
      todaysMeetings={todaysMeetings}
      activePlanTypes={activePlanTypes}
      daysLeft={daysLeft}
      journeyDay={journeyDay}
      expiryDate={expiryDate}
      journeyLogs={journeyLogs}
      joinedDate={joinedDate}
      lastRenewed={lastRenewed}
      batchIds={batchIds}
      isTrial={subscriptions.some((s: any) => s.is_trial) && !subscriptions.some((s: any) => !s.is_trial)}
    />
  );
}
