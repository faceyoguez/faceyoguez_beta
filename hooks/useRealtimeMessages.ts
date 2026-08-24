'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
}

export function useRealtimeMessages({
  conversationId,
  currentUserId,
}: UseRealtimeMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const mountedRef = useRef(true);
  const lastSignatureRef = useRef('');
  const hasLoadedOnceRef = useRef(false);

  // ── Fetch messages via API route — loads a week at a time. `before` is
  // the oldest currently-loaded message's created_at; omitted for the
  // initial "last 7 days" load. ──
  const fetchMessages = useCallback(
    async (before?: string) => {
      try {
        const params = new URLSearchParams();
        if (before) params.set('before', before);
        params.set('_t', String(Date.now())); // Cache bust

        const res = await fetch(
          `/api/chat/messages/${conversationId}?${params.toString()}`,
          { credentials: 'include', cache: 'no-store' }
        );

        if (!res.ok) {
          console.error('[CHAT] Fetch failed:', res.status);
          return;
        }

        const { messages: data, hasMore: moreAvailable } = await res.json();
        if (!mountedRef.current) return;

        const fetched = (data || []) as ChatMessageWithSender[];

        if (before) {
          // Loading an older week — prepend, nothing to dedupe against.
          setMessages((prev) => [...fetched, ...prev]);
          setHasMore(!!moreAvailable);
        } else {
          // Initial load or realtime refresh of "the last 7 days" window.
          // Merge rather than replace — a realtime refetch must not wipe
          // out older weeks the user already scrolled back through.
          const sig = fetched.map((m) => m.id).join(',');
          if (sig === lastSignatureRef.current && fetched.length > 0) {
            return; // No change, skip re-render
          }
          lastSignatureRef.current = sig;

          setMessages((prev) => {
            const confirmed = prev.filter((m) => !m.id.startsWith('temp-'));
            const confirmedIds = new Set(confirmed.map((m) => m.id));
            const temps = prev.filter((m) =>
              m.id.startsWith('temp-') &&
              !fetched.some((fm) => fm.sender_id === m.sender_id && fm.content === m.content)
            );
            const newOnes = fetched.filter((fm) => !confirmedIds.has(fm.id));
            return [...confirmed, ...newOnes, ...temps].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });

          // Only trust hasMore from a true initial load — a realtime refresh
          // re-fetches just the last-week window and says nothing about
          // whether older weeks the user already loaded still have more.
          if (!hasLoadedOnceRef.current) {
            hasLoadedOnceRef.current = true;
            setHasMore(!!moreAvailable);
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
      if (mountedRef.current) setIsLoading(false);
    },
    [conversationId]
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
      contentType: 'text' | 'image' | 'pdf' | 'file' | 'voice' = 'text',
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

        // We no longer trigger a full API fetchMessages here, as the database
        // INSERT trigger will capture the insertion and match/promote this message.

      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert('Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    },
    [conversationId, currentUserId]
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

  // ── Send voice note ──
  const sendVoice = useCallback(
    async (blob: Blob) => {
      const supabase = createClient();

      const filePath = `${conversationId}/${Date.now()}.webm`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, blob, {
          contentType: 'audio/webm',
        });

      if (uploadError) {
        console.error('Voice upload error:', uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(uploadData.path);

      await sendMessage('', 'voice', urlData.publicUrl, 'voice-note.webm');
    },
    [conversationId, sendMessage]
  );

  // ── Singleton Supabase client for this hook instance ──
  const supabase = useMemo(() => createClient(), []);

  // ── Lifecycle: WebSockets (Supabase Broadcast) ──
  useEffect(() => {
    mountedRef.current = true;
    hasLoadedOnceRef.current = false;
    lastSignatureRef.current = '';
    setMessages([]);
    setIsLoading(true);
    setHasMore(true);

    // Initial fetch
    fetchMessages();

    // Check chat status
    getConversationChatStatus(conversationId)
      .then(setIsChatEnabled)
      .catch(console.error);

    // Subscribe to Supabase Realtime for Postgres Changes (unique channel to avoid listener leaks)
    const changesTopic = `changes:${conversationId}-${Math.random().toString(36).slice(2, 9)}`;
    const changesChannel = supabase.channel(changesTopic);

    changesChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          console.log('[CHAT WEBSOCKET] Received Postgres INSERT:', payload);
          const newMessage = payload.new;
          if (newMessage) {
            if (newMessage.sender_id === currentUserId) {
              // Promote the optimistic message (update its temp ID and timestamp with real DB data)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id.startsWith('temp-') &&
                  msg.content === newMessage.content &&
                  msg.file_url === newMessage.file_url
                    ? { ...msg, id: newMessage.id, created_at: newMessage.created_at }
                    : msg
                )
              );
            } else {
              // Message is from the other user — execute a single fetch to retrieve the message with its sender profile
              console.log('[CHAT WEBSOCKET] Message from other user, fetching latest...');
              lastSignatureRef.current = '';
              fetchMessages();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          console.log('[CHAT WEBSOCKET] Received Postgres UPDATE:', payload);
          const updatedMessage = payload.new;
          if (updatedMessage) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMessage.id
                  ? { ...msg, content: updatedMessage.content, content_type: updatedMessage.content_type }
                  : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(changesChannel);
    };
  }, [conversationId, currentUserId, fetchMessages, supabase]);

  return {
    messages,
    isLoading,
    hasMore,
    isChatEnabled,
    sendMessage,
    sendFile,
    sendVoice,
    loadMore,
  };
}
