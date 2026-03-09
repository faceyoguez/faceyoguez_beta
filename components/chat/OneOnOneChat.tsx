'use client';

/**
 * OneOnOneChat — Reusable 1-on-1 chat component
 *
 * Handles conversation discovery AND auto-creation, then renders
 * a real-time ChatWindow between a student and their instructor.
 *
 * - Students: auto-finds or creates a conversation with an instructor
 * - Instructors: pass selectedStudentId to chat with a specific student
 *
 * Usage:
 *   <OneOnOneChat currentUser={profile} />
 */

import {
  getOrCreateStudentChat,
  fetchUserConversations,
  fetchConversationById,
} from '@/lib/actions/chat';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatWindow } from './ChatWindow';
import { Loader2, MessageSquareOff } from 'lucide-react';
import type { Profile, ConversationWithDetails, ConversationParticipant } from '@/types/database';

interface OneOnOneChatProps {
  currentUser: Profile;
  /** For instructors: which student to chat with */
  selectedStudentId?: string;
  /** Hide the header (when embedding inside another layout) */
  hideHeader?: boolean;
  /** CSS class for the wrapper */
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
  const supabase = createClient();

  const isStaff = ['admin', 'instructor', 'staff'].includes(currentUser.role);

  const findOrCreateConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Look for existing conversations via server action (bypasses RLS)
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

      // Step 2: If student has no conversation, auto-create one
      if (!targetConv && !isStaff) {
        try {
          const { conversationId } = await getOrCreateStudentChat();

          // Fetch the newly created conversation via server action
          const newConvData = await fetchConversationById(conversationId);
          targetConv = newConvData;
        } catch (createErr) {
          console.error('Error creating conversation:', createErr);
          setError(
            createErr instanceof Error
              ? createErr.message
              : 'Failed to start conversation'
          );
          setIsLoading(false);
          return;
        }
      }

      // Step 3: Set state
      if (targetConv) {
        const other = (
          targetConv.participants as (ConversationParticipant & { profile: Profile })[]
        ).find((p) => p.user_id !== currentUser.id);

        setConversation(targetConv as unknown as ConversationWithDetails);
        setOtherParticipant(other?.profile || null);
      }
    } catch (err) {
      console.error('Error finding conversation:', err);
      setError('Failed to load conversation');
    }

    setIsLoading(false);
  }, [currentUser.id, selectedStudentId, isStaff]);

  useEffect(() => {
    findOrCreateConversation();
  }, [findOrCreateConversation]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 text-gray-500 ${className}`}>
        <MessageSquareOff className="h-8 w-8 text-gray-300" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 text-gray-400 ${className}`}>
        <MessageSquareOff className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium">
          {isStaff
            ? 'Select a student to start chatting'
            : 'No instructor available right now'}
        </p>
      </div>
    );
  }

  return (
    <ChatWindow
      conversationId={conversation.id}
      currentUser={currentUser}
      conversationType="direct"
      title={otherParticipant?.full_name || 'Chat'}
      otherParticipant={otherParticipant || undefined}
      hideHeader={hideHeader}
      className={className}
    />
  );
}