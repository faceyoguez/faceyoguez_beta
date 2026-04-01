import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { Users, Video, Sparkles, Clock, Calendar, ChevronRight, UserPlus, Shield, ArrowUpRight, TrendingUp } from 'lucide-react';
import { format, startOfMonth, startOfDay, endOfDay, addMinutes } from 'date-fns';
import Link from 'next/link';

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
      )
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
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12 font-sans overflow-hidden animate-in fade-in duration-1000">
      
      {/* 1. Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase border border-primary/10">
            <TrendingUp className="w-3 h-3" />
            Instructor Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground tracking-tight">
            Greetings, {firstName}
          </h1>
          <p className="text-lg text-foreground/40 italic font-medium max-w-lg">
            &quot;Empowering transformations, one face at a time.&quot;
          </p>
        </div>
        
        {isMaster && (
          <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-sm rounded-3xl border border-primary/10 group">
            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-primary/50 uppercase tracking-widest leading-none">Status</p>
              <p className="text-sm font-bold text-foreground/80">Master Instructor</p>
            </div>
          </div>
        )}
      </header>

      {/* 2. Platform Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { icon: Users, label: '1-on-1 Portfolio', val: totalOneOnOne || 0, color: 'text-primary', bg: 'bg-primary/5', sub: 'Total Clients' },
          { icon: Sparkles, label: 'Group Reach', val: totalGroup || 0, color: 'text-primary', bg: 'bg-primary/5', sub: 'Active Students' },
          { icon: UserPlus, label: 'New Joinees', val: newJoineesCount, color: 'text-primary', bg: 'bg-primary/5', sub: 'This Month' },
          { icon: TrendingUp, label: 'Rejoinees', val: rejoineesCount, color: 'text-primary', bg: 'bg-primary/5', sub: 'Returning Clients' }
        ].map((stat, i) => (
          <div key={i} className="rounded-3xl p-8 border border-primary/5 hover:border-primary/20 transition-all duration-500 group flex flex-col justify-between shadow-sm bg-white/60 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest leading-none mb-1">{stat.label}</h3>
                <p className="text-3xl font-black text-foreground tracking-tighter">{stat.val}</p>
              </div>
            </div>
            <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest truncate">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        
        {/* Left Section (Sessions & Team) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* 3. Today's Sessions */}
          <section className="rounded-3xl p-8 md:p-12 border border-primary/5 bg-white/60 backdrop-blur-xl shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-bold text-foreground">Today&apos;s Sessions</h2>
                <div className="h-1 w-10 bg-primary/30 rounded-full" />
              </div>
              <div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-primary/5 shadow-sm">
                <span className="text-xs font-bold text-primary/40 uppercase tracking-widest">
                  {format(now, 'EEEE, MMM d')}
                </span>
              </div>
            </div>

            {todaysMeetings.length === 0 ? (
              <div className="text-center py-20 bg-background/20 rounded-3xl border border-dashed border-primary/20">
                <div className="h-16 w-16 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 text-primary/10">
                  <Calendar className="w-8 h-8" />
                </div>
                <p className="text-xl font-bold text-foreground/30 tracking-tight">No sessions hosted today</p>
                <p className="text-foreground/10 font-bold mt-1 uppercase text-[9px] tracking-widest">Take the time to prepare for upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysMeetings.map((meeting) => {
                  const isLive = isMeetingLive(meeting.start_time, meeting.duration_minutes);
                  const isUpcoming = isMeetingUpcoming(meeting.start_time);
                  const isOneOnOne = meeting.meeting_type === 'one_on_one';
                  
                  return (
                    <div key={meeting.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 rounded-3xl transition-all duration-500 border ${
                      isLive ? 'border-primary/40 bg-primary/5 shadow-md shadow-primary/5' : 'border-primary/5 bg-white/40 backdrop-blur-md hover:bg-white hover:border-primary/20'
                    }`}>
                      <div className="flex items-start gap-6">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-primary/10 text-primary`}>
                          <Video className="w-7 h-7" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center flex-wrap gap-2">
                            <h4 className="text-2xl font-bold tracking-tight text-foreground">{meeting.topic}</h4>
                            {isLive && (
                              <span className="px-3 py-1 bg-primary text-white text-[9px] font-bold tracking-widest uppercase rounded-full animate-pulse shadow-sm">
                                HOSTING NOW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold text-foreground/40">
                             <div className="flex items-center gap-1.5 uppercase tracking-widest">
                               <Clock className="w-3.5 h-3.5" />
                               {format(new Date(meeting.start_time), 'h:mm a')} – {format(addMinutes(new Date(meeting.start_time), meeting.duration_minutes), 'h:mm a')}
                             </div>
                             <span className="h-1 w-1 rounded-full bg-primary/10" />
                             <span className={`uppercase tracking-widest text-[9px] font-bold text-primary`}>
                                {isOneOnOne ? '1-on-1' : 'Group Session'}
                             </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 sm:mt-0">
                        {(isLive || isUpcoming) ? (
                           <a href={meeting.start_url || meeting.join_url} target="_blank" rel="noopener noreferrer"
                               className="px-8 py-3.5 bg-foreground text-background font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 block text-center min-w-[140px]">
                             Start Room
                           </a>
                        ) : (
                          <div className="px-8 py-3 bg-foreground/5 text-foreground/20 font-bold rounded-2xl uppercase tracking-widest text-[9px]">
                            Archived
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5. Master View: Team Management */}
          {isMaster && (
            <section className="bg-white/60 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-primary/5 shadow-sm transition-all duration-500 hover:shadow-md">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h2 className="text-3xl font-serif font-bold text-foreground">Your Students</h2>
                  <div className="h-1 w-10 bg-primary/30 rounded-full" />
                </div>
                <Link href="/staff/groups" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline italic">
                  Advanced Controls
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Group Classes */}
                <div className="space-y-6">
                  <h3 className="text-[9px] font-bold text-primary/40 uppercase tracking-widest ml-2 italic">Active Batches</h3>
                  {activeBatches.length > 0 ? (
                    <div className="space-y-3">
                      {activeBatches.map(batch => (
                        <div key={batch.id} className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-primary/5 hover:border-primary/20 transition-all duration-500 group shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-primary/5 overflow-hidden ring-2 ring-white shadow-sm">
                                {batch.instructor?.avatar_url ? (
                                  <img src={batch.instructor.avatar_url} alt="" className="w-full h-full object-cover grayscale" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-primary/30 font-bold text-xs">
                                    {batch.instructor?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}
                             </div>
                             <div className="min-w-0">
                               <p className="text-sm font-bold text-foreground truncate">{batch.instructor?.full_name || 'Unknown'}</p>
                               <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest truncate italic">{batch.name}</p>
                             </div>
                          </div>
                          <div className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest rounded-lg border border-primary/10">
                            {batch.current_students} Students
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-foreground/20 font-bold italic ml-2 uppercase tracking-widest">No active group sessions.</p>
                  )}
                </div>

                {/* 1-on-1 Portfolio */}
                <div className="space-y-6">
                  <h3 className="text-[9px] font-bold text-primary/40 uppercase tracking-widest ml-2 italic">1-on-1 Students</h3>
                  {instructorAllocations.length > 0 ? (
                    <div className="space-y-3">
                      {instructorAllocations.map((alloc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/80 rounded-2xl border border-primary/5 hover:border-primary/20 transition-all duration-500 group shadow-sm">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-primary/5 overflow-hidden ring-2 ring-white shadow-sm">
                                {alloc.instructor?.avatar_url ? (
                                  <img src={alloc.instructor.avatar_url} alt="" className="w-full h-full object-cover grayscale" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-primary/30 font-bold text-xs">
                                    {alloc.instructor?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}
                             </div>
                             <div className="min-w-0">
                               <p className="text-sm font-bold text-foreground truncate">{alloc.instructor?.full_name || 'Unknown'}</p>
                               <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest italic">Private Coaching</p>
                             </div>
                          </div>
                          <div className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest rounded-lg border border-primary/10">
                            {alloc.studentCount} Active
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-foreground/20 font-bold italic ml-2 uppercase tracking-widest">No assigned 1-on-1s.</p>
                  )}
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Right Section (New Students) */}
        <div className="lg:col-span-4">
          <section className="rounded-3xl p-8 border border-primary/5 h-full flex flex-col bg-white/60 backdrop-blur-xl shadow-sm">
            <div className="space-y-1 mb-10">
              <h2 className="text-2xl font-serif font-bold text-foreground">New Students</h2>
              <div className="h-1 w-10 bg-primary/30 rounded-full" />
            </div>

            <div className="space-y-4 flex-1">
              {!newAllocations || newAllocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-10 grayscale">
                  <UserPlus className="w-12 h-12 text-primary" />
                  <p className="text-[9px] font-bold text-foreground uppercase tracking-widest">Awaiting Allocations</p>
                </div>
              ) : (
                newAllocations.map(alloc => {
                  const student = Array.isArray(alloc.student) ? alloc.student[0] : alloc.student;
                  return (
                    <div key={alloc.id} className="p-5 bg-white/80 border border-primary/5 rounded-3xl flex items-center justify-between hover:border-primary/20 transition-all duration-500 group shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-white shadow-sm overflow-hidden p-0.5 border border-primary/10">
                            <div className="w-full h-full rounded-[0.9rem] overflow-hidden bg-primary/5 flex items-center justify-center">
                              {student?.avatar_url ? (
                                <img src={student.avatar_url} alt="" className="w-full h-full object-cover grayscale" />
                              ) : (
                                <span className="text-primary/30 font-bold text-xs">{student?.full_name?.charAt(0)}</span>
                              )}
                            </div>
                         </div>
                         <div>
                           <p className="text-sm font-bold text-foreground">{student?.full_name || 'Anonymous'}</p>
                           <p className="text-[9px] font-bold text-primary uppercase tracking-widest italic">
                             Starts {alloc.start_date ? format(new Date(alloc.start_date), 'MMM d') : '—'}
                           </p>
                         </div>
                      </div>
                      <Link href="/instructor/one-on-one" className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                      </Link>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-10 pt-8 border-t border-primary/10">
              <Link href="/instructor/one-on-one" className="flex items-center justify-center gap-3 py-5 bg-foreground text-background font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                Open Client Hub
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
