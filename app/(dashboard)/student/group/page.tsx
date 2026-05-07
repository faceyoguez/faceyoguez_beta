import { Sparkles } from 'lucide-react';

export default function StudentGroupPage() {
  return (
    <div className="min-h-full font-jakarta p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-aktiv font-bold text-slate-900 tracking-tight">Group <span className="text-[#FF8A75]">Sessions</span></h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Collective Transformation Hub</p>
        </div>
      </header>
      
      <div className="p-20 rounded-[1.75rem] bg-white border border-slate-100 shadow-sm text-center space-y-6">
        <div className="h-16 w-16 bg-[#FF8A75]/10 rounded-2xl flex items-center justify-center mx-auto text-[#FF8A75]">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-aktiv font-bold text-slate-900">Coming Soon</p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Collective practices are unfolding</p>
        </div>
      </div>
    </div>
  );
}
