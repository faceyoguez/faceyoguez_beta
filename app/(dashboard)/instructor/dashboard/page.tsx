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
import { format, startOfMonth, startOfDay, endOfDay, addMinutes } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
    const recentStudentIds = [...new Set(recentSubs.map(s => s.student_id))];
    const { data: pastSubs } = await admin
      .from('subscriptions')
      .select('student_id')
      .in('student_id', recentStudentIds)
      .lt('created_at', startOfThisMonth);

    const studentsWithPastData = new Set((pastSubs || []).map(s => s.student_id));
    recentStudentIds.forEach(id => {
      if (studentsWithPastData.has(id)) rejoineesCount++;
      else newJoineesCount++;
    });
  }

  // ─── 3. Today's Schedule ─────────────────────────────────────────
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const { data: todaysMeetingsRaw } = await admin
    .from('meetings')
    .select('*')
    .eq('host_id', user.id)
    .gte('start_time', todayStart)
    .lte('start_time', todayEnd)
    .order('start_time', { ascending: true });

  const todaysMeetings = todaysMeetingsRaw || [];

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
    const { data: batches } = await admin
      .from('batches')
      .select(`
        id,
        name,
        current_students,
        instructor:profiles!batches_instructor_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .in('status', ['active', 'upcoming'])
      .not('instructor_id', 'is', null);
    activeBatches = batches || [];

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
    (active1on1Subs || []).forEach(sub => {
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
          { label: 'Collective Batches', val: totalGroup || 0, daily: activeBatches.length, sub: 'Live Students', icon: Users },
          { label: 'New Admissions', val: newJoineesCount, daily: todayNewJoinees || 0, sub: 'Monthly Growth', icon: Sparkles },
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
              todaysMeetings.map((meeting) => {
                const isLive = isMeetingLive(meeting.start_time, meeting.duration_minutes);
                const isUpcoming = isMeetingUpcoming(meeting.start_time);

                return (
                  <div key={meeting.id} className={cn(
                    "group flex items-center gap-4 p-5 rounded-3xl transition-all duration-700 bg-white border",
                    isLive ? "border-[#FF8A75]/30 shadow-xl shadow-[#FF8A75]/10 ring-2 ring-[#FF8A75]/5" : "border-[#FF8A75]/5 hover:border-[#FF8A75]/20 shadow-sm"
                  )}>
                    <div className="h-12 w-12 rounded-xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] shrink-0 border border-[#FF8A75]/10">
                      <Video className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-[#1a1a1a] tracking-tight truncate">{meeting.topic}</h4>
                          {isLive && (
                             <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-slate-400">
                             {format(new Date(meeting.start_time), 'h:mm a')}
                           </span>
                           <span className="text-[7px] font-black uppercase tracking-widest text-[#FF8A75]/60 px-2 py-0.5 rounded-md bg-[#FF8A75]/5">
                             {meeting.meeting_type === 'one_on_one' ? 'Private' : 'Group'}
                           </span>
                        </div>
                    </div>

                    <div className="shrink-0">
                      {(isLive || isUpcoming) ? (
                        <Link href={meeting.start_url || meeting.join_url} target="_blank" className="h-10 px-4 rounded-xl bg-[#1a1a1a] text-white text-[8px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-[#FF8A75] transition-all">
                          {isLive ? 'Join' : 'View'}
                        </Link>
                      ) : (
                        <span className="text-[7px] font-black uppercase text-slate-300">Done</span>
                      )}
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
            <section className="xl:col-span-8 flex flex-col gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-aktiv font-bold text-[#1a1a1a] tracking-tight">Lead Overview</h2>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Global Operations</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Batch Allocation</h3>
                    <div className="space-y-3">
                       {activeBatches.map(batch => (
                          <div key={batch.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-[#FF8A75]/30 transition-all">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-[#FF8A75] shadow-sm"><Users className="w-4 h-4"/></div>
                                <div>
                                   <p className="text-xs font-bold text-slate-800">{batch.name}</p>
                                   <p className="text-[8px] font-medium text-slate-400">{batch.instructor?.full_name}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-xs font-black text-[#FF8A75]">{batch.current_students}</p>
                                <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Students</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Instructor Tasklist</h3>
                    <div className="space-y-3">
                       {instructorAllocations.map(alloc => (
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

        {/* ─── 5. NEW ADMISSIONS ─── */}
        <section className={cn("flex flex-col gap-6", isMaster ? "xl:col-span-4" : "xl:col-span-12")}>
          <div className="space-y-1">
            <h2 className="text-2xl font-aktiv font-bold text-[#1a1a1a] tracking-tight">New Admissions</h2>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Latest students</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {!newAllocations || newAllocations.length === 0 ? (
              <div className="p-10 bg-white/40 backdrop-blur-3xl border border-dashed border-[#FF8A75]/10 rounded-3xl text-center opacity-30">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#1a1a1a]">No fresh assignments</p>
              </div>
            ) : (
              newAllocations.map(alloc => {
                const student = Array.isArray(alloc.student) ? alloc.student[0] : alloc.student;
                return (
                  <div key={alloc.id} className="group p-4 bg-white border border-[#FF8A75]/5 rounded-3xl flex items-center justify-between hover:shadow-xl hover:shadow-[#FF8A75]/10 hover:border-[#FF8A75]/20 transition-all duration-700">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] overflow-hidden border border-[#FF8A75]/10">
                        {student?.avatar_url ? (
                          <img src={student.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold">{student?.full_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1a1a1a] truncate">{student?.full_name}</p>
                        <p className="text-[8px] font-medium text-slate-400">
                          Joined {alloc.start_date ? format(new Date(alloc.start_date), 'MMM d') : 'New'}
                        </p>
                      </div>
                    </div>
                    <Link href="/instructor/one-on-one" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center hover:bg-[#FF8A75] hover:text-white transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
