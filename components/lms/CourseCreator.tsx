'use client';

import { useState } from 'react';
import { scrapeAndCreateCourse } from '@/app/actions/lms';
import { toast } from 'sonner';
import { Youtube, Zap, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseCreatorProps {
  userId: string;
}

export function CourseCreator({ userId }: CourseCreatorProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [level, setLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl || !courseTitle) {
      toast.error('Please provide both a title and a playlist URL.');
      return;
    }

    setIsSubmitting(true);
    const result = await scrapeAndCreateCourse(playlistUrl, courseTitle, level, userId);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(`Successfully manifested ${courseTitle} with ${result.count} lessons!`);
      setPlaylistUrl('');
      setCourseTitle('');
    } else {
      toast.error(result.error || 'Failed to manifest course.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto font-sans">
      <div className="surface-container p-10 rounded-3xl relative overflow-hidden group border border-outline-variant/10 shadow-xl bg-white/50 backdrop-blur-xl">
        {/* Decorative ambient aura */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-all duration-1000"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-rose/5 blur-[80px] group-hover:bg-brand-rose/10 transition-all duration-1000"></div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg transition-transform duration-700">
                <Youtube className="w-7 h-7" />
              </div>
              <div>
                 <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary leading-none mb-1">Content Management</div>
                 <h2 className="text-2xl font-bold text-foreground">Create New Course</h2>
              </div>
            </div>
            <Sparkles className="w-6 h-6 text-foreground/5" />
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-1">Course Title</label>
                    <input
                        type="text"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        placeholder="e.g., Face Yoga Foundations"
                        className="w-full h-14 bg-white border border-outline-variant/10 rounded-xl px-5 text-sm font-medium text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all duration-300"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-1">Difficulty Level</label>
                    <div className="flex gap-3 h-14">
                        {[1, 2].map((lvl) => (
                        <button
                            key={lvl}
                            type="button"
                            onClick={() => setLevel(lvl)}
                            className={cn(
                            "flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 border",
                            level === lvl 
                                ? "bg-foreground text-background border-foreground shadow-md" 
                                : "bg-foreground/5 border-transparent text-foreground/40 hover:bg-foreground/10"
                            )}
                        >
                            {level === lvl ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-20" />}
                            Tier {lvl}
                        </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 ml-1">YouTube Playlist URL</label>
              <div className="relative">
                 <input
                    type="url"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    placeholder="https://youtube.com/playlist?list=..."
                    className="w-full h-14 bg-white border border-outline-variant/10 rounded-xl px-5 text-sm font-medium text-foreground placeholder:text-foreground/20 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all duration-300"
                    required
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-primary/40">
                    <Zap className="w-3 h-3 fill-current" />
                    Auto-Sync
                 </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full h-16 bg-foreground text-background rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-500 shadow-lg flex items-center justify-center gap-3 disabled:opacity-30 disabled:scale-100 overflow-hidden"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  <span className="text-[11px] font-bold uppercase tracking-widest relative z-10">Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white relative z-10" />
                  <span className="text-[11px] font-bold uppercase tracking-widest relative z-10">Create Course</span>
                </>
              )}
            </button>
          </form>

          <footer className="pt-6 border-t border-outline-variant/5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/20 text-center leading-relaxed">
              Sequential curriculum construction • Metadata synthesis • Course deployment
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
