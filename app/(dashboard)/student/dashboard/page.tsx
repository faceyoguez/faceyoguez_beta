import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { Bell, Calendar, Video, Sparkles, CheckCircle, Clock, ChevronRight, Users, Upload } from 'lucide-react';
import { format, differenceInDays, startOfDay, endOfDay, addMinutes } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { DashboardJourney } from './DashboardJourney';

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

  // Derive plan highlight values
  const joinedDate = activeSubs.length > 0 && activeSubs[0].start_date
    ? new Date(activeSubs[0].start_date)
    : null;

  // Most recently started subscription = "Last Renewed"
  const lastRenewed = activeSubs.length > 0
    ? activeSubs.reduce((latest, sub) => {
        if (!sub.start_date) return latest;
        const d = new Date(sub.start_date);
        return !latest || d > latest ? d : latest;
      }, null as Date | null)
    : null;

  // Days left = furthest end_date minus today
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

  // One-on-one meetings for this student today
  const { data: oneOnOneMeetings } = await admin
    .from('meetings')
    .select('*')
    .eq('student_id', user.id)
    .eq('meeting_type', 'one_on_one')
    .gte('start_time', todayStart)
    .lte('start_time', todayEnd)
    .order('start_time', { ascending: true });

  // Group session meetings: find the student's active batch enrollments first
  const { data: enrollments } = await admin
    .from('batch_enrollments')
    .select('batch_id, batches(*)')
    .eq('student_id', user.id)
    .in('status', ['active', 'extended'])
    .maybeSingle();

  const activeBatch = Array.isArray(enrollments?.batches) 
    ? enrollments?.batches[0] 
    : (enrollments?.batches as any);
  const batchIds = activeBatch?.id ? [activeBatch.id] : [];

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
  const { data: journeyLogs } = await admin
    .from('journey_logs')
    .select('*')
    .eq('student_id', user.id)
    .order('day_number', { ascending: true });

  const allLogs = journeyLogs || [];
  const firstPhoto = allLogs.find(l => l.photo_url) || null;
  const latestPhoto = [...allLogs].reverse().find(l => l.photo_url) || null;

  // Subscription Start Date (earliest active sub)
  const subscriptionStartDate = activeSubs.length > 0 ? activeSubs[0].start_date : null;

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

  // ─── RENDER ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 lg:p-10 space-y-8 font-sans pb-24 lg:pb-10 bg-background text-foreground relative">

       <div className="relative z-10 space-y-8">

      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Welcome back, {firstName} <span className="inline-block animate-pulse">✨</span>
          </h1>
          <p className="mt-2 text-[13px] text-foreground/60 font-medium italic flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            &quot;Your face is a canvas, and your practice is the art.&quot;
          </p>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          <button className="relative p-2.5 liquid-glass rounded-[1.25rem] shadow-sm lustre-border hover:bg-surface-container/50 transition-colors">
            <Bell className="w-5 h-5 text-foreground/70" />
          </button>
          <div className="w-12 h-12 rounded-[1.25rem] bg-secondary-container lustre-border overflow-hidden shadow-sm ring-2 ring-background">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-secondary font-bold text-lg">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Plan Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
        {/* Joined Card */}
        <div className="liquid-glass rounded-[2rem] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] lustre-border transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-[11px] font-bold text-foreground/50 uppercase tracking-widest">Joined</h3>
          </div>
          <p className="text-2xl font-bold text-foreground ml-11">
            {joinedDate ? format(joinedDate, 'MMM yyyy') : '—'}
          </p>
          {activePlanTypes.length > 0 && (
            <p className="text-xs text-foreground/40 font-medium ml-11 mt-1">
              {activePlanTypes.map(t => t === 'one_on_one' ? '1-on-1' : t === 'group_session' ? 'Group' : 'LMS').join(' + ')}
            </p>
          )}
        </div>

        {/* Renewed Card */}
        <div className="liquid-glass rounded-[2rem] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] lustre-border transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/10 rounded-xl">
              <Clock className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="text-[11px] font-bold text-foreground/50 uppercase tracking-widest">Last Renewed</h3>
          </div>
          <p className="text-2xl font-bold text-foreground ml-11">
            {lastRenewed ? format(lastRenewed, 'MMM yyyy') : '—'}
          </p>
        </div>

        {/* Days Left Card */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-primary to-[#f2bb9b] rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(232,152,142,0.25)] border border-primary/20 text-primary-on transition-all hover:shadow-[0_12px_40px_rgba(232,152,142,0.35)] relative overflow-hidden group">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-[11px] font-bold text-white/90 uppercase tracking-widest drop-shadow-sm">Plan Status</h3>
          </div>
          <div className="flex items-baseline gap-2 ml-11 relative z-10">
            <p className="text-4xl font-extrabold text-white drop-shadow-md">{daysLeft}</p>
            <p className="text-white/80 font-semibold tracking-wide">Days Left</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (Schedule & Tasks) */}
        <div className="lg:col-span-2 space-y-8">

          {/* 3. Today's Schedule */}
          <section className="liquid-glass rounded-[2rem] p-6 md:p-8 shadow-sm lustre-border">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Today&apos;s Schedule</h2>
              <span className="text-sm text-foreground/50 font-medium tracking-wide">
                {format(new Date(), 'EEEE, MMM d')}
              </span>
            </div>

            {todaysMeetings.length === 0 ? (
              <div className="text-center py-10 text-foreground/40">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-surface-container-high" />
                <p className="font-semibold">No sessions scheduled for today</p>
                <p className="text-sm mt-1 font-medium">Enjoy your rest day! 🧘‍♀️</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysMeetings.map((meeting) => {
                  const meetingStart = new Date(meeting.start_time);
                  const meetingEnd = addMinutes(meetingStart, meeting.duration_minutes);
                  const isLive = isMeetingLive(meeting.start_time, meeting.duration_minutes);
                  const isUpcoming = isMeetingUpcoming(meeting.start_time);
                  const isOneOnOne = meeting.meeting_type === 'one_on_one';

                  return (
                    <div
                      key={meeting.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-[1.5rem] border gap-4 transition-all ${
                        isLive
                          ? 'border-transparent ring-1 ring-primary/30 bg-primary/5 shadow-sm'
                          : 'border-transparent ring-1 ring-outline-variant/10 bg-surface-container-low/50 hover:bg-surface hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-[1rem] flex-shrink-0 ${
                          isOneOnOne ? 'bg-secondary-container' : 'bg-tertiary-container'
                        }`}>
                          {isOneOnOne ? (
                            <Video className={`w-6 h-6 ${isOneOnOne ? 'text-secondary' : 'text-tertiary'}`} />
                          ) : (
                            <Users className="w-6 h-6 text-tertiary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">{meeting.topic}</h4>
                            {isLive && (
                              <span className="px-2 py-0.5 bg-primary text-primary-on text-[10px] uppercase font-bold tracking-widest rounded-full animate-pulse shadow-sm">
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-foreground/60 mt-1 flex items-center gap-2 font-medium">
                            <Clock className="w-4 h-4" />
                            {format(meetingStart, 'h:mm a')} – {format(meetingEnd, 'h:mm a')}
                          </p>
                          <span className={`inline-block text-[11px] font-bold uppercase tracking-wide mt-2 px-2.5 py-1 rounded-full ${
                            isOneOnOne ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                          }`}>
                            {isOneOnOne ? '1-on-1 Session' : 'Group Session'}
                          </span>
                        </div>
                      </div>

                      {(isLive || isUpcoming) ? (
                        <a
                          href={meeting.join_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full sm:w-auto px-6 py-3 text-center font-bold tracking-wide rounded-[1.25rem] transition-all flex-shrink-0 ${
                            isLive
                              ? 'bg-primary text-primary-on hover:bg-primary/90 hover:shadow-md'
                              : 'bg-secondary text-secondary-on hover:bg-secondary/90 hover:shadow-md'
                          }`}
                        >
                          {isLive ? '🔴 Join Now' : 'Join'}
                        </a>
                      ) : (
                        <span className="w-full sm:w-auto px-6 py-2.5 text-center bg-surface-container-highest text-foreground/40 font-semibold rounded-[1rem] flex-shrink-0">
                          Ended
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 4. Transformation Journey */}
          <DashboardJourney 
            currentUser={profile}
            activeBatch={activeBatch}
            initialJourneyLogs={allLogs}
            subscriptionStartDate={subscriptionStartDate}
          />

        </div>

        {/* Right Column (Tasks) */}
        <div className="lg:col-span-1 space-y-8">
          {/* 5. Daily Action Items */}
          <section className="liquid-glass rounded-[2rem] p-6 shadow-sm lustre-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Daily Action Items</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container/50 transition-colors cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-outline-variant/40 group-hover:border-primary transition-colors flex-shrink-0" />
                <span className="text-foreground font-medium">Complete 5-min morning routine</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container/50 transition-colors cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-outline-variant/40 group-hover:border-primary transition-colors flex-shrink-0" />
                <span className="text-foreground font-medium">Drink 2L of water</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container/50 transition-colors cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-outline-variant/40 group-hover:border-primary transition-colors flex-shrink-0" />
                <span className="text-foreground font-medium">Log evening facial yoga practice</span>
              </label>
            </div>
          </section>

          {/* Tips / Motivation Card */}
          <section className="liquid-glass rounded-[2rem] p-6 shadow-sm lustre-border bg-tertiary/5">
             <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-tertiary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Zen Tip</h3>
             </div>
             <p className="text-sm text-foreground/70 font-medium italic">
                &quot;The jaw is where we store our tension. Gently release your bite and let your tongue rest on the roof of your mouth.&quot;
             </p>
          </section>
        </div>

      </div>
      </div>
    </div>
  );
}
