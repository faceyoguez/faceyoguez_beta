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
    <div className="w-full max-w-[300px] overflow-hidden rounded-2xl rounded-tl-none border border-pink-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-1.5 border-b border-pink-50 bg-gradient-to-r from-pink-50 to-rose-50 px-3 py-2">
        <BarChart2 className="h-3 w-3 text-pink-500" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-pink-500">Poll</span>
        {poll.is_closed && (
          <span className="ml-auto flex items-center gap-0.5 text-[9px] font-semibold text-gray-400">
            <Lock className="h-2.5 w-2.5" /> Closed
          </span>
        )}
      </div>

      {/* Question */}
      <div className="px-3 pt-2.5 pb-2">
        <p className="text-xs font-bold leading-snug text-gray-900">{poll.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-1.5 px-3 pb-2.5">
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
                  'relative overflow-hidden rounded-xl border px-3 py-2',
                  isMyVote
                    ? 'border-pink-300 bg-pink-50'
                    : 'border-gray-100 bg-gray-50/60'
                )}
              >
                {/* Animated fill bar */}
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-xl transition-all duration-700',
                    isMyVote ? 'bg-pink-100' : isLeading ? 'bg-gray-100' : 'bg-gray-50'
                  )}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isMyVote && (
                      <CheckCircle className="h-3 w-3 shrink-0 text-pink-500" />
                    )}
                    <span
                      className={cn(
                        'truncate text-xs leading-snug',
                        isMyVote ? 'font-bold text-pink-700' : 'text-gray-700'
                      )}
                    >
                      {opt.option_text}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[10px] font-bold',
                      isMyVote ? 'text-pink-600' : 'text-gray-500'
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
              className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 text-left text-xs text-gray-700 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {opt.option_text}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-pink-50 bg-gray-50/30 px-3 py-2">
        <span className="text-[9px] text-gray-400">
          {poll.total_votes} {poll.total_votes === 1 ? 'response' : 'responses'}
          {hasVoted && !isAdmin && ' · You voted'}
          {!showResults && !poll.is_closed && ' · Tap to vote'}
        </span>
        {isAdmin && !poll.is_closed && onClose && (
          <button
            onClick={onClose}
            className="text-[9px] font-semibold text-gray-400 transition-colors hover:text-red-500"
          >
            Close poll
          </button>
        )}
      </div>
    </div>
  );
}
