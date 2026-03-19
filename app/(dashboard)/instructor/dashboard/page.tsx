import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { Users, Video, Sparkles, Clock, Calendar, ChevronRight, UserPlus, Shield } from 'lucide-react';
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

  // ─── 2. Statistics (Platform-Wide) ───────────────────────────────
  // Total 1-on-1 Students
  const { count: totalOneOnOne } = await admin
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('plan_type', 'one_on_one')
    .in('status', ['active', 'pending']);

  // Total Group Students (active enrollments)
  const { count: totalGroup } = await admin
    .from('batch_enrollments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['active', 'extended']);

  // Joinees logic: fetch all subscriptions created this month
  const startOfThisMonth = startOfMonth(new Date()).toISOString();
  const { data: recentSubs } = await admin
    .from('subscriptions')
    .select('student_id, created_at')
    .gte('created_at', startOfThisMonth);

  // To figure out new vs rejoinee, we ideally check if the student had a previous subscription
  // For a fast approximation: count how many unique student_ids exist.
  // Then check if those student_ids have any subscription created BEFORE this month.
  let newJoineesCount = 0;
  let rejoineesCount = 0;

  if (recentSubs && recentSubs.length > 0) {
    const recentStudentIds = [...new Set(recentSubs.map(s => s.student_id))];
    
    // Find past subscriptions for these students
    const { data: pastSubs } = await admin
      .from('subscriptions')
      .select('student_id')
      .in('student_id', recentStudentIds)
      .lt('created_at', startOfThisMonth);

    const studentsWithPastData = new Set((pastSubs || []).map(s => s.student_id));

    recentStudentIds.forEach(id => {
      if (studentsWithPastData.has(id)) {
        rejoineesCount++;
      } else {
        newJoineesCount++;
      }
    });
  }

  // ─── 3. Today's Schedule ─────────────────────────────────────────
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const { data: todaysMeetingsRaw } = await admin
    .from('meetings')
    .select('*')
    .eq('host_id', user.id) // Instructor's own meetings
    .gte('start_time', todayStart)
    .lte('start_time', todayEnd)
    .order('start_time', { ascending: true });

  const todaysMeetings = todaysMeetingsRaw || [];

  // ─── 4. New Allocations (1-on-1) ─────────────────────────────────
  // Subscriptions assigned to THIS instructor recently
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
    .gte('created_at', startOfThisMonth) // E.g., allocated this month
    .order('created_at', { ascending: false })
    .limit(5);

  // ─── 5. Master Overview (Team Management) ────────────────────────
  let activeBatches: any[] = [];
  let instructorAllocations: any[] = [];

  if (isMaster) {
    // A) Group Sessions handled by instructors
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

    // B) 1-on-1 Students handled by instructors
    // Group active 1-on-1s by instructor
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

    // Grouping logic
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

  // ─── Helpers ─────────────────────────────────────────────────────
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
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-8 space-y-8 font-sans">
      
      {/* 1. Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Welcome back, {isMaster ? 'Master Instructor' : 'Instructor'} {firstName}
            <span className="inline-block animate-pulse">✨</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium italic flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            "Empowering transformations, one face at a time."
          </p>
        </div>
        
        {isMaster && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-200 shadow-sm text-sm font-semibold text-amber-700">
            <Shield className="w-4 h-4" />
            Master Privileges Active
          </div>
        )}
      </div>

      {/* 2. Key Statistics (Platform view for Masters, or broad overview) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total 1-on-1 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total 1-on-1</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 ml-11">{totalOneOnOne || 0}</p>
        </div>
        
        {/* Total Group Students */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group Students</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 ml-11">{totalGroup || 0}</p>
        </div>

        {/* New Joinees */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Joinees</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 ml-11">{newJoineesCount}</p>
          <p className="text-xs text-gray-400 ml-11 mt-0.5">This Month</p>
        </div>

        {/* Rejoinees */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-gray-100/60 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejoinees</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 ml-11">{rejoineesCount}</p>
          <p className="text-xs text-gray-400 ml-11 mt-0.5">This Month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Meetings & Team Overview) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 3. Today's Meetings */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Today's Sessions</h2>
              <span className="text-sm text-gray-400 font-medium">
                {format(now, 'EEEE, MMM d')}
              </span>
            </div>

            {todaysMeetings.length === 0 ? (
               <div className="text-center py-10 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No sessions to host today</p>
                <p className="text-sm mt-1">Enjoy your schedule! ✨</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysMeetings.map((meeting) => {
                  const isLive = isMeetingLive(meeting.start_time, meeting.duration_minutes);
                  const isUpcoming = isMeetingUpcoming(meeting.start_time);
                  const isOneOnOne = meeting.meeting_type === 'one_on_one';
                  
                  return (
                     <div key={meeting.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border gap-4 transition-all ${
                        isLive ? 'border-emerald-200 bg-emerald-50/50 shadow-md' : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md'
                      }`}>
                         <div className="flex items-start gap-4">
                           <div className={`p-3 rounded-xl flex-shrink-0 ${isOneOnOne ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
                              <Video className={`w-6 h-6 ${isOneOnOne ? 'text-indigo-600' : 'text-emerald-600'}`} />
                           </div>
                           <div>
                             <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-900">{meeting.topic}</h4>
                                {isLive && (
                                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">LIVE</span>
                                )}
                             </div>
                             <p className="text-sm text-gray-500 mt-1 flex items-center gap-2 font-medium">
                                <Clock className="w-4 h-4" />
                                {format(new Date(meeting.start_time), 'h:mm a')} – {format(addMinutes(new Date(meeting.start_time), meeting.duration_minutes), 'h:mm a')}
                             </p>
                             <span className={`inline-block text-xs mt-1.5 px-2 py-0.5 rounded-full font-semibold ${
                                isOneOnOne ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {isOneOnOne ? '1-on-1' : 'Group Session'}
                              </span>
                           </div>
                         </div>
                         
                         {(isLive || isUpcoming) ? (
                            <a href={meeting.start_url || meeting.join_url} target="_blank" rel="noopener noreferrer"
                               className={`w-full sm:w-auto px-6 py-2.5 text-center font-medium rounded-xl transition-colors shadow-sm flex-shrink-0 ${
                                isLive ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-900 text-white hover:bg-gray-800'
                               }`}>
                              Start Meeting
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

          {/* 5. Master Overview (Team Management) */}
          {isMaster && (
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Instructor Overview</h2>
                <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">
                  View All Team <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Group Classes Handling */}
                <div className="border border-gray-100 rounded-2xl p-4 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-100 pb-2">Group Classes</h3>
                  {activeBatches.length > 0 ? (
                    <div className="space-y-3">
                      {activeBatches.map(batch => (
                        <div key={batch.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-emerald-100 overflow-hidden flex-shrink-0">
                                {batch.instructor?.avatar_url ? (
                                  <img src={batch.instructor.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                                    {batch.instructor?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}
                             </div>
                             <div>
                               <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{batch.instructor?.full_name || 'Unknown'}</p>
                               <p className="text-xs text-gray-500 truncate max-w-[120px]">{batch.name}</p>
                             </div>
                          </div>
                          <span className="text-xs font-semibold bg-white border border-gray-100 px-2 py-1 rounded-lg text-gray-600">
                            👤 {batch.current_students}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No active group sessions.</p>
                  )}
                </div>

                {/* 1-on-1 Tagging */}
                 <div className="border border-gray-100 rounded-2xl p-4 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-100 pb-2">1-on-1 Portfolios</h3>
                  {instructorAllocations.length > 0 ? (
                    <div className="space-y-3">
                      {instructorAllocations.map((alloc, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0">
                                {alloc.instructor?.avatar_url ? (
                                  <img src={alloc.instructor.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                                    {alloc.instructor?.full_name?.charAt(0) || '?'}
                                  </div>
                                )}
                             </div>
                             <div>
                               <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{alloc.instructor?.full_name || 'Unknown'}</p>
                               <p className="text-xs text-gray-500">1-on-1 Sessions</p>
                             </div>
                          </div>
                          <span className="text-xs font-semibold bg-white border border-gray-100 px-2 py-1 rounded-lg text-gray-600">
                            👤 {alloc.studentCount} Tagged
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No assigned 1-on-1s.</p>
                  )}
                </div>

              </div>
            </section>
          )}

        </div>

        {/* Right Column (Allocations) */}
        <div className="lg:col-span-1">
          {/* 4. Newly Assigned Allocations */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Newly Assigned</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Your 1-on-1 Students</p>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {!newAllocations || newAllocations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                  <UserPlus className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-sm text-center">No new students assigned<br/>this month.</p>
                </div>
              ) : (
                newAllocations.map(alloc => (
                  <div key={alloc.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-white transition-colors group">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-emerald-100 overflow-hidden flex-shrink-0">
                          {alloc.student?.avatar_url ? (
                            <img src={alloc.student.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                               {alloc.student?.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900">{alloc.student?.full_name || 'Unknown'}</p>
                         <p className="text-xs text-gray-500">Starts {alloc.start_date ? format(new Date(alloc.start_date), 'MMM d') : 'Pending'}</p>
                       </div>
                    </div>
                    
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50">
              <Link href="/instructor/one-on-one" className="block w-full text-center py-2.5 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                Manage Portfolio
              </Link>
            </div>
          </section>
        </div>

      </div>

    </div>
  );
}
