'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
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
