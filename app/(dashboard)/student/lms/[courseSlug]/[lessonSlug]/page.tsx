import React from 'react';
import { getCourseBySlug, getCourseProgress } from '@/lib/actions/lms';
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import YouTubePlayer from '@/components/lms/YouTubePlayer';
import CourseSidebar from '@/components/lms/CourseSidebar';
import { ChevronLeft, ChevronRight, Share2, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Props {
    params: Promise<{ courseSlug: string; lessonSlug: string }>;
}

export default async function LessonPlayerPage({ params }: Props) {
    const { courseSlug, lessonSlug } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'demo-user';

    const course = await getCourseBySlug(courseSlug, userId);

    if (!course) notFound();

    // Find current lesson
    const allLessons = course.modules.flatMap((m: any) => m.lessons);
    const currentLessonIndex = allLessons.findIndex((l: any) => l.slug === lessonSlug);
    const currentLesson = allLessons[currentLessonIndex];

    if (!currentLesson) notFound();

    const prevLesson = allLessons[currentLessonIndex - 1];
    const nextLesson = allLessons[currentLessonIndex + 1];

    const progress = await getCourseProgress(userId, course.id);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[#fbf9f8] overflow-hidden font-sans">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide">
                {/* Header / Breadcrumb */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/student/lms"
                            className="p-3 rounded-full bg-white border border-gray-100 text-[#8d6e63] hover:text-[#ff80ab] hover:border-[#ff80ab] transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-serif italic text-[#4e342e]">{course.title}</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#ff80ab] mt-1">
                                {currentLesson.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-3 rounded-full bg-white border border-gray-100 text-[#8d6e63] hover:bg-[#ff80ab]/5 transition-all">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-3 rounded-full bg-white border border-gray-100 text-[#8d6e63] hover:bg-[#ff80ab]/5 transition-all">
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Video Area */}
                <div className="px-8 py-4">
                    <div className="max-w-6xl mx-auto">
                        <YouTubePlayer 
                            youtubeId={currentLesson.youtube_id || currentLesson.video_url} 
                            lessonId={currentLesson.id}
                        />
                    </div>
                </div>

                {/* Lesson Info */}
                <div className="px-8 py-10">
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-gray-100">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-serif italic text-[#4e342e]">{currentLesson.title}</h2>
                                <div className="flex items-center gap-4 text-[11px] font-bold text-[#8d6e63] uppercase tracking-widest">
                                    <span className="px-3 py-1 bg-pink-50 text-[#ff80ab] rounded-full">Lesson {currentLessonIndex + 1}</span>
                                    {currentLesson.is_completed && (
                                        <span className="flex items-center gap-1.5 text-green-600">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {prevLesson && (
                                    <Link 
                                        href={`/student/lms/${courseSlug}/${prevLesson.slug}`}
                                        className="px-6 py-4 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#4e342e] hover:border-[#ff80ab] transition-all flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </Link>
                                )}
                                {nextLesson && (
                                    <Link 
                                        href={`/student/lms/${courseSlug}/${nextLesson.slug}`}
                                        className="px-6 py-4 rounded-2xl bg-[#ff80ab] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#ff4081] transition-all flex items-center gap-2"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="prose prose-pink max-w-none text-[#6d4c41] leading-relaxed">
                            <p className="text-lg font-medium italic opacity-80 mb-6">
                                Honoring your facial structure through intentional flow and modern alignment.
                            </p>
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p>No ritual notes for this lesson.</p>' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Overlay for Desktop */}
            <div className="hidden lg:block w-[400px] h-full flex-shrink-0">
                <CourseSidebar 
                    courseSlug={courseSlug}
                    modules={course.modules}
                    currentLessonId={currentLesson.id}
                    progressPercent={progress.percent}
                />
            </div>
        </div>
    );
}
