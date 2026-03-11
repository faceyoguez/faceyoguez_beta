'use client';

/**
 * OneOnOneChat — Always-visible 1-on-1 chat component
 *
 * Students: ALWAYS shows a chat-like UI. Auto-creates a conversation
 * with an instructor on first visit. If connection fails, a small
 * banner appears INSIDE the chat window with a retry button.
 *
 * Instructors: pass selectedStudentId to chat with a specific student.
 */

import {
  getOrCreateStudentChat,
  fetchUserConversations,
  fetchConversationById,
} from '@/lib/actions/chat';
import { useEffect, useState, useCallback } from 'react';
import { ChatWindow } from './ChatWindow';
import { Loader2, MessageSquareOff, RefreshCw, MessageCircle } from 'lucide-react';
import type { Profile, ConversationWithDetails, ConversationParticipant } from '@/types/database';

interface OneOnOneChatProps {
  currentUser: Profile;
  selectedStudentId?: string;
  hideHeader?: boolean;
  className?: string;
}

export function OneOnOneChat({
  currentUser,
  selectedStudentId,
  hideHeader = false,
  className = 'h-full',
}: OneOnOneChatProps) {
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const isStaff = ['admin', 'instructor', 'staff'].includes(currentUser.role);

  const findOrCreateConversation = useCallback(async (isRetry = false) => {
    if (isRetry) setIsRetrying(true);
    else setIsLoading(true);
    setError(null);

    try {
      const conversations = await fetchUserConversations('direct');
      let targetConv = null;

      if (conversations && conversations.length > 0) {
        if (isStaff && selectedStudentId) {
          targetConv = conversations.find((conv: any) =>
            (conv.participants as Array<{ user_id: string }>).some(
              (p) => p.user_id === selectedStudentId
            )
          );
        } else {
          targetConv = conversations[0];
        }
      }

      if (!targetConv && !isStaff) {
        const { conversationId } = await getOrCreateStudentChat();
        const newConvData = await fetchConversationById(conversationId);
        targetConv = newConvData;
      }

      if (targetConv) {
        const other = (
          targetConv.participants as (ConversationParticipant & { profile: Profile })[]
        ).find((p) => p.user_id !== currentUser.id);

        setConversation(targetConv as unknown as ConversationWithDetails);
        setOtherParticipant(other?.profile || null);
      }
    } catch (err) {
      console.error('Error finding/creating conversation:', err);
      setError(
        err instanceof Error ? err.message : 'Connection issue'
      );
    }

    setIsLoading(false);
    setIsRetrying(false);
  }, [currentUser.id, selectedStudentId, isStaff]);

  useEffect(() => {
    findOrCreateConversation();
  }, [findOrCreateConversation]);

  // ── Instructor: show placeholder when no student selected ──
  if (isStaff && !conversation && !isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 text-gray-400 ${className}`}>
        <MessageSquareOff className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium">Select a student to start chatting</p>
      </div>
    );
  }

  // ── Conversation loaded — render real ChatWindow ──
  if (conversation) {
    return (
      <ChatWindow
        conversationId={conversation.id}
        currentUser={currentUser}
        conversationType="direct"
        title={otherParticipant?.full_name || 'Your Instructor'}
        otherParticipant={otherParticipant || undefined}
        hideHeader={hideHeader}
        className={className}
      />
    );
  }

  // ── Student: always show a chat-like shell with inline error banner ──
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl ring-1 ring-pink-100/40 ${className}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-3 border-b border-pink-100/40 bg-white/30 px-5 py-3 backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-sm font-bold text-white shadow-sm">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Your Instructor</h3>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Direct Message
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message area with inline status */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-8">
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
        ) : error ? (
          <>
            {/* Small inline error banner */}
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs font-medium text-amber-700">{error}</span>
              <button
                onClick={() => findOrCreateConversation(true)}
                disabled={isRetrying}
                className="ml-2 flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-amber-700 shadow-sm ring-1 ring-amber-200 transition-all hover:bg-amber-50 disabled:opacity-50"
              >
                {isRetrying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Retry
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">Starting your chat...</p>
        )}
      </div>

      {/* Disabled input area — looks like a real text box */}
      <div className="border-t border-pink-100/40 bg-white/30 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 ring-1 ring-gray-200">
          <input
            type="text"
            disabled
            placeholder="Connecting..."
            className="flex-1 bg-transparent text-sm text-gray-400 outline-none disabled:cursor-not-allowed"
          />
          <button
            disabled
            className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}