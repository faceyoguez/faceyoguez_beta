'use server';

import {
  createServerSupabaseClient,
  createAdminClient,
} from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createDirectConversation(
  studentId: string,
  instructorId: string
) {
  const supabase = createAdminClient();

  // Find conversations where the student is a participant
  const { data: studentConvs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', studentId);

  // Find conversations where the instructor is a participant
  const { data: instructorConvs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', instructorId);

  // Find the intersection — conversations where BOTH are participants
  const studentConvIds = new Set(
    (studentConvs || []).map((c) => c.conversation_id)
  );
  const sharedConvIds = (instructorConvs || [])
    .map((c) => c.conversation_id)
    .filter((id) => studentConvIds.has(id));

  // Check which of these shared conversations is a 'direct' type
  if (sharedConvIds.length > 0) {
    const { data: directConvs } = await supabase
      .from('conversations')
      .select('id')
      .in('id', sharedConvIds)
      .eq('type', 'direct')
      .limit(1);

    if (directConvs && directConvs.length > 0) {
      return { conversationId: directConvs[0].id as string, isNew: false };
    }
  }

  // No existing conversation found — create a new one
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({ type: 'direct', created_by: instructorId })
    .select()
    .single();

  if (convError) throw new Error(convError.message);

  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: conv.id, user_id: studentId },
      { conversation_id: conv.id, user_id: instructorId },
    ]);

  if (partError) throw new Error(partError.message);

  return { conversationId: conv.id, isNew: true };
}

export async function getOrCreateDirectChat(studentId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan_type')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .eq('plan_type', 'one_on_one')
    .single();

  if (!sub) {
    throw new Error('Student does not have an active one-on-one subscription');
  }

  return createDirectConversation(studentId, user.id);
}

/**
 * Called from the STUDENT side.
 * Finds or creates a direct conversation between the logged-in student
 * and any available instructor.
 */
export async function getOrCreateStudentChat() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  // 1. Check if student already has a direct conversation
  const { data: existingParticipations } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)
    .is('left_at', null);

  if (existingParticipations && existingParticipations.length > 0) {
    const convIds = existingParticipations.map(
      (p: { conversation_id: string }) => p.conversation_id
    );

    const { data: existingConvs } = await admin
      .from('conversations')
      .select(
        `id, participants:conversation_participants(user_id, profile:profiles(id, role))`
      )
      .in('id', convIds)
      .eq('type', 'direct');

    const directConv = existingConvs?.find((conv: any) => {
      const participants = conv.participants as Array<any>;
      return participants.some(
        (p: any) =>
          p.user_id !== user.id &&
          ['instructor', 'admin', 'staff'].includes(p.profile?.role)
      );
    });

    if (directConv) {
      return { conversationId: directConv.id as string, isNew: false };
    }
  }

  // 2. No existing conversation — find an instructor
  const { data: instructors } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('role', ['instructor', 'admin'])
    .limit(1);

  if (!instructors || instructors.length === 0) {
    throw new Error('No instructor available');
  }

  // 3. Create the conversation
  const result = await createDirectConversation(user.id, instructors[0].id);

  // 4. If new conversation, insert welcome messages
  if (result.isNew) {
    const instructorId = instructors[0].id;
    const welcomeMessages = [
      'Welcome to FaceYoguez! 🙏✨',
      `Hi! I'm ${instructors[0].full_name || 'your instructor'}. I'll be guiding you on your face yoga journey.`,
      'Feel free to ask me anything — whether it\'s about exercises, routines, or tracking your progress.',
      'To get started, try practicing the exercises daily and share your progress photos here. I\'ll review and give you personalized feedback! 💪',
    ];

    const messageRows = welcomeMessages.map((content, i) => ({
      conversation_id: result.conversationId,
      sender_id: instructorId,
      content,
      content_type: 'text' as const,
      created_at: new Date(Date.now() + i * 1000).toISOString(),
    }));

    await admin.from('chat_messages').insert(messageRows);
  }

  return result;
}

export async function searchStudents(query: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `id, full_name, email, avatar_url, role,
       subscriptions(id, plan_type, status, start_date, end_date)`
    )
    .eq('role', 'student')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch all conversations for the currently authenticated user.
 * Uses the admin client to bypass RLS policies.
 */
export async function fetchUserConversations(type?: 'direct' | 'group') {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  // 1. Get conversation IDs where the user is a participant
  const { data: participantData } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)
    .is('left_at', null);

  if (!participantData || participantData.length === 0) {
    return [];
  }

  const conversationIds = participantData.map(
    (p: { conversation_id: string }) => p.conversation_id
  );

  // 2. Fetch full conversation details
  let convQuery = admin
    .from('conversations')
    .select(
      `*,
       participants:conversation_participants(
         *, profile:profiles(id, full_name, avatar_url, role, email)
       ),
       batch:batches(id, name, status, start_date, end_date)`
    )
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (type) {
    convQuery = convQuery.eq('type', type);
  }

  const { data: convData, error } = await convQuery;

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  // 3. Enrich with last message and unread count
  const enriched = await Promise.all(
    (convData || []).map(async (conv: Record<string, unknown>) => {
      const { data: lastMsg } = await admin
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conv.id as string)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const participants = conv.participants as Array<{
        user_id: string;
        last_read_at: string;
      }>;
      const participant = participants?.find((p) => p.user_id === user.id);
      const lastRead = participant?.last_read_at || (conv.created_at as string);

      const { count } = await admin
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id as string)
        .eq('is_deleted', false)
        .gt('created_at', lastRead)
        .neq('sender_id', user.id);

      return {
        ...conv,
        last_message: lastMsg || null,
        unread_count: count || 0,
      };
    })
  );

  return enriched;
}

/**
 * Fetch a single conversation by ID with full details.
 * Uses the admin client to bypass RLS policies.
 */
export async function fetchConversationById(conversationId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('conversations')
    .select(
      `*, participants:conversation_participants(
        *, profile:profiles(id, full_name, avatar_url, role, email)
      )`
    )
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  return data;
}

/**
 * Fetch messages for a conversation (server-side, bypasses RLS).
 */
export async function fetchMessages(
  conversationId: string,
  before?: string,
  pageSize: number = 50
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  let query = admin
    .from('chat_messages')
    .select(`*, sender:profiles!sender_id(id, full_name, avatar_url, role)`)
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []).reverse();
}

/**
 * Send a chat message (server-side, bypasses RLS).
 * After inserting, notifies the in-process chat hub for real-time SSE delivery.
 */
export async function sendChatMessage(
  conversationId: string,
  content: string,
  contentType: 'text' | 'image' | 'pdf' | 'file' = 'text',
  fileUrl?: string,
  fileName?: string,
  replyTo?: string
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      content_type: contentType,
      file_url: fileUrl || null,
      file_name: fileName || null,
      reply_to: replyTo || null,
    })
    .select(`*, sender:profiles!sender_id(id, full_name, avatar_url, role)`)
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw new Error(error.message);
  }

  // Update conversation timestamp
  await admin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Notify connected clients via the chat hub (in-process, instant)
  try {
    const { chatHub } = await import('@/lib/chat-hub');
    chatHub.notify(conversationId);
  } catch (e) {
    // Non-critical — clients will still poll as fallback
    console.error('Chat hub notify error:', e);
  }

  return data;
}

/**
 * Get the chat enabled status for a conversation.
 */
export async function getConversationChatStatus(conversationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('conversations')
    .select('is_chat_enabled')
    .eq('id', conversationId)
    .single();

  return data?.is_chat_enabled ?? true;
}

/**
 * Fetch all students with active one-on-one subscriptions (for instructor panel).
 * Returns students with their subscription info and existing conversation IDs.
 * Filters out non-students and the instructor's own profile.
 */
export async function fetchActiveOneOnOneStudents(instructorId: string) {
  const admin = createAdminClient();

  // Get all students with active one_on_one subscriptions
  const { data: subscriptions, error } = await admin
    .from('subscriptions')
    .select(`
      student_id,
      plan_type,
      status,
      start_date,
      end_date,
      student:profiles!student_id(id, full_name, email, avatar_url, role)
    `)
    .eq('plan_type', 'one_on_one')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return [];
  }

  // For each student, find or create a conversation with this instructor
  const students = await Promise.all(
    (subscriptions || []).map(async (sub: any) => {
      const student = sub.student as any;
      if (!student) return null;

      // Skip if this is the instructor themselves or not a student role
      if (student.id === instructorId) return null;
      if (student.role && student.role !== 'student') return null;

      // Check for existing conversation
      const { conversationId } = await createDirectConversation(
        student.id,
        instructorId
      );

      return {
        conversationId,
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        avatar_url: student.avatar_url,
      };
    })
  );

  return students.filter(Boolean);
}

export async function toggleGroupChat(
  conversationId: string,
  enabled: boolean
) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('conversations')
    .update({ is_chat_enabled: enabled })
    .eq('id', conversationId);

  if (error) throw new Error(error.message);
  revalidatePath('/instructor/groups');
}