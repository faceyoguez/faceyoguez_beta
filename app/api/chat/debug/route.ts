import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * DEBUG endpoint — remove in production.
 * Shows all conversations, their participants, and message counts.
 * Helps diagnose whether student and instructor share the same conversation.
 */
export async function GET() {
    const admin = createAdminClient();

    // Get all conversations with participants
    const { data: conversations, error: convError } = await admin
        .from('conversations')
        .select(`
      id,
      type,
      created_at,
      participants:conversation_participants(
        user_id,
        profile:profiles!user_id(id, full_name, email, role)
      )
    `)
        .eq('type', 'direct')
        .order('created_at', { ascending: false })
        .limit(20);

    if (convError) {
        return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // For each conversation, get message count and last few messages
    const result = await Promise.all(
        (conversations || []).map(async (conv: any) => {
            const { count } = await admin
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id);

            const { data: recentMessages } = await admin
                .from('chat_messages')
                .select('id, sender_id, content, content_type, created_at')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(3);

            return {
                conversationId: conv.id,
                type: conv.type,
                created_at: conv.created_at,
                participants: (conv.participants || []).map((p: any) => ({
                    user_id: p.user_id,
                    full_name: p.profile?.full_name,
                    email: p.profile?.email,
                    role: p.profile?.role,
                })),
                messageCount: count || 0,
                recentMessages: (recentMessages || []).reverse(),
            };
        })
    );

    return NextResponse.json({
        totalConversations: result.length,
        conversations: result,
    });
}
