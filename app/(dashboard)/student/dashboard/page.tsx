import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { Bell, Calendar, Video, Sparkles, CheckCircle, Clock, ChevronRight, Users, Upload } from 'lucide-react';
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

  // ─── RENDER ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF9F6] p-6 lg:p-10 space-y-8 font-sans pb-24 lg:pb-10">

      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2d3748] tracking-tight">
            Welcome back, {firstName} <span className="inline-block animate-pulse">✨</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium italic flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            &quot;Your face is a canvas, and your practice is the art.&quot;
          </p>
        </div>
        <div className="flex items-center gap-4 hidden md:flex">
          <button className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-[#f4e8e5] hover:bg-[#faf9f6] transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#e1e9e2] border border-white overflow-hidden shadow-sm">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-700 font-medium">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Plan Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Joined Card */}
        <div className="bg-white/80 backdrop-blur-3xl rounded-[2rem] p-6 shadow-sm border border-[#f4e8e5] transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Joined</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 ml-11">
            {joinedDate ? format(joinedDate, 'MMM yyyy') : '—'}
          </p>
          {activePlanTypes.length > 0 && (
            <p className="text-xs text-gray-400 ml-11 mt-1">
              {activePlanTypes.map(t => t === 'one_on_one' ? '1-on-1' : t === 'group_session' ? 'Group' : 'LMS').join(' + ')}
            </p>
          )}
        </div>

        {/* Renewed Card */}
        <div className="bg-white/80 backdrop-blur-3xl rounded-[2rem] p-6 shadow-sm border border-[#f4e8e5] transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Last Renewed</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 ml-11">
            {lastRenewed ? format(lastRenewed, 'MMM yyyy') : '—'}
          </p>
        </div>

        {/* Days Left Card */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#10b981] to-[#047857] rounded-[2rem] p-6 shadow-lg border border-[#34d399]/30 text-white transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-emerald-50 uppercase tracking-wider">Plan Status</h3>
          </div>
          <div className="flex items-baseline gap-2 ml-11">
            <p className="text-3xl font-bold">{daysLeft}</p>
            <p className="text-emerald-100 font-medium">Days Left</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (Schedule & Tasks) */}
        <div className="lg:col-span-2 space-y-8">

          {/* 3. Today's Schedule */}
          <section className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#f4e8e5]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-[#2d3748]">Today&apos;s Schedule</h2>
              <span className="text-sm text-gray-400 font-medium">
                {format(new Date(), 'EEEE, MMM d')}
              </span>
            </div>

            {todaysMeetings.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No sessions scheduled for today</p>
                <p className="text-sm mt-1">Enjoy your rest day! 🧘‍♀️</p>
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
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border gap-4 transition-all ${
                        isLive
                          ? 'border-emerald-200 bg-emerald-50/50 shadow-md'
                          : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${
                          isOneOnOne ? 'bg-rose-100' : 'bg-violet-100'
                        }`}>
                          {isOneOnOne ? (
                            <Video className={`w-6 h-6 ${isOneOnOne ? 'text-rose-600' : 'text-violet-600'}`} />
                          ) : (
                            <Users className="w-6 h-6 text-violet-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900">{meeting.topic}</h4>
                            {isLive && (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 font-medium">
                            <Clock className="w-4 h-4" />
                            {format(meetingStart, 'h:mm a')} – {format(meetingEnd, 'h:mm a')}
                          </p>
                          <span className={`inline-block text-xs mt-1.5 px-2 py-0.5 rounded-full font-semibold ${
                            isOneOnOne ? 'bg-rose-50 text-rose-600' : 'bg-violet-50 text-violet-600'
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
                          className={`w-full sm:w-auto px-6 py-3 text-center font-bold rounded-2xl transition-all shadow-sm flex-shrink-0 ${
                            isLive
                              ? 'bg-[#10b981] text-white hover:bg-[#059669]'
                              : 'bg-[#2d3748] text-white hover:bg-[#1a202c]'
                          }`}
                        >
                          {isLive ? '🔴 Join Now' : 'Join'}
                        </a>
                      ) : (
                        <span className="w-full sm:w-auto px-6 py-2.5 text-center bg-gray-100 text-gray-400 font-medium rounded-xl flex-shrink-0">
                          Ended
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5. Daily Action Items */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Action Items</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-emerald-500 transition-colors flex-shrink-0" />
                <span className="text-gray-900 font-medium">Complete 5-min morning routine</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-emerald-500 transition-colors flex-shrink-0" />
                <span className="text-gray-900 font-medium">Drink 2L of water</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-emerald-500 transition-colors flex-shrink-0" />
                <span className="text-gray-900 font-medium">Log evening facial yoga practice</span>
              </label>
            </div>
          </section>

        </div>

        {/* Right Column (Progress) */}
        <div className="lg:col-span-1">
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Progress</h2>
            </div>

            <div className="space-y-4 flex-1">
              {/* Before Photo */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
                {firstPhoto?.photo_url ? (
                  <>
                    <img
                      src={firstPhoto.photo_url}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 shadow-sm">
                      Before
                    </div>
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white text-xs font-medium tracking-wide">
                      Day {firstPhoto.day_number} · {format(new Date(firstPhoto.created_at), 'MMM d, yyyy')}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                    <span className="text-sm bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
                      No before photo yet
                    </span>
                  </div>
                )}
              </div>

              {/* After / Latest Photo */}
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
                {latestPhoto?.photo_url && latestPhoto.id !== firstPhoto?.id ? (
                  <>
                    <img
                      src={latestPhoto.photo_url}
                      alt="Latest"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-sm">
                      Latest
                    </div>
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white text-xs font-medium tracking-wide">
                      Day {latestPhoto.day_number} · {format(new Date(latestPhoto.created_at), 'MMM d, yyyy')}
                    </div>
                  </>
                ) : (
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-emerald-50/50 border-2 border-dashed border-emerald-200 flex items-center justify-center hover:bg-emerald-50 transition-colors cursor-pointer">
                    <div className="text-emerald-600 font-medium flex flex-col items-center gap-2">
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <Upload className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="text-sm text-emerald-700 font-semibold mt-1">Upload Progress Photo</span>
                      <span className="text-xs text-emerald-500">Track your transformation</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
