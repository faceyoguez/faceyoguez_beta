import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/chat/send
 * Sends a message in a conversation using admin client (bypasses RLS).
 * Auth verified via cookies.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { conversationId, content, contentType, fileUrl, fileName, replyTo } =
            await request.json();

        if (!conversationId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const admin = createAdminClient();

        const { data, error } = await admin
            .from('chat_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content,
                content_type: contentType || 'text',
                file_url: fileUrl || null,
                file_name: fileName || null,
                reply_to: replyTo || null,
            })
            .select(`*, sender:profiles!sender_id(id, full_name, avatar_url, role)`)
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update conversation timestamp
        await admin
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        return NextResponse.json({ message: data });
    } catch (err) {
        console.error('Send message API error:', err);
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }
}
