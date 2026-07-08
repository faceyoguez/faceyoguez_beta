'use server';

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { fetchActiveOneOnOneStudents, getStudentsConversationMeta } from './chat';
import { getInstructorBatches } from './batches';

export async function getGlobalUnreadChatCounts() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { unreadOneOnOne: 0, unreadGroup: 0 };

        // 1. Get 1-on-1 unread
        const oneOnOneStudents = await fetchActiveOneOnOneStudents(user.id);
        const oneOnOneIds = oneOnOneStudents.map((s: any) => s.id);
        let unreadOneOnOne = 0;
        
        if (oneOnOneIds.length > 0) {
            const meta1 = await getStudentsConversationMeta(oneOnOneIds);
            for (const val of Object.values(meta1) as any[]) {
                unreadOneOnOne += (val.unreadCount || 0);
            }
        }

        // 2. Get group unread
        const batches = await getInstructorBatches(user.id);
        let groupIds: string[] = [];
        batches.forEach((b: any) => {
            if (b.batch_enrollments) {
                b.batch_enrollments.forEach((e: any) => {
                    // Only count active group students
                    if (e.student_id && ['active', 'extended'].includes(e.status)) {
                        groupIds.push(e.student_id);
                    }
                });
            }
        });
        
        groupIds = [...new Set(groupIds)];
        
        let unreadGroup = 0;
        if (groupIds.length > 0) {
            const meta2 = await getStudentsConversationMeta(groupIds);
            for (const val of Object.values(meta2) as any[]) {
                unreadGroup += (val.unreadCount || 0);
            }
        }

        return { unreadOneOnOne, unreadGroup };
    } catch (error) {
        console.error('Error fetching global unread chat counts:', error);
        return { unreadOneOnOne: 0, unreadGroup: 0 };
    }
}

export async function getStudentGlobalUnreadCounts() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { oneOnOneUnreadMessages: 0, groupUnreadMessages: 0, oneOnOneResources: [], groupResources: [] };

        const admin = createAdminClient();

        // ── 1. Fetch Student active subscriptions ──
        const { data: subs } = await admin
            .from('subscriptions')
            .select('plan_type, id')
            .eq('student_id', user.id)
            .eq('status', 'active');

        const activePlans = subs?.map((s: any) => s.plan_type) || [];
        const hasOneOnOne = activePlans.includes('one_on_one');
        const hasGroup = activePlans.includes('group_session');

        let oneOnOneUnreadMessages = 0;
        let groupUnreadMessages = 0;
        let oneOnOneResources: string[] = [];
        let groupResources: string[] = [];

        // Fetch user conversation participants
        const { data: participants } = await admin
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id);
        const convIds = participants?.map((p: any) => p.conversation_id) || [];

        // ── 2. Handle 1-on-1 ──
        if (hasOneOnOne && convIds.length > 0) {
            // Find 1-on-1 direct conversation
            const { data: directConvs } = await admin
                .from('conversations')
                .select('id')
                .in('id', convIds)
                .eq('type', 'direct')
                .limit(1);

            const directConvId = directConvs?.[0]?.id;
            if (directConvId) {
                // Fetch recent messages
                const { data: messages } = await admin
                    .from('chat_messages')
                    .select('sender_id, created_at')
                    .eq('conversation_id', directConvId)
                    .not('content', 'like', '__DELETED__:%')
                    .order('created_at', { ascending: false });

                if (messages && messages.length > 0) {
                    const myLastMsg = messages.find((m: any) => m.sender_id === user.id);
                    const myLastMsgAt = myLastMsg?.created_at || null;
                    const unreadMsgs = messages.filter((m: any) => {
                        if (m.sender_id === user.id) return false;
                        if (!myLastMsgAt) return true;
                        return m.created_at > myLastMsgAt;
                    });
                    oneOnOneUnreadMessages = unreadMsgs.length;
                }
            }

            // Fetch resources
            const { data: res } = await admin
                .from('student_resources')
                .select('created_at')
                .eq('student_id', user.id);
            if (res) {
                oneOnOneResources = res.map((r: any) => r.created_at);
            }
        }

        // ── 3. Handle Group Session ──
        if (hasGroup) {
            const { data: enrollments } = await admin
                .from('batch_enrollments')
                .select('batch_id, batches!inner(conversation_id)')
                .eq('student_id', user.id)
                .in('status', ['active', 'extended']);

            const enrolledBatchIds = enrollments?.map((e: any) => e.batch_id) || [];
            
            // Unread messages in group chats
            const groupConvIds = enrollments
                ?.map((e: any) => (e.batches as any)?.conversation_id)
                .filter(Boolean) || [];

            if (groupConvIds.length > 0) {
                for (const gId of groupConvIds) {
                    const { data: messages } = await admin
                        .from('chat_messages')
                        .select('sender_id, created_at')
                        .eq('conversation_id', gId)
                        .not('content', 'like', '__DELETED__:%')
                        .order('created_at', { ascending: false });

                    if (messages && messages.length > 0) {
                        const myLastMsg = messages.find((m: any) => m.sender_id === user.id);
                        const myLastMsgAt = myLastMsg?.created_at || null;
                        const unreadMsgs = messages.filter((m: any) => {
                            if (m.sender_id === user.id) return false;
                            if (!myLastMsgAt) return true;
                            return m.created_at > myLastMsgAt;
                        });
                        groupUnreadMessages += unreadMsgs.length;
                    }
                }
            }

            // Fetch resources shared to enrolled batches
            if (enrolledBatchIds.length > 0) {
                const { data: res } = await admin
                    .from('batch_resources')
                    .select('created_at')
                    .in('batch_id', enrolledBatchIds);
                if (res) {
                    groupResources = res.map((r: any) => r.created_at);
                }
            }
        }

        return {
            oneOnOneUnreadMessages,
            groupUnreadMessages,
            oneOnOneResources,
            groupResources
        };
    } catch (error) {
        console.error('Error fetching student unread counts:', error);
        return { oneOnOneUnreadMessages: 0, groupUnreadMessages: 0, oneOnOneResources: [], groupResources: [] };
    }
}
