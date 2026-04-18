import { NextRequest } from 'next/server';
import { chatHub } from '@/lib/chat-hub';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Track active connections per user to prevent connection flooding
const activeConnections = new Map<string, number>();
const MAX_CONNECTIONS_PER_USER = 3;
const CONNECTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * SSE endpoint for real-time chat updates.
 * Secured with authentication + participant verification + connection limits.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const { conversationId } = await params;

    // ── Security: Authentication ──
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    // ── Security: Verify user is a participant of this conversation ──
    const admin = createAdminClient();
    const { data: participant } = await admin
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (!participant) {
        // Allow staff/admin/instructor to listen
        const { data: profile } = await admin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!['admin', 'staff', 'instructor', 'client_management'].includes(profile?.role || '')) {
            return new Response('Forbidden', { status: 403 });
        }
    }

    // ── Security: Connection limit per user ──
    const currentCount = activeConnections.get(user.id) || 0;
    if (currentCount >= MAX_CONNECTIONS_PER_USER) {
        return new Response('Too many connections', { status: 429 });
    }
    activeConnections.set(user.id, currentCount + 1);

    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;

    const stream = new ReadableStream({
        start(controller) {
            // Send initial heartbeat
            controller.enqueue(encoder.encode(': heartbeat\n\n'));

            // Subscribe to the chat hub for this conversation
            unsubscribe = chatHub.subscribe(conversationId, () => {
                try {
                    controller.enqueue(
                        encoder.encode(`event: new_message\ndata: ${JSON.stringify({ conversationId, timestamp: Date.now() })}\n\n`)
                    );
                } catch {
                    // Stream closed
                }
            });

            // Send periodic heartbeats to keep connection alive
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': heartbeat\n\n'));
                } catch {
                    clearInterval(heartbeat);
                }
            }, 15000);

            // Auto-disconnect after 30 minutes to prevent stale connections
            const timeout = setTimeout(() => {
                cleanup();
                try { controller.close(); } catch {}
            }, CONNECTION_TIMEOUT_MS);

            const cleanup = () => {
                clearInterval(heartbeat);
                clearTimeout(timeout);
                if (unsubscribe) unsubscribe();
                // Decrement connection count
                const count = activeConnections.get(user.id) || 1;
                if (count <= 1) activeConnections.delete(user.id);
                else activeConnections.set(user.id, count - 1);
            };

            // Clean up when the request is aborted
            request.signal.addEventListener('abort', () => {
                cleanup();
                try { controller.close(); } catch {}
            });
        },
        cancel() {
            if (unsubscribe) unsubscribe();
            const count = activeConnections.get(user.id) || 1;
            if (count <= 1) activeConnections.delete(user.id);
            else activeConnections.set(user.id, count - 1);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
