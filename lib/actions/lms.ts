import { createServerSupabaseClient as createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { STATIC_COURSES } from '../lms-static-data';
import { cookies } from 'next/headers';

/**
 * Fetch all available courses (Static)
 */
export async function getCourses() {
    return STATIC_COURSES;
}

/**
 * Fetch a course by slug (Static)
 */
export async function getCourseBySlug(slug: string, userId: string) {
    const course = STATIC_COURSES.find(c => c.slug === slug);
    if (!course) throw new Error('Course not found');

    // Get mock progress from cookies
    const cookieStore = await cookies();
    const completedLessonsJson = cookieStore.get('lms_completed_lessons')?.value || '[]';
    const completedLessonIds = new Set(JSON.parse(completedLessonsJson));

    const enrichedModules = (course.modules || []).map((m: any) => ({
        ...m,
        lessons: (m.lessons || []).map((l: any) => ({
            ...l,
            is_completed: completedLessonIds.has(l.id)
        }))
    }));

    return { ...course, modules: enrichedModules };
}

/**
 * Mark a lesson as completed (Cookie-based for Static Demo)
 */
export async function markLessonComplete(userId: string, lessonId: string) {
    const cookieStore = await cookies();
    const completedLessonsJson = cookieStore.get('lms_completed_lessons')?.value || '[]';
    const completedLessonIds = JSON.parse(completedLessonsJson);

    if (!completedLessonIds.includes(lessonId)) {
        completedLessonIds.push(lessonId);
    }

    cookieStore.set('lms_completed_lessons', JSON.stringify(completedLessonIds), {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
    });

    revalidatePath('/student/lms', 'layout');
    return { success: true };
}

/**
 * Get progress (Static calculation)
 */
export async function getCourseProgress(userId: string, courseId: string) {
    const course = STATIC_COURSES.find(c => c.id === courseId);
    if (!course) return { total: 0, completed: 0, percent: 0 };

    const cookieStore = await cookies();
    const completedLessonsJson = cookieStore.get('lms_completed_lessons')?.value || '[]';
    const completedLessonIds = new Set(JSON.parse(completedLessonsJson));

    const allLessons = (course.modules || []).flatMap((m: any) => m.lessons);
    const total = allLessons.length;
    const completed = allLessons.filter((l: any) => completedLessonIds.has(l.id)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percent };
}
