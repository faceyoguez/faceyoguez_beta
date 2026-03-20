import { getCourseBySlug } from '@/lib/actions/lms';
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{ courseSlug: string }>;
}

export default async function CourseRedirectPage({ params }: Props) {
    const { courseSlug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'demo-user';

    const course = await getCourseBySlug(courseSlug, userId);
    
    // Find the first lesson
    const firstModule = course.modules[0];
    const firstLesson = firstModule?.lessons[0];

    if (firstLesson) {
        redirect(`/student/lms/${courseSlug}/${firstLesson.slug}`);
    }

    // Fallback if no lessons
    return (
        <div className="p-20 text-center">
            <h1 className="text-2xl font-serif italic text-[#4e342e]">No lessons found for this ritual yet.</h1>
            <p className="mt-4 text-[#8d6e63]">Check back soon!</p>
        </div>
    );
}
