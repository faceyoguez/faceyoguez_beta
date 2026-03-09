import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/messages/[conversationId]
 * Fetches messages for a conversation. Uses admin client to bypass RLS.
 * Auth is verified via cookies.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params;
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            console.log('[CHAT API] Not authenticated - no user in cookies');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const admin = createAdminClient();

        const searchParams = request.nextUrl.searchParams;
        const before = searchParams.get('before') || undefined;
        const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

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
            console.error('[CHAT API] DB error:', error);
            return NextResponse.json({ messages: [] });
        }

        const messages = (data || []).reverse();
        console.log(`[CHAT API] conv=${conversationId.slice(0, 8)} user=${user.email} msgs=${messages.length}`);

        return NextResponse.json(
            { messages },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Pragma': 'no-cache',
                },
            }
        );
    } catch (err) {
        console.error('[CHAT API] Error:', err);
        return NextResponse.json({ messages: [] });
    }
}
