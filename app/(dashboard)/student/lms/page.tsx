import React from 'react';
import { getCourses, getCourseProgress } from '@/lib/actions/lms';
import { createServerSupabaseClient as createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Play, Star, BookOpen, Clock, ChevronRight, Award } from 'lucide-react';

export default async function StudentLmsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'demo-user';

    const courses = await getCourses();


    return (
        <div className="min-h-screen bg-gray-50/50 p-8 lg:p-12 font-sans selection:bg-[#ff80ab]/20">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-5xl font-semibold italic font-serif leading-none tracking-tight text-[#4e342e]">Your Rituals</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff80ab]">Modern Wisdom · Ancient Flow</p>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.map(async (course: any) => {
                        const progress = await getCourseProgress(userId, course.id);
                        return (
                            <Link 
                                key={course.id} 
                                href={`/student/lms/${course.slug}`}
                                className="group relative block bg-white rounded-[3rem] p-4 border border-gray-100 hover:border-[#ff80ab] transition-all hover:scale-[1.02]"
                            >
                                <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-gray-100 mb-6 relative">
                                    {course.thumbnail_url ? (
                                        <img 
                                            src={course.thumbnail_url} 
                                            alt={course.title}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-pink-50 text-[#ff80ab]">
                                            <BookOpen className="w-12 h-12" />
                                        </div>
                                    )}
                                    {progress.percent > 0 && (
                                        <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-white/50 shadow-sm text-[10px] font-black uppercase tracking-widest text-[#ff80ab]">
                                            {progress.percent === 100 ? 'Completed' : `${progress.percent}% Done`}
                                        </div>
                                    )}
                                </div>

                                <div className="px-4 pb-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight text-[#4e342e] group-hover:text-[#ff80ab] transition-colors">{course.title}</h3>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#8d6e63] mt-1 opacity-60">{course.level}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-[#ff80ab]/5 text-[#ff80ab]">
                                            <Play className="w-4 h-4 fill-current" />
                                        </div>
                                    </div>

                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#ff80ab] to-[#f06292] transition-all duration-1000" 
                                            style={{ width: `${progress.percent}%` }} 
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#8d6e63]">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>21 Days Ritual</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#ff80ab]">
                                            Enter <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Achievement Section */}
                <div className="p-12 rounded-[4rem] bg-white border border-gray-100 flex flex-col lg:flex-row items-center gap-12">
                    <div className="p-8 rounded-full bg-[#ff80ab]/5 text-[#ff80ab] border border-[#ff80ab]/10">
                        <Award className="w-16 h-16" />
                    </div>
                    <div className="flex-1 text-center lg:text-left space-y-4">
                        <h2 className="text-3xl font-serif italic text-[#4e342e]">Glow Certifications</h2>
                        <p className="text-sm text-[#8d6e63] font-medium max-w-xl">Complete your Level 1 and Level 2 rituals to unlock official FaceYoga certifications and join our community of Radiant Coaches.</p>
                        <button className="px-8 py-4 rounded-full bg-[#ff80ab] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#ff4081] transition-all">View My Badge Vault</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
