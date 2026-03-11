'use client';

import { useState, useRef, useTransition } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
    Search, Bell, Plus, LayoutDashboard, User, Users, GraduationCap, BarChart,
    Award, Settings, Calendar, Play, Upload,
    FileText, Send, Video, Library, ChevronLeft, ChevronRight,
    Eye, PlusCircle, Pin, X, Trash2, CheckCircle, Download
} from 'lucide-react';
import Image from 'next/image';
import { createAndPopulateBatch, type CreateBatchInput } from '@/lib/actions/batches';
import { useRouter } from 'next/navigation';
import type { Profile, Batch } from '@/types/database';
import { uploadBatchResource, getBatchResources } from '@/lib/actions/resources';
import { getBatchMessages, sendBatchMessage, toggleBatchChat } from '@/lib/actions/chat';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';

interface GroupClientProps {
    currentUser: Profile;
    initialBatches: any[];
    initialBatchResources: any[];
}

export function InstructorGroupClient({ currentUser, initialBatches, initialBatchResources }: GroupClientProps) {
    const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [batches, setBatches] = useState(initialBatches);
    const [selectedBatch, setSelectedBatch] = useState<any>(initialBatches.find(b => b.status === 'active') || initialBatches[0] || null);
    const [resources, setResources] = useState(initialBatchResources);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync Server Data into Client State
    useEffect(() => {
        setBatches(initialBatches);
        setSelectedBatch(initialBatches.find(b => b.status === 'active') || initialBatches[0] || null);
        setResources(initialBatchResources);
    }, [initialBatches, initialBatchResources]);

    // Chat State
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatEnabled, setIsChatEnabled] = useState(true);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!selectedBatch?.id) return;

        // Fetch initial messages
        const fetchMessages = async () => {
            const msgs = await getBatchMessages(selectedBatch.id);
            setMessages(msgs);
            setIsChatEnabled(selectedBatch.is_chat_enabled ?? true);
        };
        fetchMessages();

        // Subscribe to real-time
        const channel = supabase
            .channel(`batch-chat-${selectedBatch.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'batch_messages',
                    filter: `batch_id=eq.${selectedBatch.id}`
                },
                async (payload: { new: any }) => {
                    // Fetch profile for the new message
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, role')
                        .eq('id', payload.new.sender_id)
                        .single();

                    const newMsg = { ...payload.new, sender: profile };
                    setMessages(prev => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedBatch?.id, supabase]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedBatch?.id) return;

        const res = await sendBatchMessage(selectedBatch.id, newMessage.trim(), currentUser.id);
        if (res.success) {
            setNewMessage('');
        } else {
            alert(res.error);
        }
    };

    const handleToggleChat = async () => {
        if (!selectedBatch?.id) return;
        const nextState = !isChatEnabled;
        const res = await toggleBatchChat(selectedBatch.id, nextState);
        if (res.success) {
            setIsChatEnabled(nextState);
        } else {
            alert(res.error);
        }
    };

    // Form State
    const [formData, setFormData] = useState<Partial<CreateBatchInput>>({
        name: '',
        startDate: '',
        endDate: '',
        maxStudents: 30,
        instructorId: currentUser.id
    });

    const handleCreateBatch = async () => {
        if (!formData.name || !formData.startDate || !formData.endDate) {
            alert("Please fill in all required fields.");
            return;
        }

        startTransition(async () => {
            const result = await createAndPopulateBatch({
                name: formData.name!,
                startDate: formData.startDate!,
                endDate: formData.endDate!,
                maxStudents: formData.maxStudents || 30,
                instructorId: currentUser.id
            });

            if (result.success) {
                setIsCreateBatchOpen(false);
                setFormData({ name: '', startDate: '', endDate: '', maxStudents: 30, instructorId: currentUser.id });
                // We could fetch batches again or just refresh
                router.refresh();
            } else {
                alert("Error: " + result.error);
            }
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBatch) return;

        // 10 MB limit
        if (file.size > 10 * 1024 * 1024) {
            alert("File size must be less than 10MB.");
            return;
        }

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert("Please upload a PDF, Word document, or Image (JPEG/PNG).");
            return;
        }

        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const res = await uploadBatchResource(
                    selectedBatch.id,
                    file.name,
                    file.type,
                    file.size,
                    base64
                );

                if (res.success) {
                    // Update resources list locally
                    const updated = await getBatchResources(selectedBatch.id);
                    setResources(updated);
                } else {
                    alert("Upload failed: " + res.error);
                }
                setIsUploading(false);
            };
        } catch (err) {
            console.error(err);
            setIsUploading(false);
        }
    };

    const handleBatchChange = async (batch: any) => {
        setSelectedBatch(batch);
        const batchResources = await getBatchResources(batch.id);
        setResources(batchResources);
    };

    // Filter enrolled students
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const filteredStudents = useMemo(() => {
        if (!selectedBatch?.batch_enrollments) return [];
        if (!studentSearchQuery) return selectedBatch.batch_enrollments;
        return selectedBatch.batch_enrollments.filter((e: any) => {
            const name = e.student?.full_name?.toLowerCase() || '';
            const query = studentSearchQuery.toLowerCase();
            return name.includes(query);
        });
    }, [selectedBatch?.batch_enrollments, studentSearchQuery]);

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-50 via-gray-50 to-white text-gray-900">

            {/* Top Embedded header (Will eventually merge with app layout header or style explicitly) */}
            <div className="flex items-center justify-between border-b border-pink-100 bg-white/70 px-6 py-3 shadow-sm backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-2 text-pink-500">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md">
                        <span className="material-symbols-outlined text-[18px]">self_improvement</span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">Instructor Hub</h2>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden w-64 relative md:flex">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search student, session..."
                            className="block w-full rounded-lg border border-pink-100 bg-white/50 py-1.5 pl-9 pr-3 text-xs focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                        />
                    </div>
                    <p className="hidden text-right sm:block">
                        <span className="block text-xs font-bold leading-tight text-gray-900">{currentUser?.full_name || 'Instructor'}</span>
                        <span className="block text-[10px] font-medium leading-tight text-pink-500">Head Instructor</span>
                    </p>
                    {currentUser?.avatar_url ? (
                        <img src={currentUser.avatar_url} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm" />
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white shadow-sm">
                            {currentUser?.full_name?.charAt(0) || 'I'}
                        </div>
                    )}
                </div>
            </div>

            <main className="relative z-0 flex-1 overflow-hidden p-4">
                <div className="mx-auto grid h-full max-w-[1800px] grid-cols-12 gap-4">

                    {/* Left Navigation col */}
                    <div className="col-span-12 flex h-full flex-col gap-4 lg:col-span-2">
                        <nav className="flex h-full flex-col gap-1 rounded-xl border border-white/60 bg-white/65 p-3 shadow-sm backdrop-blur-md">
                            <p className="mb-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 opacity-70">Management</p>
                            <button
                                onClick={() => setIsCreateBatchOpen(true)}
                                className="mb-2 flex items-center gap-3 rounded-lg bg-pink-500 px-3 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-pink-600"
                            >
                                <Plus className="h-5 w-5" />
                                New Batch
                            </button>

                            {/* Quick links placeholder */}
                            <div className="mt-auto border-t border-pink-100/50 pt-4 space-y-3 overflow-y-auto max-h-[40vh] custom-scrollbar">
                                <p className="px-2 text-[9px] font-bold text-gray-400 uppercase">My Batches</p>
                                {batches.map((batch) => (
                                    <div
                                        key={batch.id}
                                        onClick={() => handleBatchChange(batch)}
                                        className={`cursor-pointer rounded-lg border p-3 transition-all ${selectedBatch?.id === batch.id ? 'border-pink-300 bg-pink-50 shadow-sm' : 'border-pink-100/50 bg-white/40 hover:bg-white/60'}`}
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <Award className={`h-4 w-4 ${selectedBatch?.id === batch.id ? 'text-pink-600' : 'text-pink-400'}`} />
                                            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${batch.status === 'active' ? 'border-green-200 bg-white/60 text-green-600' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                                {batch.status === 'active' ? 'Live' : batch.status}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-gray-900">{batch.name}</h4>
                                        <p className="line-clamp-1 text-[10px] text-gray-500">{new Date(batch.start_date).toLocaleDateString()} - {new Date(batch.end_date).toLocaleDateString()}</p>
                                    </div>
                                ))}

                                {batches.length === 0 && (
                                    <div className="p-4 text-center">
                                        <p className="text-[10px] text-gray-400">No batches created yet.</p>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>

                    {/* Center Main col */}
                    <div className={`col-span-12 flex h-full flex-col gap-4 overflow-hidden transition-all lg:col-span-7 ${isCreateBatchOpen ? 'blur-[2px] opacity-50 pointer-events-none' : ''}`}>
                        {/* Session Thumbnail */}
                        <div className="group relative h-48 w-full shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-sm">
                            <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2420&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Yoga Studio" />
                            <div className="absolute inset-0 z-20 flex flex-row items-center justify-between gap-4 p-5">
                                <div className="max-w-md">
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <span className={`flex h-2 w-2 rounded-full ${selectedBatch?.status === 'active' ? 'animate-pulse bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-gray-400'}`}></span>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${selectedBatch?.status === 'active' ? 'text-red-400' : 'text-gray-400'}`}>
                                            {selectedBatch?.status === 'active' ? 'Session Live' : 'Session Offline'}
                                        </span>
                                    </div>
                                    <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">{selectedBatch?.name || 'Select a Batch'}</h2>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1 backdrop-blur-md">
                                            <Calendar className="h-3.5 w-3.5 text-white/70" />
                                            <span className="text-xs font-medium text-white">{selectedBatch ? `${new Date(selectedBatch.start_date).toLocaleDateString()} - ${new Date(selectedBatch.end_date).toLocaleDateString()}` : '--'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all hover:-translate-y-0.5 hover:bg-red-600 disabled:opacity-50">
                                        <Play className="h-5 w-5" />
                                        {selectedBatch?.status === 'active' ? 'Start Live Stream' : 'Activate Batch'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Resources & Status Row */}
                        <div className="grid min-h-[160px] grid-cols-12 gap-4">
                            <div className="col-span-12 flex flex-col justify-between rounded-xl border border-white/60 bg-white/65 p-4 shadow-sm backdrop-blur-md md:col-span-12 lg:col-span-7">
                                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex bg-pink-100 text-pink-600 p-2.5 rounded-xl shrink-0">
                                            <Library className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">
                                                Resources
                                            </h4>
                                            <p className="mt-0.5 text-[10px] text-gray-500">Share handouts or guides with the current batch instantly.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-pink-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-pink-600" title="Upload Resource">
                                            <Plus className="h-3.5 w-3.5" /> Upload File
                                        </button>
                                    </div>
                                </div>
                                {/* Upload Button */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    className="hidden"
                                />

                                <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar mt-2">
                                    {isUploading && (
                                        <div className="flex items-center gap-3 p-3 text-sm text-gray-500 justify-center border border-dashed border-pink-200 rounded-lg">
                                            Uploading file...
                                        </div>
                                    )}
                                    {resources.map((res: any) => (
                                        <div key={res.id} onClick={() => window.open(res.file_url, '_blank')} className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-pink-100 bg-white/60 p-2.5 transition-all hover:border-pink-300 hover:shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded border border-red-100 bg-red-50 text-red-500 shadow-sm">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{res.title || res.file_name}</h4>
                                                    <p className="text-[9px] text-gray-500">{new Date(res.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.open(res.file_url, '_blank'); }}
                                                className="rounded p-1 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-600"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {resources.length === 0 && !isUploading && (
                                        <p className="text-center text-[10px] text-gray-400 py-4">No resources shared yet.</p>
                                    )}
                                </div>

                            </div>

                            <div className="col-span-12 flex flex-col justify-between rounded-xl border border-white/60 bg-white/65 p-4 shadow-sm backdrop-blur-md md:col-span-12 lg:col-span-5">
                                <div className="mb-1 flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-gray-900">Batch Status</h4>
                                    <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${selectedBatch?.status === 'active' ? 'border-green-200 bg-green-100 text-green-700' : 'border-gray-200 bg-gray-100 text-gray-700'}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${selectedBatch?.status === 'active' ? 'animate-pulse bg-green-600' : 'bg-gray-400'}`}></span> {selectedBatch?.status || 'N/A'}
                                    </span>
                                </div>
                                <div className="my-2 flex items-end gap-2">
                                    <span className="text-3xl font-bold text-gray-900">{selectedBatch?.current_students || 0}</span>
                                    <span className="mb-1 text-sm font-medium text-gray-500">/ {selectedBatch?.max_students || 0} Enrolled</span>
                                </div>
                                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className="h-1.5 rounded-full bg-pink-500 transition-all duration-500"
                                        style={{ width: selectedBatch ? `${(selectedBatch.current_students / selectedBatch.max_students) * 100}%` : '0%' }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Recorded Archives Scroller */}
                        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md">
                            <div className="flex items-center justify-between border-b border-pink-50 bg-white/40 p-3">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                    <Library className="h-4 w-4 text-pink-500" />
                                    Recorded Daily Archives
                                </h3>
                            </div>
                            <div className="flex-1 overflow-x-auto p-4 custom-scrollbar">
                                <div className="flex h-full items-center gap-4">
                                    {/* Item 1 */}
                                    <div className="group flex h-full w-[200px] min-w-[200px] flex-col rounded-lg border border-pink-100 bg-white/60 shadow-sm transition-all hover:border-pink-300">
                                        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-t-lg bg-gray-200">
                                            <div className="absolute inset-0 z-10 bg-black/10 transition-colors group-hover:bg-black/0"></div>
                                            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop" className="h-full w-full object-cover" alt="" />
                                            <div className="absolute bottom-2 right-2 z-20 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">45:10</div>
                                        </div>
                                        <div className="flex flex-1 flex-col p-3">
                                            <div className="mb-1 flex items-start justify-between">
                                                <span className="rounded bg-pink-50 px-1.5 text-[10px] font-medium text-pink-500">Day 11</span>
                                                <span className="text-[10px] text-gray-500">Oct 24</span>
                                            </div>
                                            <h4 className="mb-1 line-clamp-2 text-xs font-bold text-gray-900">Full Face Activation</h4>
                                        </div>
                                    </div>
                                    {/* Item 2 */}
                                    <div className="group flex h-full w-[200px] min-w-[200px] flex-col rounded-lg border border-pink-100 bg-white/60 shadow-sm transition-all hover:border-pink-300">
                                        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-t-lg bg-gray-200">
                                            <div className="absolute inset-0 z-10 bg-black/10 transition-colors group-hover:bg-black/0"></div>
                                            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop" className="h-full w-full object-cover" alt="" />
                                            <div className="absolute bottom-2 right-2 z-20 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">42:30</div>
                                        </div>
                                        <div className="flex flex-1 flex-col p-3">
                                            <div className="mb-1 flex items-start justify-between">
                                                <span className="rounded bg-pink-50 px-1.5 text-[10px] font-medium text-pink-500">Day 10</span>
                                                <span className="text-[10px] text-gray-500">Oct 23</span>
                                            </div>
                                            <h4 className="mb-1 line-clamp-2 text-xs font-bold text-gray-900">Neck & Jaw Tension Relief</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Chat & Student List col */}
                    <div className={`col-span-12 h-[600px] lg:sticky lg:top-6 lg:col-span-3 lg:h-[calc(100vh-6rem)] flex flex-col gap-4 transition-all ${isCreateBatchOpen ? 'blur-[2px] opacity-50 pointer-events-none' : ''}`}>

                        {/* Student List Section */}
                        <div className="flex h-[280px] flex-col overflow-hidden rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md">
                            <div className="border-b border-pink-50 bg-white/40 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-pink-500" />
                                        Enrolled Students
                                    </h3>
                                    <span className="text-[10px] font-bold text-pink-500">{filteredStudents.length} Students</span>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={studentSearchQuery}
                                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                                        className="w-full rounded-lg border border-pink-100 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                                {filteredStudents.map((enrollment: any) => (
                                    <div key={enrollment.student_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/60 transition-colors border border-transparent hover:border-pink-50">
                                        {enrollment.student?.avatar_url ? (
                                            <img src={enrollment.student.avatar_url} className="h-8 w-8 rounded-full border border-white object-cover shadow-sm" />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                                {enrollment.student?.full_name?.charAt(0) || 'S'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{enrollment.student?.full_name}</p>
                                            <p className="text-[9px] text-gray-400 line-clamp-1">Enrolled in {selectedBatch?.name}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!filteredStudents || filteredStudents.length === 0) && (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <p className="text-[10px] text-gray-400">No students found.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Batch Chat Section */}
                        <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-md">
                            <div className="flex items-center justify-between border-b border-pink-50 bg-white/40 px-3 py-3 backdrop-blur-sm">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                        Batch Chat
                                        <span className="rounded border border-pink-100 bg-pink-50 px-1.5 text-[9px] font-bold text-pink-500">ADMIN</span>
                                    </h3>
                                    <p className="text-[10px] text-gray-500">{selectedBatch?.current_students || 0} Students • {isChatEnabled ? 'Live' : 'Moderated'}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={handleToggleChat}
                                        title={isChatEnabled ? "Disable Student Chat" : "Enable Student Chat"}
                                        className={`rounded-lg p-1.5 transition-colors ${isChatEnabled ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                                    >
                                        <Settings className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div ref={chatContainerRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-white/30 to-white/10 p-3 custom-scrollbar">
                                {messages.map((msg) => {
                                    const senderProfile = msg.sender || msg.profiles || msg.senderProfile || {};
                                    return (
                                        <div key={msg.id} className={`flex gap-2 ${msg.sender_id === currentUser.id ? 'flex-row-reverse' : ''}`}>
                                            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-pink-200">
                                                {senderProfile?.avatar_url ? (
                                                    <img src={senderProfile.avatar_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-pink-600">
                                                        {(senderProfile?.full_name || 'U').charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`flex max-w-[85%] flex-col ${msg.sender_id === currentUser.id ? 'items-end' : ''}`}>
                                                <div className="mb-0.5 flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-900">{senderProfile?.full_name || 'User'}</span>
                                                    <span className="text-[9px] text-gray-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {senderProfile?.role === 'instructor' ? (
                                                        <span className="flex items-center gap-0.5 rounded border border-pink-200 bg-pink-50 px-1 text-[9px] font-bold text-pink-500">{msg.sender_id === currentUser.id ? 'YOU' : 'Instructor'} <CheckCircle className="h-2 w-2" /></span>
                                                    ) : senderProfile?.role === 'student' && msg.sender_id !== currentUser.id ? (
                                                        <span className="flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1 text-[8px] font-bold text-gray-500">Student</span>
                                                    ) : null}
                                                </div>
                                                <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${msg.sender_id === currentUser.id ? 'rounded-tr-none bg-pink-500 text-white' : senderProfile?.role === 'instructor' ? 'rounded-tl-none border border-pink-300 bg-pink-50 text-gray-900 shadow-pink-100' : 'rounded-tl-none border border-white/50 bg-white text-gray-900'}`}>
                                                    <p>{msg.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-pink-50 bg-white/60 p-3">
                                <div className="relative flex items-center gap-2">
                                    <button className="absolute left-1 z-10 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-pink-500">
                                        <PlusCircle className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Message batch as Admin..."
                                        className="w-full rounded-full border-none bg-white p-2.5 pl-9 pr-10 text-xs shadow-inner focus:ring-1 focus:ring-pink-500"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="absolute right-1 rounded-full p-1.5 text-pink-500 transition-colors hover:bg-pink-100"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Create Batch Modal Overlay */}
                    {isCreateBatchOpen && (
                        <div className="absolute inset-0 z-50 flex justify-end">
                            <div
                                className="absolute inset-0 cursor-pointer bg-black/20 backdrop-blur-sm"
                                onClick={() => setIsCreateBatchOpen(false)}
                            ></div>
                            <div className="relative flex h-full w-full max-w-lg animate-in slide-in-from-right flex-col border-l border-white/60 bg-white/80 shadow-2xl backdrop-blur-2xl duration-300">
                                <div className="flex items-center justify-between border-b border-pink-100 bg-white/50 p-5 backdrop-blur-xl">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Create New Batch</h3>
                                        <p className="text-xs text-gray-500">Set up a new group session schedule</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateBatchOpen(false)}
                                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-6 overflow-y-auto bg-white/30 p-6 custom-scrollbar">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-900">Batch Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Morning Glow - Nov 2026"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-lg border-pink-200 bg-white/60 px-4 py-2.5 text-sm shadow-sm transition-all focus:border-pink-500 focus:ring-pink-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wide text-gray-900">Start Date</label>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="w-full rounded-lg border-pink-200 bg-white/60 px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wide text-gray-900">End Date</label>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="w-full rounded-lg border-pink-200 bg-white/60 px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-900">Max Students</label>
                                        <input
                                            type="number"
                                            value={formData.maxStudents}
                                            onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                                            className="w-full rounded-lg border-pink-200 bg-white/60 px-4 py-2.5 text-sm shadow-sm focus:border-pink-500 focus:ring-pink-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-900">Session Plan Generation Placeholder</label>
                                        <button className="w-full rounded border border-dashed border-pink-300 py-2 text-xs font-bold text-pink-500 hover:bg-pink-50">Generate Zoom Links & Schedule</button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-pink-100 bg-white/60 p-5 backdrop-blur-xl">
                                    <button
                                        onClick={() => setIsCreateBatchOpen(false)}
                                        disabled={isPending}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-black/5 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateBatch}
                                        disabled={isPending}
                                        className="rounded-lg bg-pink-500 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-pink-500/30 transition-all hover:-translate-y-0.5 hover:bg-pink-600 disabled:opacity-50"
                                    >
                                        {isPending ? 'Creating...' : 'Create Batch'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main >
        </div >
    );
}
