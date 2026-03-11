'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import type { ConversationType, MessageContentType } from '@/types/database';

export async function getConversationIdForBatch(batchId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: batch, error } = await supabase
    .from('batches')
    .select('conversation_id')
    .eq('id', batchId)
    .single();

  if (error || !batch) return null;
  return batch.conversation_id;
}

export async function sendMessageToBatch(conversationId: string, content: string, senderId: string) {
  const supabase = await createServerSupabaseClient();

  // First verify if chat is enabled
  const { data: conv } = await supabase
    .from('conversations')
    .select('is_chat_enabled, type')
    .eq('id', conversationId)
    .single();

  if (conv && conv.is_chat_enabled === false) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', senderId)
      .single();

    if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
      return { success: false, error: 'Chat is currently disabled for this batch.' };
    }
  }

  // If this is a batch conversation, we should ideally use batch_messages table
  // but many parts of the UI might expect chat_messages if they use ChatWindow.
  // For now, keep using chat_messages for consistency with ChatWindow.
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content,
      content_type: 'text'
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getChatMessages(conversationId: string, limit = 50) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('chat_messages')
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, avatar_url, role)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Fetch messages error:', error);
    return [];
  }

  return data || [];
}

export async function toggleChatStatus(conversationId: string, isEnabled: boolean) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('conversations')
    .update({ is_chat_enabled: isEnabled })
    .eq('id', conversationId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchUserConversations(type?: ConversationType) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const admin = createAdminClient();

  // 1. Get IDs of conversations where this user is a participant
  const { data: participations } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (!participations || participations.length === 0) return [];

  const conversationIds = participations.map(p => p.conversation_id);

  // 2. Fetch the full conversation details
  let query = admin
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(
        user_id,
        profile:profiles!user_id(*)
      )
    `)
    .in('id', conversationIds);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

export async function fetchConversationById(id: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(
        user_id,
        profile:profiles!user_id(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching conversation by ID:', error);
    return null;
  }

  return data;
}

export async function getOrCreateStudentChat() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  // 1. Find an instructor
  const { data: instructors } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'instructor')
    .limit(1);

  if (!instructors || instructors.length === 0) {
    throw new Error('No instructors available');
  }

  const instructorId = instructors[0].id;

  // 2. Find common direct conversation between user and instructor
  const { data: commonParts } = await admin
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('user_id', [user.id, instructorId]);

  const convCounts: Record<string, number> = {};
  let commonId = null;

  if (commonParts) {
    // We want a conversation where BOTH are participants
    commonParts.forEach(p => {
      convCounts[p.conversation_id] = (convCounts[p.conversation_id] || 0) + 1;
    });

    // Find conv IDs that have 2 matching participants (user and instructor)
    const potentialIds = Object.keys(convCounts).filter(id => convCounts[id] === 2);

    if (potentialIds.length > 0) {
      // Verify it's a 'direct' conversation
      const { data: convs } = await admin
        .from('conversations')
        .select('id, type')
        .in('id', potentialIds)
        .eq('type', 'direct');

      if (convs && convs.length > 0) {
        commonId = convs[0].id;
      }
    }
  }

  if (commonId) return { conversationId: commonId };

  // 3. Create new one if none found
  const { data: newConv, error: convError } = await admin
    .from('conversations')
    .insert({ type: 'direct' })
    .select()
    .single();

  if (convError) throw convError;

  await admin.from('conversation_participants').insert([
    { conversation_id: newConv.id, user_id: user.id },
    { conversation_id: newConv.id, user_id: instructorId }
  ]);

  return { conversationId: newConv.id };
}

export async function getOrCreateDirectChat(studentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  // 1. Find common direct conversation
  const { data: commonParts } = await admin
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('user_id', [user.id, studentId]);

  const convCounts: Record<string, number> = {};
  let commonId = null;

  if (commonParts) {
    commonParts.forEach(p => {
      convCounts[p.conversation_id] = (convCounts[p.conversation_id] || 0) + 1;
    });

    const potentialIds = Object.keys(convCounts).filter(id => convCounts[id] === 2);

    if (potentialIds.length > 0) {
      const { data: convs } = await admin
        .from('conversations')
        .select('id, type')
        .in('id', potentialIds)
        .eq('type', 'direct');

      if (convs && convs.length > 0) {
        commonId = convs[0].id;
      }
    }
  }

  if (commonId) return { conversationId: commonId };

  // 2. Create new one
  const { data: newConv, error: convError } = await admin
    .from('conversations')
    .insert({ type: 'direct' })
    .select()
    .single();

  if (convError) throw convError;

  await admin.from('conversation_participants').insert([
    { conversation_id: newConv.id, user_id: user.id },
    { conversation_id: newConv.id, user_id: studentId }
  ]);

  return { conversationId: newConv.id };
}

export async function searchStudents(query: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select(`
            *,
            subscriptions!student_id (*)
        `)
    .eq('role', 'student')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error('Search error:', error);
    return [];
  }
  return data || [];
}

export async function getConversationChatStatus(conversationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('conversations')
    .select('is_chat_enabled')
    .eq('id', conversationId)
    .single();

  if (error || !data) return true; // Default to enabled
  return data.is_chat_enabled;
}

export async function sendChatMessage(
  conversationId: string,
  content: string,
  contentType: MessageContentType = 'text',
  fileUrl?: string,
  fileName?: string,
  replyTo?: string
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  // Check if chat is enabled
  const isEnabled = await getConversationChatStatus(conversationId);
  if (!isEnabled) {
    // Only instructor/admin can bypass
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
      throw new Error('Chat is currently disabled by the instructor.');
    }
  }

  const { error } = await admin
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      content_type: contentType,
      file_url: fileUrl,
    });

  if (error) throw error;
  return { success: true };
}

export async function fetchActiveOneOnOneStudents(instructorId: string) {
  const admin = createAdminClient();

  // 1. Get all profiles of students who are currently in an active one_on_one subscription
  // Using admin to ensure we see all active subs for the instructor's dashboard
  const { data: subscriptions, error: subError } = await admin
    .from('subscriptions')
    .select(`
      student_id,
      profiles!student_id(
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('plan_type', 'one_on_one')
    .eq('status', 'active');

  if (subError) {
    console.error('Error fetching one-on-one subscriptions:', subError);
    return [];
  }

  if (!subscriptions || subscriptions.length === 0) return [];

  const students = subscriptions.map((s: any) => {
    // PostgREST might return profiles as an array or object depending on schema
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    return profile;
  }).filter(Boolean);

  if (students.length === 0) return [];

  // 2. For each student, find the direct conversation ID with this instructor
  // Use admin to bypass RLS on participants
  const { data: allParticipants, error: partError } = await admin
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('user_id', [instructorId, ...students.map(s => s.id)]);

  if (partError) {
    console.error('Error fetching conversation participants:', partError);
    return [];
  }

  // 3. For the found IDs, get their conversation types to filter for 'direct'
  const { data: conversations } = await admin
    .from('conversations')
    .select('id, type')
    .in('id', Array.from(new Set(allParticipants.map(p => p.conversation_id))))
    .eq('type', 'direct');

  const directConvIds = new Set(conversations?.map(c => c.id) || []);

  // 4. Match students to direct conversation IDs
  const result = students.map((student: any) => {
    // Find a conversation where both the instructor and this student are participants AND it is a direct chat
    const instructorConvs = allParticipants
      .filter((p: any) => p.user_id === instructorId)
      .map((p: any) => p.conversation_id);

    const studentConvs = allParticipants
      .filter((p: any) => p.user_id === student.id)
      .map((p: any) => p.conversation_id);

    const commonConvId = instructorConvs.find((id: string) => studentConvs.includes(id) && directConvIds.has(id));

    return {
      ...student,
      conversationId: commonConvId || null
    };
  }).filter((s: any) => s.conversationId !== null); // Only return students with conversations for now

  return result;
}

export async function getBatchMessages(batchId: string, limit = 50) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('batch_messages')
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, avatar_url, role)
    `)
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Fetch batch messages error:', error);
    return [];
  }

  return data || [];
}

export async function sendBatchMessage(batchId: string, content: string, senderId: string) {
  const supabase = await createServerSupabaseClient();

  // Verify if chat is enabled on the batch
  const { data: batch } = await supabase
    .from('batches')
    .select('is_chat_enabled, instructor_id')
    .eq('id', batchId)
    .single();

  if (batch && batch.is_chat_enabled === false) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', senderId)
      .single();

    if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
      return { success: false, error: 'Chat is currently disabled for this batch.' };
    }
  }

  const { error } = await supabase
    .from('batch_messages')
    .insert({
      batch_id: batchId,
      sender_id: senderId,
      content: content,
      content_type: 'text'
    });

  if (error) {
    console.error("SEND BATCH MESSAGE ERROR:", error);
    return { success: false, error: error.message || JSON.stringify(error) };
  }
  return { success: true };
}

export async function toggleBatchChat(batchId: string, isEnabled: boolean) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('batches')
    .update({ is_chat_enabled: isEnabled })
    .eq('id', batchId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}