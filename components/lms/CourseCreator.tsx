'use client';

import { useState } from 'react';
import { scrapeAndCreateCourse } from '@/app/actions/lms';
import { toast } from 'sonner';
import { Youtube, Zap, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
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
      toast.success(`Successfully created ${courseTitle} with ${result.count} videos!`);
      setPlaylistUrl('');
      setCourseTitle('');
    } else {
      toast.error(result.error || 'Failed to create course.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="liquid-glass p-8 rounded-[2.5rem] relative overflow-hidden group">
        {/* Decorative corner glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/10 blur-3xl group-hover:bg-brand-primary/20 transition-colors duration-500"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Create New Course</h2>
              <p className="text-sm text-foreground/60 italic">Zenith Ethereal Instructor Console</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-foreground/70 ml-1">Course Title</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g., Face Yoga Level 1: Foundations"
                className="w-full bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl px-5 py-4 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-foreground/70 ml-1">YouTube Playlist URL</label>
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://youtube.com/playlist?list=..."
                className="w-full bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl px-5 py-4 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-foreground/70 ml-1">Subscription Tier</label>
              <div className="flex gap-4">
                {[1, 2].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 border-2",
                      level === lvl 
                        ? "bg-brand-primary/10 border-brand-primary/40 text-brand-primary shadow-lg shadow-brand-primary/5" 
                        : "bg-surface-container-low/30 border-transparent text-foreground/50 hover:bg-surface-container-low/50"
                    )}
                  >
                    {level === lvl && <CheckCircle2 className="w-5 h-5" />}
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-primary text-white font-bold py-5 rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Scanning Playlist...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 fill-white" />
                  <span>Create Course</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-outline-variant/20">
            <p className="text-xs text-foreground/50 leading-relaxed text-center italic">
              * The system will automatically parse the video metadata and set up the sequential learning path.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
