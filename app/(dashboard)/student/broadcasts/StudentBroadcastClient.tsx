'use client';

import {
    Bell, CheckCircle2, Megaphone, Clock, Info, User as UserIcon
} from 'lucide-react';
import { markNotificationAsRead } from '@/lib/actions/broadcast';
import type { Profile } from '@/types/database';

interface StudentBroadcastClientProps {
    currentUser: Profile;
    notifications: any[];
}

export function StudentBroadcastClient({ currentUser, notifications }: StudentBroadcastClientProps) {

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col overflow-hidden p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                    <Megaphone className="h-6 w-6 text-pink-500" />
                    Instructor Broadcasts
                </h1>
                <p className="mt-1 text-sm text-gray-500">Official announcements and resources from instructors.</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {notifications.length === 0 ? (
                    <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/60 shadow-sm backdrop-blur-md">
                        <Bell className="mb-4 h-12 w-12 text-pink-200" />
                        <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
                        <p className="mt-1 text-sm text-gray-500">You don't have any broadcasts from your instructors yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                        {notifications.map((notif) => {
                            const broadcast = notif.broadcasts || {};
                            const instructor = broadcast.sender || {};

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => {
                                        if (!notif.is_read) {
                                            markNotificationAsRead(notif.id);
                                        }
                                    }}
                                    className={`relative flex flex-col rounded-3xl border ${notif.is_read ? 'border-white/60 bg-white/60 cursor-default' : 'border-pink-200 bg-gradient-to-br from-pink-50/80 to-white cursor-pointer'} p-6 shadow-sm transition-all hover:shadow-md backdrop-blur-md`}
                                >
                                    {!notif.is_read && (
                                        <span className="absolute -right-1 -top-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-pink-500 ring-4 ring-white"></span>
                                    )}

                                    <div className="mb-4 flex items-center justify-between gap-4 border-b border-pink-100/50 pb-4">
                                        <div className="flex items-center gap-3">
                                            {instructor.avatar_url ? (
                                                <img src={instructor.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-pink-100" />
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-500 ring-2 ring-pink-50">
                                                    {(instructor.full_name || 'I').charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">{instructor.full_name || 'Instructor'}</h4>
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-pink-500">
                                                    <CheckCircle2 className="h-3 w-3" /> VERIFIED INSTRUCTOR
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-right text-[10px] font-bold text-gray-400">
                                            {new Date(notif.created_at).toLocaleDateString()}<br />
                                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="mb-2 font-bold text-gray-900">{notif.title}</h3>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                                            {notif.message}
                                        </p>
                                    </div>

                                    {broadcast.file_url && (
                                        <div className="mt-5 rounded-xl border border-pink-100 bg-pink-50/50 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-pink-500 shadow-sm">
                                                        <Info className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-gray-900">{broadcast.file_name || 'Attachment'}</p>
                                                        <p className="text-[10px] text-gray-500">Tap to download</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={broadcast.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="shrink-0 rounded-lg bg-pink-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-pink-600"
                                                >
                                                    Open
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
