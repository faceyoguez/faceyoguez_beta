'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight, Play, BookOpen, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress'; // Assuming a progress component exists or I'll build a simple one

interface Lesson {
    id: string;
    title: string;
    slug: string;
    is_completed: boolean;
    order_index: number;
}

interface Module {
    id: string;
    title: string;
    order_index: number;
    lessons: Lesson[];
}

interface Props {
    courseSlug: string;
    modules: Module[];
    currentLessonId: string;
    progressPercent: number;
}

export default function CourseSidebar({ courseSlug, modules, currentLessonId, progressPercent }: Props) {
    return (
        <div className="flex flex-col h-full bg-white/40 backdrop-blur-xl border-l border-white/60 overflow-hidden">
            {/* Progress Header */}
            <div className="p-8 pb-6 space-y-4">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-black text-[#ff80ab] uppercase tracking-[0.3em]">Course Progress</h3>
                    <span className="text-[14px] font-serif italic font-bold text-[#4e342e]">{progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-pink-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-[#ff80ab] transition-all duration-1000" 
                        style={{ width: `${progressPercent}%` }} 
                    />
                </div>
            </div>

            {/* Course Contents */}
            <div className="flex-1 overflow-y-auto px-4 pb-10 scrollbar-hide">
                <h4 className="px-4 py-4 text-[10px] font-black text-[#8d6e63] uppercase tracking-[0.2em] opacity-60">Course Contents</h4>
                
                <div className="space-y-6">
                    {modules.map((module) => (
                        <div key={module.id} className="space-y-3">
                            <div className="px-4 flex items-center justify-between group cursor-default">
                                <h5 className="text-[11px] font-black text-[#4e342e] uppercase tracking-widest">{module.title}</h5>
                                <span className="text-[9px] font-bold text-[#ff80ab]/60">{module.lessons.length} Lessons</span>
                            </div>
                            
                            <div className="space-y-1">
                                {module.lessons.map((lesson) => {
                                    const isActive = lesson.id === currentLessonId;
                                    return (
                                        <Link 
                                            key={lesson.id} 
                                            href={`/student/lms/${courseSlug}/${lesson.slug}`}
                                            className={`
                                                flex items-center gap-3 px-4 py-4 rounded-2xl transition-all group
                                                ${isActive ? 'bg-[#ff80ab] text-white' : 'hover:bg-white/60 text-[#6d4c41]'}
                                            `}
                                        >
                                            <div className="flex-shrink-0">
                                                {lesson.is_completed ? (
                                                    <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#ff80ab]'}`} />
                                                ) : (
                                                    <Play className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-[#8d6e63]/40'}`} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[12px] font-bold truncate ${isActive ? 'text-white' : 'text-[#4e342e]'}`}>
                                                    {lesson.title}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <ChevronRight className="w-4 h-4 opacity-50" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
