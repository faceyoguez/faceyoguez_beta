'use client';

import React from 'react';
import { 
  Bell, 
  Calendar, 
  Video, 
  Sparkles, 
  Clock, 
  Users, 
  Upload, 
  ArrowUpRight, 
  User,
  Heart,
  Activity,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { ImageComparison } from '@/components/ui/image-comparison-slider';

interface StudentDashboardClientProps {
  profile: any;
  todaysMeetings: any[];
  activePlanTypes: string[];
  daysLeft: number;
  firstPhoto: any;
  latestPhoto: any;
  joinedDate: Date | null;
  lastRenewed: Date | null;
}

export function StudentDashboardClient({
  profile,
  todaysMeetings,
  activePlanTypes,
  daysLeft,
  firstPhoto,
  latestPhoto,
  joinedDate,
  lastRenewed,
}: StudentDashboardClientProps) {
  const firstName = profile.full_name?.split(' ')[0] || 'there';

  return (
    <div className="h-[100dvh] flex flex-col bg-[#FFFAF7]/40 text-[#374151] font-sans selection:bg-[#FF8A75]/20 overflow-hidden">
      
      {/* ── Header Area (Zero Scroll Optimization) ── */}
      <header className="shrink-0 px-6 lg:px-10 py-6 flex items-center justify-between animate-in fade-in duration-1000">
        <div className="flex items-center gap-6">
          <div className="space-y-0.5">
            <h1 className="text-3xl lg:text-4xl font-serif italic font-bold text-[#1a1a1a] tracking-tight">
              {firstName}&apos;s Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF8A75]/10 text-[#FF8A75] text-[10px] font-black uppercase tracking-[0.2em] border border-[#FF8A75]/10">
                <Sparkles className="w-3 h-3" />
                {firstName}
              </div>
              <p className="text-[11px] font-medium text-[#6B7280] italic">
                {format(new Date(), 'EEEE, MMMM do')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 bg-white/40 backdrop-blur-xl border border-[#FF8A75]/10 rounded-2xl p-2 px-4 shadow-sm group">
            <div className="flex items-center gap-2 pr-4 border-r border-[#FF8A75]/10">
              <Zap className="w-4 h-4 text-[#FF8A75]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#6B7280]">
                  Month {Math.floor(((latestPhoto?.day_number || 1) - 1) / 30) + 1}
                </span>
                <span className="text-xs font-bold text-[#1a1a1a]">Day {latestPhoto?.day_number || 1}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#6B7280]">Plan Expiry</span>
                <span className="text-xs font-bold text-[#1a1a1a]">{daysLeft} Days</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white/60 border border-[#FF8A75]/10 text-[#6B7280] hover:text-[#FF8A75] hover:bg-white transition-all">
               <Bell className="w-4 h-4" />
             </button>
             <div className="h-10 w-10 rounded-full border-2 border-[#FF8A75]/30 p-0.5 bg-white">
                <div className="w-full h-full rounded-full bg-[#FFFAF7] flex items-center justify-center overflow-hidden">
                   {profile.avatar_url ? (
                     <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.full_name} />
                   ) : (
                     <User className="w-5 h-5 text-[#FF8A75]" />
                   )}
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* ── Main Canvas (Zero Scroll Grid) ── */}
      <main className="flex-1 px-6 lg:px-10 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Col: Synchronicity (Schedule) */}
        <div className="lg:col-span-4 flex flex-col min-h-0 animate-in fade-in slide-in-from-left-4 duration-1000 delay-200">
          <div className="flex-1 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-[#FF8A75]/10 p-7 flex flex-col shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8A75]/5 blur-3xl rounded-full" />
             
             <div className="shrink-0 flex items-center justify-between mb-6">
                <div className="space-y-0.5">
                   <h2 className="text-xl font-serif italic font-bold text-[#1a1a1a] tracking-tight">Synchronicity</h2>
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Today&apos;s Sessions</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-[#FF8A75]/10 flex items-center justify-center text-[#FF8A75]">
                   <Calendar className="w-4 h-4" />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {todaysMeetings.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                    <div className="h-16 w-16 rounded-full bg-white border border-[#FF8A75]/10 flex items-center justify-center mb-4 text-[#FF8A75]/40">
                      <Clock className="w-7 h-7" />
                    </div>
                    <p className="text-sm italic font-medium text-[#374151]">Peace. Your calendar is clear.</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6B7280] mt-2">Practice on your own rhythm</p>
                  </div>
                ) : (
                  todaysMeetings.map((meeting, i) => {
                    const isOneOnOne = meeting.meeting_type === 'one_on_one';
                    return (
                      <div key={meeting.id} className="group p-5 rounded-3xl bg-white/60 border border-[#FF8A75]/5 hover:border-[#FF8A75]/20 hover:bg-white hover:shadow-md transition-all duration-500">
                        <div className="flex items-start gap-4">
                           <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                             isOneOnOne ? 'bg-[#FF8A75]/10 border-[#FF8A75]/20 text-[#FF8A75]' : 'bg-[#3D5A80]/5 border-[#3D5A80]/10 text-[#3D5A80]'
                           }`}>
                              {isOneOnOne ? <Video className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                           </div>
                           <div className="flex-1 space-y-1">
                              <h4 className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#FF8A75] transition-colors line-clamp-1">{meeting.topic}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#6B7280]">
                                  {format(new Date(meeting.start_time), 'h:mm a')}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-[#FF8A75]/30" />
                                <span className="text-[9px] font-bold text-[#FF8A75] uppercase">{isOneOnOne ? '1-on-1' : 'Group Session'}</span>
                              </div>
                           </div>
                           <a 
                             href={meeting.join_url} 
                             target="_blank" 
                             className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#1a1a1a] text-white hover:bg-[#FF8A75] transition-all hover:scale-110 shadow-sm"
                           >
                              <ArrowUpRight className="w-4 h-4" />
                           </a>
                        </div>
                      </div>
                    )
                  })
                )}
             </div>
          </div>
        </div>

        {/* Center Col: Transformation Mirror (Slider) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
           <div className="flex-1 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-[#FF8A75]/10 p-7 flex flex-col shadow-sm">
              <div className="shrink-0 flex items-center justify-between mb-6">
                <div className="space-y-0.5">
                   <h2 className="text-xl font-serif italic font-bold text-[#1a1a1a] tracking-tight">Transformation Mirror</h2>
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Witness your evolution</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1 bg-white border border-[#FF8A75]/10 rounded-full text-[#6B7280]">Day 1 — Day {latestPhoto?.day_number || 'X'}</span>
                </div>
              </div>

              <div className="flex-1 relative group/mirror rounded-[2rem] overflow-hidden bg-[#FFFAF7]/40 border border-[#FF8A75]/10 shadow-inner p-1.5 min-h-[300px]">
                 {latestPhoto?.photo_url ? (
                   <div className="w-full h-full rounded-[1.8rem] overflow-hidden border border-[#FF8A75]/5">
                     <ImageComparison 
                        beforeImage={firstPhoto?.day_number === 1 ? firstPhoto.photo_url : 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&sat=-100'} 
                        afterImage={latestPhoto.photo_url}
                        altBefore="Day 1 Baseline"
                        altAfter={`Day ${latestPhoto.day_number} Radiance`}
                     />
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/20 rounded-[1.8rem]">
                      <div className="h-20 w-20 rounded-full bg-white border border-[#FF8A75]/10 flex items-center justify-center mb-6 shadow-sm">
                        <Sparkles className="w-8 h-8 text-[#FF8A75]/40" />
                      </div>
                      <h4 className="text-lg font-serif italic font-bold text-[#1a1a1a]">Evolution Pending</h4>
                      <p className="text-[11px] font-medium text-[#6B7280] max-w-[200px] mt-2 leading-relaxed">
                        Complete your session snapshots to see your transformation milestones here.
                      </p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Right Col: Vitality & Insights (Stats + Actions) */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0 animate-in fade-in slide-in-from-right-4 duration-1000 delay-500">
          
          {/* Stats Section */}
          <div className="flex-1 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-[#FF8A75]/10 p-7 flex flex-col shadow-sm relative overflow-hidden">
             <div className="shrink-0 flex items-center justify-between mb-6">
                <div className="space-y-0.5">
                   <h2 className="text-xl font-serif italic font-bold text-[#1a1a1a] tracking-tight">Vitality</h2>
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Elite Status</p>
                </div>
                <Activity className="w-5 h-5 text-[#FF8A75]/30" />
             </div>

             <div className="space-y-5 flex-1 flex flex-col justify-center">
                <div className="p-4 rounded-3xl bg-white border border-[#FF8A75]/5 shadow-sm space-y-1">
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Daily Consistency</span>
                   <div className="flex items-end justify-between">
                     <div className="flex flex-col">
                       <span className="text-2xl font-serif italic font-bold text-[#1a1a1a] leading-none">
                         {activePlanTypes.length > 0 ? 'Active' : 'Standby'}
                       </span>
                       <div className="flex flex-wrap gap-1 mt-1.5">
                         {activePlanTypes.map(type => (
                           <span key={type} className="text-[7px] font-black uppercase tracking-widest text-[#FF8A75] border border-[#FF8A75]/20 px-1.5 py-0.5 rounded-full">
                             {type.replace(/_/g, ' ')}
                           </span>
                         ))}
                       </div>
                     </div>
                     <Heart className="w-5 h-5 text-[#FF8A75] animate-pulse" />
                   </div>
                </div>
                
                <div className="p-4 rounded-3xl bg-white border border-[#FF8A75]/5 shadow-sm space-y-1">
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Last Practice</span>
                   <div className="flex items-end justify-between">
                     <span className="text-2xl font-serif italic font-bold text-[#1a1a1a] leading-none">
                       {lastRenewed ? format(lastRenewed, 'MMM d') : '—'}
                     </span>
                     <Clock className="w-5 h-5 text-[#FF8A75]/40" />
                   </div>
                </div>

                <Link href="/student/one-on-one" className="p-4 rounded-3xl bg-[#1a1a1a] text-white hover:bg-[#FF8A75] transition-all group shadow-lg">
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80">Continuous Path</span>
                        <span className="text-sm font-bold tracking-tight">Enter Sessions</span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <ArrowUpRight className="w-4 h-4 text-white" />
                      </div>
                   </div>
                </Link>
             </div>
          </div>

          {/* Quick Tip */}
          <div className="shrink-0 p-6 rounded-[2rem] bg-[#FF8A75]/10 border border-[#FF8A75]/20 relative overflow-hidden group">
             <div className="relative z-10 flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-white flex items-center justify-center shadow-sm text-[#FF8A75] border border-[#FF8A75]/10 group-hover:scale-110 transition-transform">
                   <Heart className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF8A75] mb-1">Aura Note</p>
                   <p className="text-[11px] font-medium text-[#374151] leading-relaxed italic">
                     &ldquo;The structure you build today is the radiance you wear tomorrow.&rdquo;
                   </p>
                </div>
             </div>
          </div>

        </div>

      </main>

      {/* ── Mobile Context Footer (Only for spacing, ensure no scroll) ── */}
      <div className="h-4 lg:hidden shrink-0" />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 138, 117, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 138, 117, 0.2);
        }
      `}</style>
    </div>
  );
}
