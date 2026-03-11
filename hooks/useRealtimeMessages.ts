'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { ChatMessageWithSender, Profile } from '@/types/database';
import { sendChatMessage, getConversationChatStatus } from '@/lib/actions/chat';
import { createClient } from '@/lib/supabase/client';

/**
 * useRealtimeMessages — Real-time chat hook
 *
 * Uses API routing for fetching, and Server Actions for sending (reliable auth).
 * Uses Supabase Realtime Broadcast (WebSockets) for instant message delivery without polling.
 */

interface UseRealtimeMessagesOptions {
  conversationId: string;
  currentUserId: string;
  pageSize?: number;
}

export function useRealtimeMessages({
  conversationId,
  currentUserId,
  pageSize = 50,
}: UseRealtimeMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const mountedRef = useRef(true);
  const lastSignatureRef = useRef('');
  const channelRef = useRef<any>(null); // Type 'RealtimeChannel' is tricky without deep imports, 'any' is safe here since we control it

  // ── Fetch messages via API route ──
  const fetchMessages = useCallback(
    async (before?: string) => {
      try {
        const params = new URLSearchParams();
        if (before) params.set('before', before);
        params.set('pageSize', String(pageSize));
        params.set('_t', String(Date.now())); // Cache bust

        const res = await fetch(
          `/api/chat/messages/${conversationId}?${params.toString()}`,
          { credentials: 'include', cache: 'no-store' }
        );

        if (!res.ok) {
          console.error('[CHAT] Fetch failed:', res.status);
          return;
        }

        const { messages: data } = await res.json();
        if (!mountedRef.current) return;

        const fetched = (data || []) as ChatMessageWithSender[];

        if (before) {
          // Loading older messages — prepend
          setMessages((prev) => [...fetched, ...prev]);
        } else {
          // Check if anything changed using message IDs
          const sig = fetched.map((m) => m.id).join(',');
          if (sig === lastSignatureRef.current && fetched.length > 0) {
            return; // No change, skip re-render
          }
          lastSignatureRef.current = sig;

          setMessages((prev) => {
            // Keep optimistic messages not yet confirmed
            const temps = prev.filter((m) =>
              m.id.startsWith('temp-') &&
              !fetched.some(
                (fm) => fm.sender_id === m.sender_id && fm.content === m.content
              )
            );
            return temps.length > 0 ? [...fetched, ...temps] : fetched;
          });
        }

        setHasMore(fetched.length === pageSize);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
      if (mountedRef.current) setIsLoading(false);
    },
    [conversationId, pageSize]
  );

  // ── Load more (older messages) ──
  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(messages[0].created_at);
    }
  }, [messages, hasMore, fetchMessages]);

  // ── Send message via Server Action ──
  const sendMessage = useCallback(
    async (
      content: string,
      contentType: 'text' | 'image' | 'pdf' | 'file' = 'text',
      fileUrl?: string,
      fileName?: string,
      replyTo?: string
    ) => {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessageWithSender = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        content_type: contentType,
        file_url: fileUrl || null,
        created_at: new Date().toISOString(),
        sender: { id: currentUserId } as Profile,
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        // Send via Server Action (bypasses RLS, extremely reliable)
        await sendChatMessage(
          conversationId,
          content,
          contentType,
          fileUrl,
          fileName,
          replyTo
        );

        // Force re-fetch to replace optimistic with real message without blocking UI
        lastSignatureRef.current = '';
        fetchMessages();

        // Broadcast to other client that a new message was sent!
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'new_message',
            payload: { timestamp: Date.now() },
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert('Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    },
    [conversationId, currentUserId, fetchMessages]
  );

  // ── Send file ──
  const sendFile = useCallback(
    async (file: File, contentType: 'image' | 'pdf' | 'file') => {
      const supabase = createClient();

      const fileExt = file.name.split('.').pop();
      const filePath = `${conversationId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(uploadData.path);

      await sendMessage('', contentType, urlData.publicUrl, file.name);
    },
    [conversationId, sendMessage]
  );

  // ── Lifecycle: WebSockets (Supabase Broadcast) ──
  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchMessages();

    // Check chat status
    getConversationChatStatus(conversationId)
      .then(setIsChatEnabled)
      .catch(console.error);

    // Subscribe to Supabase Broadcast for this specific conversation room
    const supabase = createClient();
    const channel = supabase.channel(`room:${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'new_message' }, () => {
        // When the other person sends a message, they broadcast this event
        console.log('[CHAT WEBSOCKET] Received new message ping, fetching...');
        lastSignatureRef.current = ''; // Force refetch
        fetchMessages();
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          console.log('[CHAT WEBSOCKET] Received Postgres INSERT, fetching...');
          lastSignatureRef.current = ''; // Force refetch
          fetchMessages();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[CHAT WEBSOCKET] Connected to room:', conversationId.slice(0, 8));
        }
      });

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, fetchMessages]);

  return {
    messages,
    isLoading,
    hasMore,
    isChatEnabled,
    sendMessage,
    sendFile,
    loadMore,
  };
}
