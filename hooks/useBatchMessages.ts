'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { ChatMessageWithSender } from '@/types/database';
import { getBatchMessages, sendBatchMessage } from '@/lib/actions/chat';
import { createClient } from '@/lib/supabase/client';

interface UseBatchMessagesOptions {
  batchId: string;
  currentUserId: string;
}

/**
 * Same shape as useRealtimeMessages, but for the batch/group chat system
 * (batch_messages table), which — unlike the 1-on-1 chat_messages system —
 * has no shared hook of its own; this logic was previously hand-duplicated
 * inline in InstructorGroupClient.tsx and StudentGroupHub.tsx.
 */
export function useBatchMessages({ batchId, currentUserId }: UseBatchMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const normalize = useCallback(
    (row: any): ChatMessageWithSender => ({
      id: row.id,
      conversation_id: batchId,
      sender_id: row.sender_id,
      content: row.content,
      content_type: row.content_type || 'text',
      file_url: row.file_url || null,
      created_at: row.created_at,
      sender: row.sender,
    }),
    [batchId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessageWithSender = {
        id: tempId,
        conversation_id: batchId,
        sender_id: currentUserId,
        content,
        content_type: 'text',
        file_url: null,
        created_at: new Date().toISOString(),
        sender: { id: currentUserId } as any,
      };
      setMessages((prev) => [...prev, optimistic]);

      const res = await sendBatchMessage(batchId, content, currentUserId);
      if (!res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert('Failed to send message: ' + (res.error || 'Unknown error'));
      }
    },
    [batchId, currentUserId]
  );

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    getBatchMessages(batchId).then((rows) => {
      if (mounted) {
        setMessages(rows.map(normalize));
        setIsLoading(false);
      }
    });

    const channel = supabase
      .channel(`batch-chat-embed-${batchId}-${Math.random().toString(36).slice(2, 9)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'batch_messages', filter: `batch_id=eq.${batchId}` },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const temps = prev.filter(
              (m) => m.id.startsWith('temp-') && m.sender_id === row.sender_id && m.content === row.content
            );
            const withoutTemps = temps.length ? prev.filter((m) => !temps.includes(m)) : prev;

            if (row.sender_id === currentUserId) {
              return [...withoutTemps, normalize(row)];
            }
            // Message from someone else — fetch to get their sender profile.
            supabase
              .from('profiles')
              .select('id, full_name, avatar_url, role')
              .eq('id', row.sender_id)
              .single()
              .then(({ data: sender }: { data: any }) => {
                setMessages((curr) => {
                  if (curr.some((m) => m.id === row.id)) return curr;
                  return [...curr, normalize({ ...row, sender })];
                });
              });
            return withoutTemps;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'batch_messages', filter: `batch_id=eq.${batchId}` },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === row.id ? { ...m, content: row.content, content_type: row.content_type } : m))
          );
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [batchId, currentUserId, normalize, supabase]);

  return { messages, isLoading, sendMessage };
}
