/**
 * Chat notification hub — in-memory event emitter for real-time chat.
 * 
 * When a message is sent via server action, it notifies this hub.
 * SSE connections listen here and push updates to connected clients.
 */

type Listener = (conversationId: string) => void;

class ChatNotificationHub {
    private listeners: Map<string, Set<Listener>> = new Map();

    subscribe(conversationId: string, listener: Listener): () => void {
        if (!this.listeners.has(conversationId)) {
            this.listeners.set(conversationId, new Set());
        }
        this.listeners.get(conversationId)!.add(listener);

        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(conversationId);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.listeners.delete(conversationId);
                }
            }
        };
    }

    notify(conversationId: string): void {
        const listeners = this.listeners.get(conversationId);
        if (listeners) {
            listeners.forEach((listener) => {
                try {
                    listener(conversationId);
                } catch (e) {
                    // Ignore errors from individual listeners
                }
            });
        }
    }
}

// Singleton — persists across hot reloads in dev via globalThis
const globalForChat = globalThis as unknown as { chatHub: ChatNotificationHub };
export const chatHub = globalForChat.chatHub || new ChatNotificationHub();
globalForChat.chatHub = chatHub;
