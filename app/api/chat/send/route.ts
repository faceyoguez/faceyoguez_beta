import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimitByUser } from '@/lib/rate-limit';
import { sanitizeInput, validateContentLength, isValidUUID, logSecurityEvent } from '@/lib/security';

const MAX_MESSAGE_LENGTH = 5000;
const RATE_LIMIT_PER_MIN = 30;

/**
 * POST /api/chat/send
 * Sends a message in a conversation using admin client (bypasses RLS).
 * Auth verified via cookies. Rate limited to 30 msgs/min per user.
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

        // ── Rate Limiting: 30 messages per minute per user ──
        const rl = rateLimitByUser(user.id, RATE_LIMIT_PER_MIN, 60_000);
        if (!rl.success) {
            logSecurityEvent('rate_limit_exceeded', { userId: user.id, path: '/api/chat/send' });
            return NextResponse.json(
                { error: 'Too many messages. Please wait a moment.' },
                { status: 429, headers: { 'Retry-After': '60' } }
            );
        }

        const body = await request.json();
        const { conversationId, content, contentType, fileUrl, fileName, replyTo } = body;

        // ── Input Validation ──
        if (!conversationId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Validate UUID format to prevent injection
        if (!isValidUUID(conversationId)) {
            logSecurityEvent('suspicious_input', { userId: user.id, metadata: { conversationId } });
            return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
        }

        // Validate message length
        const lengthCheck = validateContentLength(content, MAX_MESSAGE_LENGTH);
        if (!lengthCheck.valid) {
            return NextResponse.json({ error: lengthCheck.error }, { status: 400 });
        }

        // Sanitize content to prevent stored XSS
        const sanitizedContent = sanitizeInput(content);

        const admin = createAdminClient();

        // ── Auth Check: Ensure user is a participant ──
        const { data: isParticipant } = await admin
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (!isParticipant) {
            const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
            if (!['admin', 'staff', 'instructor', 'client_management'].includes(profile?.role || '')) {
                return NextResponse.json({ error: 'Forbidden. You do not have access to this conversation.' }, { status: 403 });
            }
        }

        const { data, error } = await admin
            .from('chat_messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: sanitizedContent,
                content_type: contentType || 'text',
                file_url: fileUrl || null,
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
