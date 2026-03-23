import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { Bell, Calendar, Video, Sparkles, CheckCircle, Clock, ChevronRight, Users, Upload, ArrowUpRight, User } from 'lucide-react';
import { format, differenceInDays, startOfDay, endOfDay, addMinutes } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

export default async function StudentDashboardPage() {
  // ─── Auth & Profile ───────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'student') redirect('/auth/login');

  // ─── Subscriptions ────────────────────────────────────────────────
  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select('*')
    .eq('student_id', user.id)
    .in('status', ['active', 'pending'])
    .order('start_date', { ascending: true });

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

  // ─── Today's Schedule ─────────────────────────────────────────────
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const { data: oneOnOneMeetings } = await admin
    .from('meetings')
    .select('*')
    .eq('student_id', user.id)
    .eq('meeting_type', 'one_on_one')
    .gte('start_time', todayStart)
    .lte('start_time', todayEnd)
    .order('start_time', { ascending: true });

  const { data: enrollments } = await admin
    .from('batch_enrollments')
    .select('batch_id')
    .eq('student_id', user.id)
    .in('status', ['active', 'extended']);

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

  // ─── My Progress (Journey Logs) ───────────────────────────────────
  const { data: firstPhoto } = await admin
    .from('journey_logs')
    .select('*')
    .eq('student_id', user.id)
    .not('photo_url', 'is', null)
    .order('day_number', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: latestPhoto } = await admin
    .from('journey_logs')
    .select('*')
    .eq('student_id', user.id)
    .not('photo_url', 'is', null)
    .order('day_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  // ─── Helpers ──────────────────────────────────────────────────────
  const firstName = profile.full_name?.split(' ')[0] || 'there';
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
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-10 font-sans overflow-hidden">
      
      {/* 1. Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase border border-primary/10">
            <Sparkles className="w-3 h-3" />
            Daily Radiance
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-base text-foreground/40 italic font-medium max-w-sm">
            &quot;Your face is a canvas, and your practice is the art.&quot;
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="h-12 w-12 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-xl border border-primary/5 hover:bg-white transition-all shadow-sm">
            <Bell className="w-5 h-5 text-foreground/40" />
          </button>
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20 p-0.5">
            <div className="w-full h-full rounded-full bg-primary/5 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-bold text-lg bg-primary/5">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
        {/* Joined Card */}
        <div className="rounded-3xl p-8 border border-primary/5 shadow-sm transition-all duration-500 hover:shadow-md bg-white/60 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none mb-1">Joined</h3>
              <p className="text-xl font-bold text-foreground">
                {joinedDate ? format(joinedDate, 'MMM yyyy') : '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {activePlanTypes.length > 0 ? (
              activePlanTypes.map(t => (
                <span key={t} className="px-2.5 py-0.5 bg-primary/5 rounded-full text-[9px] font-bold text-primary border border-primary/10 uppercase tracking-wide">
                  {t === 'one_on_one' ? '1-on-1' : t === 'group_session' ? 'Group' : 'LMS'}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-foreground/20 font-bold uppercase tracking-widest">No active plans</span>
            )}
          </div>
        </div>

        {/* Last Renewed */}
        <div className="rounded-3xl p-8 border border-primary/5 shadow-sm transition-all duration-500 hover:shadow-md bg-white/60 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-none mb-1">Last Renewed</h3>
              <p className="text-xl font-bold text-foreground">
                {lastRenewed ? format(lastRenewed, 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest mt-6 italic">Consistent practice</p>
        </div>

        {/* Plan Status / Days Left */}
        <div className="bg-foreground rounded-3xl p-8 text-background shadow-xl border border-white/10 group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -translate-y-16 translate-x-16" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-6 relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Plan Status</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white tracking-tighter">{daysLeft}</span>
              <span className="text-sm font-bold text-white/60 lowercase">days left</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Section (Schedule & Actions) */}
        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000 delay-300">
          
          {/* 3. Schedule */}
          <section className="rounded-3xl p-8 border border-primary/5 shadow-sm bg-white/60 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight">Today&apos;s Schedule</h2>
                <div className="h-1 w-10 bg-primary rounded-full" />
              </div>
              <div className="px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10">
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                  {format(new Date(), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            {todaysMeetings.length === 0 ? (
              <div className="text-center py-16 bg-primary/[0.02] rounded-2xl border border-dashed border-primary/20">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-primary/20 border border-primary/5 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-base font-bold text-foreground/30 tracking-tight">Pure Stillness Today</p>
                <p className="text-[11px] text-foreground/20 font-bold uppercase tracking-widest mt-1">Enjoy your rest or practice at your own pace.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysMeetings.map((meeting) => {
                  const meetingStart = new Date(meeting.start_time);
                  const isLive = isMeetingLive(meeting.start_time, meeting.duration_minutes);
                  const isUpcoming = isMeetingUpcoming(meeting.start_time);
                  const isOneOnOne = meeting.meeting_type === 'one_on_one';

                  return (
                    <div
                      key={meeting.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-2xl transition-all duration-500 border group ${
                        isLive
                          ? 'border-primary/30 bg-primary/[0.03] shadow-md'
                          : 'border-primary/5 bg-white/40 hover:bg-white hover:border-primary/20 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-5">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                          isOneOnOne ? 'bg-primary/10 text-primary border-primary/10' : 'bg-foreground/5 text-foreground/40 border-outline-variant/10'
                        }`}>
                          {isOneOnOne ? <Video className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <h4 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">{meeting.topic}</h4>
                            {isLive && (
                              <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-bold rounded-full animate-pulse uppercase tracking-widest">
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary/40" />
                              {format(meetingStart, 'h:mm a')}
                            </div>
                            <span className="h-1 w-1 rounded-full bg-primary/20" />
                            <span>{isOneOnOne ? 'Private Session' : 'Group Practice'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 sm:mt-0 flex">
                        {(isLive || isUpcoming) ? (
                          <a
                            href={meeting.join_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full sm:w-auto px-6 py-2.5 text-center text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm ${
                              isLive
                                ? 'bg-primary text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20'
                                : 'bg-foreground text-background hover:scale-[1.02]'
                            }`}
                          >
                            {isLive ? 'Join Now' : 'Join Soon'}
                          </a>
                        ) : (
                          <div className="px-6 py-2.5 bg-foreground/5 text-foreground/20 font-bold rounded-xl uppercase tracking-widest text-[10px] border border-outline-variant/5">
                            Ended
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4. Action Items */}
          <section className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-primary/5 shadow-sm">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6 tracking-tight">Guided Essentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'Morning Routine', desc: '5-min gentle stretches' },
                { title: 'Hydration Goal', desc: 'Drink 2L pure water' },
                { title: 'Evening Practice', desc: 'Log your core routine' }
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer p-5 rounded-2xl bg-white/50 border border-primary/5 hover:border-primary/20 hover:bg-white hover:shadow-md transition-all duration-500">
                  <div className="h-8 w-8 rounded-full border border-primary/10 flex items-center justify-center group-hover:border-primary transition-colors mb-3 bg-white shadow-sm">
                    <div className="h-3 w-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="font-bold text-foreground text-sm mb-0.5">{item.title}</p>
                  <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wide group-hover:text-primary transition-colors">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Section (Progress) */}
        <div className="lg:col-span-4 animate-in fade-in slide-in-from-right-4 duration-1000 delay-500">
          <section className="rounded-3xl p-8 border border-primary/5 shadow-sm flex flex-col h-full bg-white/60 backdrop-blur-xl">
            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight">Transformation</h2>
              <div className="h-1 w-8 bg-primary rounded-full" />
            </div>

            <div className="space-y-6 flex-1">
              {/* Before Photo */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest ml-1">Day 1 Focus</span>
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-primary/5 border border-primary/10 shadow-sm group">
                  {firstPhoto?.photo_url ? (
                    <>
                      <img
                        src={firstPhoto.photo_url}
                        alt="Before"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-0.5">
                        <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest leading-none">Baseline</span>
                        <span className="text-white font-bold text-xs">{format(new Date(firstPhoto.created_at), 'MMMM d, yyyy')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2 opacity-20">
                        <User className="w-8 h-8 mx-auto text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Pending</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Latest Photo */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">Current Glow</span>
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-primary/10 border border-primary/20 shadow-sm group">
                  {latestPhoto?.photo_url && latestPhoto.id !== firstPhoto?.id ? (
                    <>
                      <img
                        src={latestPhoto.photo_url}
                        alt="Latest"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-40" />
                      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-0.5">
                        <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest leading-none">Day {latestPhoto.day_number} achieved</span>
                        <span className="text-white font-bold text-xs">Today&apos;s Radiance</span>
                      </div>
                    </>
                  ) : (
                    <Link href="/student/one-on-one" className="absolute inset-0 flex items-center justify-center hover:bg-primary/[0.02] transition-colors group">
                      <div className="text-center space-y-3">
                        <div className="h-12 w-12 bg-white rounded-xl shadow-md border border-primary/10 flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 px-4">
                          <p className="text-xs font-bold text-foreground tracking-tight">Refresh Daily Progress</p>
                          <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest leading-tight">Update your journey</p>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm text-primary border border-primary/10 group-hover:rotate-12 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1">Coach Insight</p>
                  <p className="text-[11px] font-bold text-foreground/50 tracking-tight leading-tight italic">Consistency is the bridge between practice and perfection.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
