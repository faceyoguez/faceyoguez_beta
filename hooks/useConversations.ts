'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchUserConversations } from '@/lib/actions/chat';
import type { ConversationWithDetails } from '@/types/database';

interface UseConversationsOptions {
  userId: string;
  type?: 'direct' | 'group';
}

export function useConversations({ userId, type }: UseConversationsOptions) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    try {
      const data = await fetchUserConversations(type);
      setConversations(data as ConversationWithDetails[]);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    setIsLoading(false);
  }, [type]);

  useEffect(() => {
    fetchConversations();

    // Keep real-time subscription for live updates — when a change happens,
    // re-fetch using the server action
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, supabase]);

  return { conversations, isLoading, refresh: fetchConversations };
}
