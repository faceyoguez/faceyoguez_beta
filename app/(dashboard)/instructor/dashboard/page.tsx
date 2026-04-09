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

  // ─── 4. New Allocations (1-on-1) ─────────────────────────────────
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
  function isMeetingLive(startTime: string, durationMinutes: number) {
    const start = new Date(startTime);
    const end = addMinutes(start, durationMinutes);
    return now >= start && now <= end;
  }
  function isMeetingUpcoming(startTime: string) {
    return new Date(startTime) > now;
  }

  return (
    <div className="min-h-screen bg-[#FFFAF7] p-8 lg:p-16 space-y-16 selection:bg-[#FF8A75]/10 font-sans animate-in fade-in slide-in-from-bottom-4 duration-1000 relative">

      {/* Background Zen Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(255,138,117,0.04)_0%,transparent_70%)] blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,transparent_60%)] blur-3xl opacity-40" />
      </div>

      {/* ─── 1. MORNING REFLECTION HERO ─── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#1a1a1a] tracking-tight leading-[1.05]">
            Greetings, {firstName}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl leading-relaxed">
            Your sanctuary is prepared. Today, we guide <span className="text-[#FF8A75] underline decoration-[#FF8A75]/20 underline-offset-8">progressive glow</span> through focused intention.
          </p>
        </div>

        {isMaster && (
          <div className="flex items-center gap-5 p-6 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-[#FF8A75]/5 shadow-2xl shadow-[#FF8A75]/5 group">
            <div className="h-14 w-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:rotate-6">
              <Award className="w-6 h-6 text-[#FF8A75]" />
            </div>
            <div>
              <p className="text-[9px] font-black text-[#FF8A75]/40 uppercase tracking-[0.3em] leading-none mb-2">Authority Level</p>
              <p className="text-lg font-bold text-[#1a1a1a]">Master Curator</p>
            </div>
          </div>
        )}
      </header>

      {/* ─── 2. GROWTH ARTIFACTS (STATS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {[
          { label: 'One-on-One Portfolio', val: totalOneOnOne || 0, sub: 'Manifested Souls', icon: User },
          { label: 'Group Reach', val: totalGroup || 0, sub: 'Collective Resonance', icon: Users },
          { label: 'New Joinees', val: newJoineesCount, sub: 'Cycle Commencement', icon: Sparkles },
          { label: 'Rejoinees', val: rejoineesCount, sub: 'Continuity Flow', icon: Activity }
        ].map((stat, i) => (
          <div key={i} className="group p-5 rounded-[2.5rem] bg-white border border-[#FF8A75]/5 shadow-sm hover:shadow-2xl hover:shadow-[#FF8A75]/10 hover:-translate-y-1 transition-all duration-700 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <stat.icon className="w-24 h-24 text-[#1a1a1a]" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-1 w-8 bg-[#FF8A75]/20 rounded-full group-hover:w-12 transition-all duration-500" />
                <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">{stat.label}</h3>
              </div>
              <p className="text-6xl font-serif text-[#1a1a1a] tracking-tighter leading-none">{stat.val}</p>
              <p className="text-[9px] font-black text-[#FF8A75] uppercase tracking-[0.4em] opacity-40">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">

        {/* ─── 3. TODAY'S RADIANCE (SCHEDULE) ─── */}
        <section className="xl:col-span-8 flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl lg:text-4xl font-serif text-[#1a1a1a] tracking-tight">Today&apos;s Radiance</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Temporal Alignments</p>
            </div>
            <div className="px-6 py-3 bg-white/60 backdrop-blur-3xl rounded-2xl border border-[#FF8A75]/10 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {format(now, 'EEEE, MMM d')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {todaysMeetings.length === 0 ? (
              <div className="p-20 bg-white/40 backdrop-blur-3xl border border-dashed border-[#FF8A75]/10 rounded-[4rem] text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-white border border-[#FF8A75]/5 flex items-center justify-center mx-auto text-[#FF8A75]/20">
                  <Calendar className="w-10 h-10" />
                </div>
                <p className="text-xl font-serif text-slate-300">The ritual schedule is pristine for today.</p>
              </div>
            ) : (
              todaysMeetings.map((meeting) => {
                const isLive = isMeetingLive(meeting.start_time, meeting.duration_minutes);
                const isUpcoming = isMeetingUpcoming(meeting.start_time);

                return (
                  <div key={meeting.id} className={cn(
                    "group flex flex-col md:flex-row items-center gap-8 p-10 rounded-[4rem] transition-all duration-700 bg-white border",
                    isLive ? "border-[#FF8A75]/30 shadow-2xl shadow-[#FF8A75]/10 ring-4 ring-[#FF8A75]/5 scale-[1.02]" : "border-[#FF8A75]/5 hover:border-[#FF8A75]/20 shadow-sm"
                  )}>
                    <div className="h-20 w-20 rounded-[2.5rem] bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] shrink-0 border border-[#FF8A75]/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <Video className="w-8 h-8" />
                    </div>

                    <div className="flex-1 flex flex-col gap-3 text-center md:text-left min-w-0">
                      <div className="flex items-center justify-center md:justify-start gap-4">
                        <h4 className="text-3xl font-serif text-[#1a1a1a] tracking-tight truncate">{meeting.topic}</h4>
                        {isLive && (
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a1a1a] text-white text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#1a1a1a]/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse shadow-[0_0_8px_#FF8A75]" />
                            Portal Active
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-6">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#FF8A75]/40" />
                          <span className="text-[12px] font-bold text-slate-400 capitalize">
                            {format(new Date(meeting.start_time), 'h:mm a')} – {format(addMinutes(new Date(meeting.start_time), meeting.duration_minutes), 'h:mm a')}
                          </span>
                        </div>
                        <div className="h-px w-6 bg-slate-100" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]/60">
                          {meeting.meeting_type === 'one_on_one' ? 'Elite Exchange' : 'Collective Glow'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      {(isLive || isUpcoming) ? (
                        <Link href={meeting.start_url || meeting.join_url} target="_blank" className="block w-full text-center px-10 h-16 rounded-[2rem] bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#FF8A75] hover:shadow-2xl hover:shadow-[#FF8A75]/30 transition-all duration-700">
                          {isLive ? 'Enter Sanctuary' : 'Awaiting Transmission'}
                        </Link>
                      ) : (
                        <div className="px-10 h-16 flex items-center justify-center rounded-[2rem] bg-slate-50 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
                          Completed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ─── 4. SOUL COMMENCEMENT (NEW STUDENTS) ─── */}
        <section className="xl:col-span-4 flex flex-col gap-10">
          <div className="space-y-2">
            <h2 className="text-3xl lg:text-4xl font-serif text-[#1a1a1a] tracking-tight">New Souls</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF8A75] opacity-60">Cycle Intake Portfolio</p>
          </div>

          <div className="space-y-4">
            {!newAllocations || newAllocations.length === 0 ? (
              <div className="p-20 bg-white/40 backdrop-blur-3xl border border-dashed border-[#FF8A75]/10 rounded-[3rem] text-center space-y-4 opacity-10">
                <UserPlus className="w-12 h-12 mx-auto text-[#FF8A75]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]">Awaiting Resonance</p>
              </div>
            ) : (
              newAllocations.map(alloc => {
                const student = Array.isArray(alloc.student) ? alloc.student[0] : alloc.student;
                return (
                  <div key={alloc.id} className="group p-6 bg-white border border-[#FF8A75]/5 rounded-[2.5rem] flex items-center justify-between hover:shadow-2xl hover:shadow-[#FF8A75]/10 hover:border-[#FF8A75]/20 transition-all duration-700">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-[2rem] bg-[#FF8A75]/5 flex items-center justify-center text-[#FF8A75] overflow-hidden border border-[#FF8A75]/10 shadow-inner">
                        {student?.avatar_url ? (
                          <img src={student.avatar_url} className="w-full h-full object-cover group-hover:rotate-3 transition-transform duration-700" />
                        ) : (
                          <span className="text-2xl font-serif">{student?.full_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-[#1a1a1a] tracking-tight leading-none">{student?.full_name}</p>
                          {alloc.is_trial && (
                            <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75]/60">
                          Node {alloc.start_date ? format(new Date(alloc.start_date), 'MMM d') : 'Cycle TBD'}
                        </p>
                      </div>
                    </div>
                    <Link href="/instructor/one-on-one" className="h-12 w-12 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shadow-lg transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-700">
                      <ArrowUpRight className="w-5 h-5 text-[#FF8A75]" />
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
