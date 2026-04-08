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

        {/* Feedback List */}
        <div className="space-y-8">
          {feedbacks.length === 0 ? (
            <div className="bg-white rounded-[3rem] border border-[#FF8A75]/5 p-20 text-center space-y-6 shadow-xl shadow-[#FF8A75]/5">
              <div className="h-20 w-20 rounded-[2.5rem] bg-[#FFFAF7] flex items-center justify-center mx-auto border border-[#FF8A75]/10">
                <Heart className="w-10 h-10 text-[#FF8A75]/20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">No reflections gathered yet</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div 
                key={fb.id}
                className="group bg-white rounded-[3.5rem] border border-[#FF8A75]/5 p-10 lg:p-12 shadow-xl shadow-[#FF8A75]/5 hover:shadow-2xl hover:shadow-[#FF8A75]/10 transition-all duration-700 relative overflow-hidden"
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#FF8A75]/5 to-transparent rounded-tr-[3.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="relative z-10 flex flex-col lg:flex-row gap-12">
                  
                  {/* Left Column: Student & Plan Info */}
                  <div className="lg:w-1/3 space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-[2.2rem] border border-[#FF8A75]/10 p-1 bg-white ring-4 ring-[#FF8A75]/5 shadow-inner">
                        {fb.student?.avatar_url ? (
                          <img src={fb.student.avatar_url} className="w-full h-full object-cover rounded-[1.8rem]" alt={fb.student.full_name} />
                        ) : (
                          <div className="w-full h-full bg-[#FFFAF7] flex items-center justify-center rounded-[1.8rem]">
                            <User className="w-8 h-8 text-[#FF8A75]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-serif text-[#1a1a1a] truncate">{fb.student?.full_name || 'Anonymous Student'}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF8A75]/60 mt-1">{fb.student?.email}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Sparkles className="w-4 h-4 text-[#FF8A75]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{fb.plan_taken}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {format(new Date(fb.created_at), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Photo Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                       {fb.firstPhoto ? (
                          <a 
                            href={fb.firstPhoto} 
                            download 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-[#FFFAF7] border border-[#FF8A75]/5 hover:bg-white hover:border-[#FF8A75]/20 hover:shadow-lg transition-all text-[#FF8A75] group/btn"
                          >
                            <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#1a1a1a]">Day 1 Photo</span>
                          </a>
                       ) : (
                          <div className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 opacity-40">
                            <Download className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">No Baseline</span>
                          </div>
                       )}

                       {fb.latestPhoto ? (
                          <a 
                            href={fb.latestPhoto} 
                            download 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-[#FFFAF7] border border-[#FF8A75]/5 hover:bg-white hover:border-[#FF8A75]/20 hover:shadow-lg transition-all text-[#FF8A75] group/btn"
                          >
                            <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#1a1a1a]">Last Photo</span>
                          </a>
                       ) : (
                          <div className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 opacity-40">
                            <Download className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">No Outcome</span>
                          </div>
                       )}
                    </div>
                  </div>

                  {/* Right Column: Feedback Details */}
                  <div className="flex-1 space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#FF8A75]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75]">Reflections</span>
                      </div>
                      <div className="bg-[#FFFAF7] rounded-[2.5rem] p-8 lg:p-10 relative italic font-serif text-lg leading-relaxed text-[#1a1a1a]">
                         <div className="absolute top-4 left-4 text-4xl text-[#FF8A75]/10 font-black leading-none group-hover:scale-125 transition-transform duration-700">&ldquo;</div>
                         {fb.comments}
                      </div>
                    </div>

                    {fb.improvement_suggestions && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Suggestions for the Sanctuary</span>
                        </div>
                        <p className="px-10 text-sm text-slate-600 font-medium">
                          {fb.improvement_suggestions}
                        </p>
                      </div>
                    )}

                    {/* Mini Transformation Preview */}
                    <div className="pt-4 flex items-center gap-6">
                       {fb.firstPhoto && fb.latestPhoto && (
                          <div className="flex items-center gap-2">
                             <div className="h-10 w-10 rounded-full overflow-hidden border border-white shadow-sm ring-2 ring-[#FF8A75]/5">
                                <img src={fb.firstPhoto} className="w-full h-full object-cover" alt="Day 1" />
                             </div>
                             <ArrowRight className="w-3 h-3 text-[#FF8A75]" />
                             <div className="h-10 w-10 rounded-full overflow-hidden border border-white shadow-sm ring-2 ring-[#FF8A75]/5">
                                <img src={fb.latestPhoto} className="w-full h-full object-cover" alt="Last Day" />
                             </div>
                             <span className="text-[9px] font-black uppercase tracking-widest text-[#FF8A75] ml-4">Transformation Complete</span>
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
