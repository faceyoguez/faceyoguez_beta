'use client';

import { BarChart2, CheckCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BatchPoll } from '@/types/database';

interface PollCardProps {
  poll: BatchPoll;
  /** true = instructor/staff view: always show results + Close Poll button */
  isAdmin?: boolean;
  onVote?: (optionId: string) => void;
  onClose?: () => void;
  isVoting?: boolean;
}

export function PollCard({
  poll,
  isAdmin = false,
  onVote,
  onClose,
  isVoting = false,
}: PollCardProps) {
  const hasVoted = !!poll.my_vote_option_id;
  const showResults = isAdmin || hasVoted || poll.is_closed;
  const maxVotes = Math.max(...poll.options.map((o) => o.vote_count), 1);

  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-[2rem] rounded-tl-none liquid-glass border border-outline-variant/10 shadow-2xl bg-white/40">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-primary/5 bg-white/40 px-5 py-3">
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm border border-primary/10">
          <BarChart2 className="h-2.5 w-2.5" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 italic">Collective Inquiry</span>
        {poll.is_closed && (
          <span className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-foreground/20">
            <Lock className="h-2.5 w-2.5" /> Concluded
          </span>
        )}
      </div>

      {/* Question */}
      <div className="px-6 pt-5 pb-4">
        <p className="text-sm font-serif font-bold leading-tight text-foreground tracking-tight italic">"{poll.question}"</p>
      </div>

      {/* Options */}
      <div className="space-y-3 px-6 pb-6">
        {poll.options.map((opt) => {
          const pct =
            poll.total_votes > 0
              ? Math.round((opt.vote_count / poll.total_votes) * 100)
              : 0;
          const isMyVote = poll.my_vote_option_id === opt.id;
          const isLeading =
            poll.total_votes > 0 && opt.vote_count === maxVotes;

          if (showResults) {
            return (
              <div
                key={opt.id}
                className={cn(
                    'relative h-11 overflow-hidden rounded-2xl border transition-all duration-700 font-medium italic',
                    isMyVote 
                        ? 'border-primary/20 bg-primary/5' 
                        : 'border-primary/5 bg-white/60 backdrop-blur-xl'
                )}
              >
                {/* Animated fill bar */}
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 transition-all duration-1000 ease-out',
                    isMyVote ? 'bg-primary/10' : isLeading ? 'bg-foreground/5' : 'bg-foreground/[0.02]'
                  )}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative h-full flex items-center justify-between gap-4 px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {isMyVote && (
                      <CheckCircle className="h-3 w-3 shrink-0 text-primary" />
                    )}
                    <span
                      className={cn(
                        'truncate text-[11px] uppercase tracking-tight',
                        isMyVote ? 'font-black text-primary' : 'text-foreground/40'
                      )}
                    >
                      {opt.option_text}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[10px] font-black font-serif italic',
                      isMyVote ? 'text-primary' : 'text-foreground/20'
                    )}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          }

          // Student hasn't voted — show clickable options
          return (
            <button
              key={opt.id}
              onClick={() => !isVoting && onVote?.(opt.id)}
              disabled={isVoting || poll.is_closed}
              className="w-full h-11 rounded-2xl border border-primary/5 bg-white/60 backdrop-blur-xl shadow-sm px-5 text-left text-[11px] font-black uppercase tracking-tight text-foreground/40 transition-all duration-700 hover:border-primary/20 hover:bg-primary/5 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed group italic"
            >
              <span className="group-hover:translate-x-1 transition-transform inline-block">{opt.option_text}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-outline-variant/5 bg-white/40 px-6 py-3">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/20 italic">
          {poll.total_votes} {poll.total_votes === 1 ? 'Resonance' : 'Resonances'}
          {hasVoted && !isAdmin && ' • Committed'}
        </span>
        {isAdmin && !poll.is_closed && onClose && (
          <button
            onClick={onClose}
            className="text-[9px] font-black uppercase tracking-widest text-foreground/20 transition-all hover:text-red-400 py-1 px-2 rounded-lg hover:bg-red-400/5"
          >
            Conclude
          </button>
        )}
      </div>
    </div>
  );
}
