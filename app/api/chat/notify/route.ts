import { NextRequest, NextResponse } from 'next/server';
import { chatHub } from '@/lib/chat-hub';

/**
 * Webhook endpoint to notify connected clients about new messages.
 * Called by the sendChatMessage server action after inserting a message.
 */
export async function POST(request: NextRequest) {
    try {
        const { conversationId } = await request.json();

        if (!conversationId) {
            return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
        }

        // Notify all connected SSE clients for this conversation
        chatHub.notify(conversationId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Chat notify error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
