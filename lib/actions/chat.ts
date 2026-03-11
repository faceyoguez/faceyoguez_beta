'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

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
    .select('is_chat_enabled')
    .eq('id', conversationId)
    .single();

  if (conv && conv.is_chat_enabled === false) {
    // Here we could add logic to allow instructors to bypass the disable flag
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
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      sender:profiles(id, full_name, avatar_url, role)
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

export async function fetchUserConversations(type?: 'direct' | 'group' | 'batch') {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(
        user_id,
        profile:profiles(*)
      )
    `);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // Filter conversations where the user is a participant
  // (In a real scenario, the query above would be filtered by participant user_id via a join or where clause)
  return data?.filter(conv =>
    (conv.participants as any[]).some(p => p.user_id === user.id)
  ) || [];
}

export async function fetchConversationById(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(
        user_id,
        profile:profiles(*)
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

  const { data: instructors } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'instructor')
    .limit(1);

  if (!instructors || instructors.length === 0) {
    throw new Error('No instructors available');
  }

  const instructorId = instructors[0].id;

  // Search participants
  const { data: connections } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  const { data: instConnections } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', instructorId);

  const commonId = connections?.find(c => instConnections?.some(ic => ic.conversation_id === c.conversation_id))?.conversation_id;

  if (commonId) {
    const { data: conv } = await supabase.from('conversations').select('type').eq('id', commonId).single();
    if (conv?.type === 'direct') return { conversationId: commonId };
  }

  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({ type: 'direct' })
    .select()
    .single();

  if (convError) throw convError;

  await supabase.from('conversation_participants').insert([
    { conversation_id: newConv.id, user_id: user.id },
    { conversation_id: newConv.id, user_id: instructorId }
  ]);

  return { conversationId: newConv.id };
}

export async function getOrCreateDirectChat(studentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: connections } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  const { data: studConnections } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', studentId);

  const commonId = connections?.find(c => studConnections?.some(sc => sc.conversation_id === c.conversation_id))?.conversation_id;

  if (commonId) {
    const { data: conv } = await supabase.from('conversations').select('type').eq('id', commonId).single();
    if (conv?.type === 'direct') return { conversationId: commonId };
  }

  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({ type: 'direct' })
    .select()
    .single();

  if (convError) throw convError;

  await supabase.from('conversation_participants').insert([
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
            subscriptions (*)
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
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
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
  contentType: 'text' | 'image' | 'pdf' | 'file' = 'text',
  fileUrl?: string,
  fileName?: string,
  replyTo?: string
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if chat is enabled
  const isEnabled = await getConversationChatStatus(conversationId);
  if (!isEnabled) {
    // Only instructor/admin can bypass
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
      throw new Error('Chat is currently disabled by the instructor.');
    }
  }

  const { error } = await supabase
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
  const supabase = await createServerSupabaseClient();

  // 1. Get all profiles of students who are currently in an active one_on_one subscription
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select(`
      student_id,
      profiles:student_id (
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

  const students = subscriptions.map(s => s.profiles as any);
  if (students.length === 0) return [];

  // 2. For each student, find the direct conversation ID with this instructor
  const { data: allParticipants, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('user_id', [instructorId, ...students.map(s => s.id)]);

  if (partError) {
    console.error('Error fetching conversation participants:', partError);
    return [];
  }

  // 3. Match students to conversation IDs
  const result = students.map(student => {
    // Find a conversation where both the instructor and this student are participants
    const instructorConvs = allParticipants
      .filter(p => p.user_id === instructorId)
      .map(p => p.conversation_id);

    const studentConvs = allParticipants
      .filter(p => p.user_id === student.id)
      .map(p => p.conversation_id);

    const commonConvId = instructorConvs.find(id => studentConvs.includes(id));

    return {
      ...student,
      conversationId: commonConvId || null
    };
  }).filter(s => s.conversationId !== null); // Only return students with conversations for now

  return result;
}

export async function getBatchMessages(batchId: string, limit = 50) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('batch_messages')
    .select(`
      *,
      sender:profiles(id, full_name, avatar_url, role)
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