import { NextResponse } from 'next/server';
import { markLessonComplete } from '@/lib/actions/lms';
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const { lessonId, progressPercent } = await req.json();

        if (!lessonId) {
            return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
        }

        // For Static Demo, we use the user ID as 'demo-user' if not logged in
        let userId = 'demo-user';
        
        // Try getting real user for future-proofing
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
        } catch (e) {
            // Ignore auth error for static demo
        }

        // Only mark complete if progress is high enough (e.g., 90%)
        if (progressPercent >= 90) {
            await markLessonComplete(userId, lessonId);
            return NextResponse.json({ success: true, status: 'completed' });
        }

        return NextResponse.json({ success: true, status: 'progress_updated' });

    } catch (err: any) {
        console.error('LMS Progress API Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
