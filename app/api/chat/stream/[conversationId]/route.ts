import { NextRequest } from 'next/server';
import { chatHub } from '@/lib/chat-hub';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE endpoint for real-time chat updates.
 * Clients connect to this endpoint and receive "new_message" events
 * whenever a message is sent in the given conversation.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const { conversationId } = await params;

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

            // Clean up when the request is aborted
            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeat);
                if (unsubscribe) unsubscribe();
                try {
                    controller.close();
                } catch {
                    // Already closed
                }
            });
        },
        cancel() {
            if (unsubscribe) unsubscribe();
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
