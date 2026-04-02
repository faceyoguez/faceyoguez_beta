import { Sparkles } from 'lucide-react';

export default function StudentGroupPage() {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-8 font-sans">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Group Sessions</h1>
        <p className="text-sm font-medium text-foreground/40 uppercase tracking-widest">Collective Transformation Hub</p>
      </div>
      
      <div className="p-16 rounded-3xl bg-white/60 backdrop-blur-xl border border-primary/5 shadow-sm text-center space-y-4">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary border border-primary/5">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <p className="text-xl font-bold text-foreground">Coming Soon</p>
          <p className="text-xs font-bold text-foreground/30 uppercase tracking-[0.2em]">Collective practices are unfolding</p>
        </div>
      </div>
    </div>
  );
}
