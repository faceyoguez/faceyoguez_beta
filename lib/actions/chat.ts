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

    if (!['instructor', 'admin', 'staff', 'client_management'].includes(profile?.role || '')) {
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
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const admin = createAdminClient();

  // Auth Check: Ensure user is a participant
  const { data: isParticipant } = await admin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

  if (!isParticipant) {
      const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
      if (!['admin', 'staff', 'instructor', 'client_management'].includes(profile?.role || '')) {
          return [];
      }
  }

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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'staff', 'instructor', 'client_management'].includes(profile?.role || '')) {
      return { success: false, error: 'Forbidden' };
  }

  const { error } = await admin
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

// Create or find a direct conversation between two specific users (used by instructor assignment)
/**
 * getOrCreateSharedChat — The canonical one-on-one support conversation.
 *
 * For each student, the "real" conversation is between the student and their
 * assigned instructor.  When staff (or anyone else) opens the chat, they are
 * added as a participant of that SAME conversation rather than creating a new
 * one.  This means the student, the instructor, and any staff member all see
 * the same message thread.
 */
export async function getOrCreateSharedChat(studentId: string, assignedInstructorId: string | null) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();

  // 1. Find a direct conversation where the student is a participant.
  const { data: studentParts } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', studentId);

  let sharedConvId: string | null = null;

  if (studentParts && studentParts.length > 0) {
    const convIds = studentParts.map(p => p.conversation_id);
    const { data: convs } = await admin
      .from('conversations')
      .select('id, type')
      .in('id', convIds)
      .eq('type', 'direct')
      .order('created_at', { ascending: true })
      .limit(1);

    if (convs && convs.length > 0) {
      sharedConvId = convs[0].id;
    }
  }

  // 2. No shared conversation yet — create one with all relevant participants.
  if (!sharedConvId) {
    let targetInstructorId = assignedInstructorId;
    if (!targetInstructorId) {
      const { data: instructors } = await admin.from('profiles').select('id').eq('role', 'instructor').limit(1);
      targetInstructorId = instructors && instructors.length > 0 ? instructors[0].id : user.id;
    }

    const { data: newConv, error: convError } = await admin
      .from('conversations')
      .insert({ type: 'direct' })
      .select()
      .single();

    if (convError) throw convError;
    sharedConvId = newConv.id;

    const participantRows: { conversation_id: string; user_id: string }[] = [
      { conversation_id: newConv.id, user_id: studentId },
      { conversation_id: newConv.id, user_id: targetInstructorId! },
    ];
    await admin.from('conversation_participants').insert(participantRows);
  }

  // 3. Ensure the current staff/instructor is a participant so they can use it
  if (sharedConvId) {
    const { data: existing } = await admin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', sharedConvId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      await admin.from('conversation_participants').insert({
        conversation_id: sharedConvId,
        user_id: user.id,
      });
    }
  }

  return { conversationId: sharedConvId };
}

export async function getOrCreateDirectChatBetween(userId1: string, userId2: string) {
  const admin = createAdminClient();

  const { data: commonParts } = await admin
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('user_id', [userId1, userId2]);

  if (commonParts) {
    const convCounts: Record<string, number> = {};
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
        return { conversationId: convs[0].id };
      }
    }
  }

  const { data: newConv, error: convError } = await admin
    .from('conversations')
    .insert({ type: 'direct' })
    .select()
    .single();

  if (convError) throw convError;

  await admin.from('conversation_participants').insert([
    { conversation_id: newConv.id, user_id: userId1 },
    { conversation_id: newConv.id, user_id: userId2 }
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
    if (!['instructor', 'admin', 'staff', 'client_management'].includes(profile?.role || '')) {
      throw new Error('Chat is currently disabled by the instructor.');
    }
  }

  // Auth Check: Ensure user is a participant
  const { data: isParticipant } = await admin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

  if (!isParticipant) {
      const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
      if (!['admin', 'staff', 'instructor', 'client_management'].includes(profile?.role || '')) {
          throw new Error('Forbidden. You do not have access to this conversation.');
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

  // Check if this user is master instructor, staff, or client_management
  const { data: currentProfile } = await admin
    .from('profiles')
    .select('role, is_master_instructor')
    .eq('id', instructorId)
    .single();

  const isMaster = currentProfile?.is_master_instructor === true;
  const isStaffRole = ['admin', 'staff', 'client_management'].includes(currentProfile?.role || '');
  const seesAll = isMaster || isStaffRole;

  // 1. Get active one_on_one subscriptions
  let query = admin
    .from('subscriptions')
    .select(`
      id,
      student_id,
      is_trial,
      start_date,
      end_date,
      assigned_instructor_id,
      profiles!student_id(
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('plan_type', 'one_on_one')
    .eq('status', 'active');

  // Regular instructors only see students assigned to them
  if (!seesAll) {
    query = query.eq('assigned_instructor_id', instructorId);
  }

  const { data: subscriptions, error: subError } = await query;

  if (subError) {
    console.error('Error fetching one-on-one subscriptions:', subError);
    return [];
  }

  if (!subscriptions || subscriptions.length === 0) return [];

  // Build student list with subscription info
  const studentsWithSubs = subscriptions.map((s: any) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    if (!profile) return null;

    // Calculate days left
    let daysLeft: number | null = null;
    if (s.end_date) {
      const end = new Date(s.end_date);
      const now = new Date();
      daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      ...profile,
      subscriptionId: s.id,
      isTrial: s.is_trial || false,
      daysLeft,
      assignedInstructorId: s.assigned_instructor_id,
      startDate: s.start_date || null,
    };
  }).filter(Boolean);

  if (studentsWithSubs.length === 0) return [];

  // Deduplicate by student ID to prevent React key errors in the hub
  const seenIds = new Set();
  const uniqueStudentsWithSubs = studentsWithSubs.filter(s => {
    if (seenIds.has(s.id)) return false;
    seenIds.add(s.id);
    return true;
  });

  // 2. Find the shared direct conversation for each student.
  //    Staff AND master instructors must look up the conversation between the
  //    student's ASSIGNED instructor and the student (not their own ID).
  const studentIds = uniqueStudentsWithSubs.map((s: any) => s.id);
  const useAssignedMatching = isStaffRole || isMaster;
  const assignedInstructorIds = useAssignedMatching
    ? Array.from(new Set(uniqueStudentsWithSubs.map((s: any) => s.assignedInstructorId).filter(Boolean)))
    : [];

  const queryUserIds = Array.from(new Set([instructorId, ...studentIds, ...assignedInstructorIds]));

  const { data: allParticipants, error: partError } = await admin
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('user_id', queryUserIds);

  if (partError) {
    console.error('Error fetching conversation participants:', partError);
    return [];
  }

  // 3. Filter for direct conversations
  const convIds = Array.from(new Set(allParticipants.map(p => p.conversation_id)));
  const { data: conversations } = await admin
    .from('conversations')
    .select('id, type')
    .in('id', convIds)
    .eq('type', 'direct');

  const directConvIds = new Set(conversations?.map(c => c.id) || []);

  // 4. Match students to conversations.
  // We want the primary direct conversation for the student.
  const result = uniqueStudentsWithSubs.map((student: any) => {
    const studentConvs = allParticipants
      .filter((p: any) => p.user_id === student.id)
      .map((p: any) => p.conversation_id);

    // find a direct conversation that the student is part of
    const commonConvId = studentConvs.find((id: string) => directConvIds.has(id));

    return {
      ...student,
      conversationId: commonConvId || null
    };
  });

  // All roles: show all assigned students, even if no conversation yet
  // The client will offer a "Start Chat" button if conversationId is null
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
  const admin = createAdminClient();

  // Verify user is part of batch, or is staff/instructor
  const { data: senderProfile } = await admin.from('profiles').select('role').eq('id', senderId).single();
  const role = senderProfile?.role || '';

  if (!['admin', 'staff', 'instructor', 'client_management'].includes(role)) {
     const { data: enrolled } = await admin.from('batch_students').select('id').eq('batch_id', batchId).eq('student_id', senderId).maybeSingle();
     if (!enrolled) {
         return { success: false, error: 'Forbidden. Not enrolled in this batch.' };
     }
  }

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

    if (!['instructor', 'admin', 'staff', 'client_management'].includes(profile?.role || '')) {
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'staff', 'instructor', 'client_management'].includes(profile?.role || '')) {
      return { success: false, error: 'Forbidden' };
  }

  const { error } = await supabase
    .from('batches')
    .update({ is_chat_enabled: isEnabled })
    .eq('id', batchId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}