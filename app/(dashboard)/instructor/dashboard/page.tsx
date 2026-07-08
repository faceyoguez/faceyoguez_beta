import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import {
  Users,
  User,
  Video,
  Sparkles,
  Clock,
  Calendar,
  ChevronRight,
  UserPlus,
  Shield,
  ArrowUpRight,
  TrendingUp,
  Zap,
  Activity,
  Award,
  Heart
} from 'lucide-react';
import { format, startOfMonth, startOfDay, endOfDay, addMinutes, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatIST, formatISTDate, formatISTTime, getSessionStatus } from '@/lib/utils';
import { completeMeeting } from '@/lib/actions/meetings';
import { CancelMeetingButton } from '@/components/CancelMeetingButton';
import { ZoomJoinButton } from '@/components/zoom/ZoomJoinButton';
import { OneOnOneChat, BatchChatWindow } from '@/components/chat';

export default async function InstructorDashboardPage() {
  // ─── 1. Auth & Profile ──────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'instructor') redirect('/auth/login');

  const isMaster = profile.is_master_instructor;
  const firstName = profile.full_name?.split(' ')[0] || 'Instructor';

  // ─── 2. Statistics ───────────────────────────────────────────────
  const { count: totalOneOnOne } = await admin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('plan_type', 'one_on_one')
    .in('status', ['active', 'pending']);

  const { count: totalGroup } = await admin
    .from('batch_enrollments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['active', 'extended']);

  const startOfThisMonth = startOfMonth(new Date()).toISOString();
  const { data: recentSubs } = await admin
    .from('subscriptions')
    .select('student_id, created_at')
    .gte('created_at', startOfThisMonth);

  let newJoineesCount = 0;
  let rejoineesCount = 0;

  if (recentSubs && recentSubs.length > 0) {
    const recentStudentIds = [...new Set(recentSubs.map((s: any) => s.student_id))];

    const { data: pastSubs } = await admin
      .from('subscriptions')
      .select('student_id')
      .in('student_id', recentStudentIds)
      .lt('created_at', startOfThisMonth);

    const studentsWithPastData = new Set((pastSubs || []).map((s: any) => s.student_id));

    recentStudentIds.forEach(id => {
      if (studentsWithPastData.has(id)) rejoineesCount++;
      else newJoineesCount++;
    });
  }

  // Fetch upcoming sessions in the next 7 days (not just today)
  const upcomingStart = new Date().toISOString();
  const upcomingEnd = addDays(new Date(), 7).toISOString();
  // Also grab today's sessions for the header greeting
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  let todaysQuery = admin
    .from('meetings')
    .select('*');

  if (!isMaster) {
    todaysQuery = todaysQuery.eq('host_id', user.id);
  }

  const { data: todaysMeetingsRaw } = await todaysQuery
    .gte('start_time', todayStart)
    .lte('start_time', todayEnd)
    .order('start_time', { ascending: true });

  // All upcoming + recently past meetings (last 24h for expired detection)
  const recentStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  let upcomingQuery = admin
    .from('meetings')
    .select('*');

  if (!isMaster) {
    upcomingQuery = upcomingQuery.eq('host_id', user.id);
  }

  const { data: upcomingMeetingsRaw } = await upcomingQuery
    .gte('start_time', recentStart)
    .lte('start_time', upcomingEnd)
    .order('start_time', { ascending: true });

  const todaysMeetings = todaysMeetingsRaw || [];
  const upcomingMeetings = upcomingMeetingsRaw || [];

  // ─── 4. Daily vs Monthly Statistics ──────────────────────────────
  const { count: todayOneOnOne } = await admin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('plan_type', 'one_on_one')
    .in('status', ['active', 'pending'])
    .gte('created_at', todayStart);

  const { count: todayNewJoinees } = await admin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart);

  // ─── 5. New Allocations (1-on-1) ─────────────────────────────────
  const { data: newAllocations } = await admin
    .from('subscriptions')
    .select(`
      id,
      start_date,
      student:profiles!subscriptions_student_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      is_trial
    `)
    .eq('assigned_instructor_id', user.id)
    .eq('plan_type', 'one_on_one')
    .gte('created_at', startOfThisMonth)
    .order('created_at', { ascending: false })
    .limit(5);

  // ─── 5. Master Overview ───────────────────────────────
  let activeBatches: any[] = [];
  let instructorAllocations: any[] = [];

  if (isMaster) {
    const { data: instructors } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('role', 'instructor');
    
    instructorAllocations = instructors?.map((inst: any) => ({
      instructor: inst,
      studentCount: 0 // Placeholder or fetch actual count if needed
    })) || [];

    const { data: active1on1Subs } = await admin
      .from('subscriptions')
      .select(`
        assigned_instructor_id,
        instructor:profiles!subscriptions_assigned_instructor_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq('plan_type', 'one_on_one')
      .in('status', ['active', 'pending'])
      .not('assigned_instructor_id', 'is', null);
    const instructorMap = new Map();
    (active1on1Subs || []).forEach((sub: any) => {

      const instructorId = sub.assigned_instructor_id;
      if (!instructorMap.has(instructorId)) {
        instructorMap.set(instructorId, {
          instructor: sub.instructor,
          studentCount: 0
        });
      }
      instructorMap.get(instructorId).studentCount++;
    });
    instructorAllocations = Array.from(instructorMap.values());
  }

  const now = new Date();
  const isMeetingLive = (startTime: string, durationMinutes: number) => {
    const start = new Date(startTime);
    const end = addMinutes(start, durationMinutes);
    return now >= start && now <= end;
  };
  const isMeetingUpcoming = (startTime: string) => new Date(startTime) > now;

  return (
    <div className="min-h-screen bg-[#FFFAF7] p-6 lg:p-10 space-y-8 selection:bg-[#FF8A75]/10 font-jakarta animate-in fade-in slide-in-from-bottom-4 duration-1000 relative overflow-x-hidden">

      {/* Background Zen Elements (Tighter blur for performance) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.03)_0%,transparent_70%)] blur-[80px] opacity-60" />
      </div>

      {/* ─── 1. MORNING REFLECTION HERO ─── */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-aktiv font-bold text-[#1a1a1a] tracking-tight leading-none">
            Namaste, {firstName}
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-medium max-w-2xl leading-relaxed">
            {todaysMeetings.length > 0 
              ? `You have ${todaysMeetings.length} sessions lined up for today. Let's create an impact.`
              : "Your schedule is clear for today. Use this time for self-practice and planning."}
          </p>
        </div>

        {isMaster && (
          <div className="flex items-center gap-4 p-4 py-3 bg-white/60 backdrop-blur-3xl rounded-3xl border border-[#FF8A75]/10 shadow-xl shadow-[#FF8A75]/5 group">
            <div className="h-10 w-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-6">
              <Award className="w-5 h-5 text-[#FF8A75]" />
            </div>
            <div>
              <p className="text-[8px] font-black text-[#FF8A75]/40 uppercase tracking-[0.3em] leading-none mb-1">Status</p>
              <p className="text-sm font-bold text-[#1a1a1a]">Lead Instructor</p>
            </div>
          </div>
        )}
      </header>

      {/* ─── 2. GROWTH ARTIFACTS (STATS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { label: 'One-on-One', val: totalOneOnOne || 0, daily: todayOneOnOne || 0, sub: 'Total Active', icon: User },
          { label: 'Total Reach', val: totalGroup || 0, daily: instructorAllocations.length, sub: 'Live Students', icon: Users },
          { label: 'Loyalty Renewals', val: rejoineesCount, daily: 0, sub: 'Re-enrolled', icon: Activity }
        ].map((stat, i) => (
          <div key={i} className="group p-5 rounded-3xl bg-white border border-[#FF8A75]/5 shadow-sm hover:shadow-2xl hover:shadow-[#FF8A75]/10 hover:-translate-y-1 transition-all duration-700 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
              <stat.icon className="w-16 h-16 text-[#1a1a1a]" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">{stat.label}</h3>
                {stat.daily > 0 && (
                   <span className="text-[7px] font-bold text-[#FF8A75] bg-[#FF8A75]/5 px-2 py-0.5 rounded-full border border-[#FF8A75]/10">+{stat.daily} Today</span>
                )}
              </div>
              <p className="text-4xl font-aktiv font-bold text-[#1a1a1a] tracking-tighter leading-none">{stat.val}</p>
              <div className="flex items-center gap-2">
                 <div className="h-1 w-4 bg-[#FF8A75] rounded-full" />
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">

        {/* ─── 3. TODAY'S RADIANCE (SCHEDULE) ─── */}
        <section className="xl:col-span-12 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-aktiv font-bold text-[#1a1a1a] tracking-tight">Session Timetable</h2>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Scheduled Sessions</p>
            </div>
            <div className="px-4 py-2 bg-white/60 backdrop-blur-3xl rounded-2xl border border-[#FF8A75]/10 shadow-sm">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {format(now, 'EEEE, MMM d')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysMeetings.length === 0 ? (
              <div className="col-span-full p-12 bg-white/40 backdrop-blur-3xl border border-dashed border-[#FF8A75]/10 rounded-3xl text-center space-y-4">
                <Calendar className="w-8 h-8 text-[#FF8A75]/20 mx-auto" />
                <p className="text-sm font-bold text-slate-300">Your session schedule is currently clear for today.</p>
              </div>
            ) : (
              todaysMeetings.map((meeting: any) => {
                const status = getSessionStatus(meeting.start_time, meeting.duration_minutes || 45, meeting.calendar_event_id);
                const isLive = status === 'live';
                const isExpired = status === 'expired';
                const isCompleted = status === 'completed';

                return (
                  <div key={meeting.id} className={cn(
                    "group flex flex-col gap-3 p-5 rounded-3xl transition-all duration-700 bg-white border",
                    isLive ? "border-[#FF8A75]/30 shadow-xl shadow-[#FF8A75]/10 ring-2 ring-[#FF8A75]/5" 
                    : isExpired ? "border-slate-100 opacity-60"
                    : isCompleted ? "border-emerald-100 bg-emerald-50/30"
                    : "border-[#FF8A75]/5 hover:border-[#FF8A75]/20 shadow-sm"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] shrink-0 border border-[#FF8A75]/10">
                        <Video className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className={cn("text-sm font-bold tracking-tight truncate", isExpired ? 'line-through text-slate-400' : isCompleted ? 'text-slate-500' : 'text-[#1a1a1a]')}>{meeting.topic}</h4>
                            {isLive && <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />}
                            {isExpired && <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Expired</span>}
                            {isCompleted && <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">✓ Completed</span>}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                             <span className="text-[10px] font-bold text-slate-400">
                               {formatISTDate(meeting.start_time)} · {formatISTTime(meeting.start_time)} IST
                             </span>
                             <span className="text-[7px] font-black uppercase tracking-widest text-[#FF8A75]/60 px-2 py-0.5 rounded-md bg-[#FF8A75]/5">
                               {meeting.meeting_type === 'one_on_one' ? 'Private' : 'Group'}
                             </span>
                          </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isCompleted ? (
                          <span className="text-[9px] font-black uppercase text-emerald-500">Done</span>
                        ) : isExpired ? (
                          <span className="text-[7px] font-black uppercase text-slate-300">Expired</span>
                        ) : (isLive || isMeetingUpcoming(meeting.start_time)) ? (
                          <ZoomJoinButton
                            meetingId={meeting.id}
                            type="meeting"
                            className={cn(
                              "h-10 px-4 rounded-xl text-white text-[8px] font-black uppercase tracking-widest flex items-center justify-center transition-all",
                              isLive
                                ? "bg-[#FF8A75] shadow-[0_0_15px_rgba(255,138,117,0.4)] animate-pulse"
                                : "bg-[#1a1a1a] hover:bg-[#FF8A75]"
                            )}
                            chatPanel={
                              meeting.meeting_type === 'group_session' && meeting.batch_id ? (
                                <BatchChatWindow batchId={meeting.batch_id} currentUser={profile} title={meeting.topic} dark className="h-full" />
                              ) : meeting.student_id ? (
                                <OneOnOneChat currentUser={profile} selectedStudentId={meeting.student_id} hideHeader dark className="h-full" />
                              ) : undefined
                            }
                          >
                            {isLive ? 'Join Live' : 'View'}
                          </ZoomJoinButton>
                        ) : null}
                        {/* Mark Complete button — only for host, only when LIVE */}
                        {isLive && meeting.host_id === user.id && (
                          <form action={async () => { 'use server'; await completeMeeting(meeting.id); }}>
                            <button type="submit" className="h-10 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
                              ✓ Done
                            </button>
                          </form>
                        )}
                        {/* Cancel/Delete button — only if not completed/expired */}
                        {!isCompleted && !isExpired && (
                          <CancelMeetingButton meetingId={meeting.id} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ─── 4. MASTER INSIGHTS (VISIBLE ONLY TO MASTER) ─── */}
        {isMaster && (
          <>
            <section className="xl:col-span-12 flex flex-col gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-aktiv font-bold text-[#1a1a1a] tracking-tight">Lead Overview</h2>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Global Operations</p>
              </div>
              <div className="grid grid-cols-1 gap-4">


                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Instructor Tasklist</h3>
                    <div className="space-y-3">
                       {instructorAllocations.map((alloc: any) => (
                          <div key={alloc.instructor?.full_name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">

                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg overflow-hidden bg-slate-200">
                                   {alloc.instructor?.avatar_url 
                                      ? <img src={alloc.instructor.avatar_url} className="h-full w-full object-cover" />
                                      : <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-slate-400">{alloc.instructor?.full_name?.charAt(0)}</div>}
                                </div>
                                <p className="text-xs font-bold text-slate-800">{alloc.instructor?.full_name}</p>
                             </div>
                             <p className="text-[10px] font-bold text-slate-500">{alloc.studentCount} active students</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  );
}
