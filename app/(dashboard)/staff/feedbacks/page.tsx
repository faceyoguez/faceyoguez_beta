import React from 'react';
import { getExitFeedbacks } from '@/app/actions/feedback';
import { 
  Heart, 
  MessageSquare, 
  Download, 
  Calendar, 
  User, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function StaffFeedbackPage() {
  const feedbacks = await getExitFeedbacks();

  return (
    <div className="min-h-screen bg-[#FFFAF7] p-8 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-[#FF8A75]/10 shadow-sm self-start">
            <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A75] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Student Insights</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-serif tracking-tight text-[#1a1a1a]">
            Student <span className="text-[#FF8A75]">Reflections</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium max-w-xl">
            Hear from journeyers as they pause their ritual. Use these insights to nurture and grow the sanctuary experience.
          </p>
        </div>

        {/* Feedback List Container */}
        <div className="space-y-3">
          {feedbacks.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-[#FF8A75]/5 p-20 text-center space-y-6 shadow-xl shadow-[#FF8A75]/5">
              <div className="h-16 w-16 rounded-[2rem] bg-[#FFFAF7] flex items-center justify-center mx-auto border border-[#FF8A75]/10">
                <Heart className="w-8 h-8 text-[#FF8A75]/20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">No reflections gathered yet</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div 
                key={fb.id}
                className="group bg-white rounded-3xl lg:rounded-full border border-[#FF8A75]/5 px-6 lg:px-10 py-4 lg:h-20 flex flex-col lg:flex-row items-center justify-between gap-6 hover:bg-[#FF8A75]/[0.02] transition-all duration-300 hover:shadow-lg hover:shadow-[#FF8A75]/5"
              >
                {/* 1. Student Info - One Line */}
                <div className="flex items-center gap-4 min-w-[200px] w-full lg:w-auto">
                  <div className="h-12 w-12 rounded-2xl border border-[#FF8A75]/10 overflow-hidden shrink-0 bg-[#FFFAF7]">
                    {fb.student?.avatar_url ? (
                      <img src={fb.student.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#FF8A75]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-[#1a1a1a] truncate">{fb.student?.full_name || 'Anonymous'}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[8px] font-black uppercase tracking-widest text-[#FF8A75] opacity-60 truncate">
                         {fb.plan_taken}
                       </span>
                    </div>
                  </div>
                </div>

                {/* 2. Reflection Snippet - Middle */}
                <div className="flex-1 min-w-0 flex items-center gap-4 w-full lg:w-auto">
                  <div className="h-8 w-px bg-[#FF8A75]/10 hidden lg:block" />
                  <div className="relative group/text flex-1">
                    <p className="text-[12px] italic font-serif text-slate-600 line-clamp-1 lg:pr-10">
                      &ldquo;{fb.comments}&rdquo;
                    </p>
                    {/* Tooltip on hover if they want to see more? Or just keep it as is */}
                  </div>
                </div>

                {/* 3. Metrics & Actions - Right */}
                <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end">
                   <div className="flex flex-col items-end hidden sm:flex">
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                        {format(new Date(fb.created_at), 'MMM d, yyyy')}
                     </span>
                   </div>

                   <div className="flex items-center gap-2">
                      {/* Photo Pills */}
                      <div className="flex -space-x-2 mr-4">
                        {fb.firstPhoto && (
                          <div className="h-10 w-10 rounded-full border-2 border-white shadow-sm overflow-hidden ring-1 ring-[#FF8A75]/5">
                            <img src={fb.firstPhoto} className="w-full h-full object-cover" alt="Day 1" />
                          </div>
                        )}
                        {fb.latestPhoto && (
                          <div className="h-10 w-10 rounded-full border-2 border-white shadow-sm overflow-hidden ring-1 ring-[#FF8A75]/5">
                            <img src={fb.latestPhoto} className="w-full h-full object-cover" alt="Latest" />
                          </div>
                        )}
                      </div>

                      {/* Download Actions */}
                      <div className="flex items-center gap-3">
                        {fb.firstPhoto ? (
                          <a 
                            href={fb.firstPhoto} 
                            download={`Before_${fb.student?.full_name?.replace(/\s+/g, '_')}_Day1.jpg`}
                            target="_blank" 
                            rel="noreferrer" 
                            className="h-10 px-4 flex items-center gap-2 rounded-full bg-[#FFFAF7] text-[#FF8A75] border border-[#FF8A75]/10 hover:bg-[#FF8A75] hover:text-white transition-all shadow-sm group/dl"
                          >
                            <Download className="w-3.5 h-3.5 group-hover/dl:-translate-y-0.5 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Before</span>
                          </a>
                        ) : (
                           <div className="h-10 px-4 flex items-center gap-2 rounded-full bg-slate-50 text-slate-300 border border-slate-100 opacity-50 cursor-not-allowed">
                             <Download className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-black uppercase tracking-wider">No Before</span>
                           </div>
                        )}

                        {fb.latestPhoto ? (
                          <a 
                            href={fb.latestPhoto} 
                            download={`After_${fb.student?.full_name?.replace(/\s+/g, '_')}_Latest.jpg`}
                            target="_blank" 
                            rel="noreferrer" 
                            className="h-10 px-4 flex items-center gap-2 rounded-full bg-[#FFFAF7] text-[#FF8A75] border border-[#FF8A75]/10 hover:bg-[#FF8A75] hover:text-white transition-all shadow-sm group/dl"
                          >
                            <Download className="w-3.5 h-3.5 group-hover/dl:translate-y-0.5 transition-transform" />
                            <span className="text-[9px] font-black uppercase tracking-wider">After</span>
                          </a>
                        ) : (
                          <div className="h-10 px-4 flex items-center gap-2 rounded-full bg-slate-50 text-slate-300 border border-slate-100 opacity-50 cursor-not-allowed">
                            <Download className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-wider">No After</span>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
