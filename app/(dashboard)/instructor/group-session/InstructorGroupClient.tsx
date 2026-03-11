'use client';

import React, { useState, useRef, useTransition } from 'react';
import type { Profile, Batch, BatchResource } from '@/types/database';
import { createBatch } from '@/lib/actions/batch';
import { uploadBatchResource } from '@/lib/actions/resources';
import {
    Search, Bell, LayoutDashboard, User, Users, GraduationCap,
    LineChart, Award, Settings, Plus, Play, CalendarPlus,
    Radio, FileText, Send, ChevronLeft, ChevronRight,
    PlayCircle, MoreVertical, Settings as SettingsIcon, Image as ImageIcon,
    MessageSquare, Pin, X, Check, Video, CloudUpload, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    currentUser: Profile;
    initialBatches: Batch[];
}

export function InstructorGroupClient({ currentUser, initialBatches }: Props) {
    const [batches, setBatches] = useState<Batch[]>(initialBatches);
    const [activeBatch, setActiveBatch] = useState<Batch | null>(initialBatches[0] || null);

    const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [batchName, setBatchName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [maxStudents, setMaxStudents] = useState<number>(50);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleCreateBatch = () => {
        if (!batchName || !startDate || !endDate) {
            toast.error('Please fill all required fields');
            return;
        }
        startTransition(async () => {
            try {
                const newBatch = await createBatch({
                    name: batchName,
                    start_date: startDate,
                    end_date: endDate,
                });
                setBatches(prev => [newBatch, ...prev]);
                setActiveBatch(newBatch);
                setIsCreateBatchModalOpen(false);
                toast.success('Batch created successfully!');
            } catch (error: any) {
                toast.error(error.message || 'Failed to create batch');
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be under 5MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !activeBatch) return;

        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const result = await uploadBatchResource(
                    activeBatch.id,
                    selectedFile.name,
                    selectedFile.type,
                    selectedFile.size,
                    base64String
                );

                if (result.success) {
                    toast.success('Resource shared with batch!');
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } else {
                    toast.error(result.error);
                }
                setIsUploading(false);
            };
            reader.readAsDataURL(selectedFile);
        } catch (err) {
            toast.error('Upload failed.');
            setIsUploading(false);
        }
    };

    return (
        <div className="flex-1 overflow-hidden p-4 h-[calc(100vh-64px)] relative z-0">
            <div className="grid grid-cols-12 gap-4 h-full max-w-[1800px] mx-auto">

                {/* Left Sidebar Management */}
                <div className="col-span-12 lg:col-span-2 flex flex-col gap-4 h-full">
                    <nav className="rounded-xl border border-white/60 bg-white/65 p-3 shadow-sm backdrop-blur-xl flex flex-col gap-1 h-full">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-3 py-2 mb-1 opacity-70">Management</p>

                        <button
                            onClick={() => setIsCreateBatchModalOpen(true)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-pink-600 shadow-md hover:bg-pink-700 transition-all group mb-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="text-sm font-bold">New Batch</span>
                        </button>

                        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-all group" href="#">
                            <LayoutDashboard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Dashboard</span>
                        </a>
                        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-all group" href="/instructor/one-on-one">
                            <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">1-on-1</span>
                        </a>
                        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-pink-600 border-l-4 border-pink-500 font-semibold shadow-sm bg-white/50" href="#">
                            <Users className="h-5 w-5" />
                            <span className="text-sm">Group Session</span>
                        </a>
                        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-all group" href="#">
                            <GraduationCap className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">LMS</span>
                        </a>
                        <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-all group" href="#">
                            <LineChart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Analytics</span>
                        </a>

                        {/* Active Batch Indicator */}
                        <div className="mt-auto pt-4 border-t border-pink-100/50">
                            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-100 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <Award className="h-4 w-4 text-pink-500" />
                                    <span className="text-[10px] font-bold text-green-600 bg-white/60 px-1.5 py-0.5 rounded-full border border-green-100">Live</span>
                                </div>
                                <h4 className="text-xs font-bold text-gray-900">{activeBatch ? activeBatch.name : 'No Active Batch'}</h4>
                                <p className="text-[10px] text-gray-500 mb-2 truncate">Select from {batches.length} batches</p>
                                <button className="w-full py-1.5 rounded-md bg-white text-pink-600 hover:bg-pink-600 hover:text-white transition-all text-[10px] font-bold shadow-sm border border-pink-100 flex items-center justify-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    Manage Batch
                                </button>
                            </div>
                        </div>
                    </nav>
                </div>

                {/* Center Content */}
                <div className={`col-span-12 lg:col-span-7 flex flex-col gap-4 h-full overflow-hidden transition-all ${isCreateBatchModalOpen ? 'opacity-50 blur-[2px] pointer-events-none' : ''}`}>

                    {/* Active Session Hero */}
                    <div className="relative w-full rounded-xl overflow-hidden shadow-lg group h-48 shrink-0 border border-white/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10"></div>
                        <div className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1000&auto=format&fit=crop')" }}></div>
                        <div className="absolute inset-0 p-5 z-20 flex flex-row items-center justify-between gap-4">
                            <div className="max-w-md">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="flex h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                                    <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Session Live</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Day 12: Cheek Sculpting</h2>
                                <div className="flex gap-3">
                                    <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 flex items-center gap-2">
                                        <span className="text-white text-xs font-medium">10:00 - 11:00 AM</span>
                                    </div>
                                    <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 flex items-center gap-2">
                                        <span className="text-white text-xs font-medium">Advanced Batch</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0 items-end">
                                <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 text-sm w-full shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                    <Play className="h-5 w-5 fill-current" />
                                    Start Live Stream
                                </button>
                                <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 backdrop-blur-sm transition-all text-xs w-full">
                                    <CalendarPlus className="h-4 w-4" />
                                    Schedule Next Session
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 min-h-[160px]">
                        {/* Broadcast Resources */}
                        <div className="col-span-12 md:col-span-7 rounded-xl border border-white/60 bg-white/65 p-4 shadow-sm backdrop-blur-xl flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                        <Radio className="h-4 w-4 text-pink-500" />
                                        Broadcast Resources
                                    </h4>
                                    <p className="text-[10px] text-gray-500 mt-1">Share handouts or guides with the current batch instantly.</p>
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500">
                                    <FileText className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-pink-200 bg-white/40 rounded-lg p-3 flex items-center justify-between gap-3 group hover:border-pink-300 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" />
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-red-50 rounded flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{selectedFile ? selectedFile.name : 'Select File to Broadcast'}</p>
                                        <p className="text-[10px] text-gray-500">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready` : 'Max 5MB (PDF/Images)'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleFileUpload(); }}
                                    disabled={!selectedFile || isUploading || !activeBatch}
                                    className="bg-pink-600 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow-sm hover:bg-pink-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send to Batch'} {!isUploading && <Send className="h-3 w-3" />}
                                </button>
                            </div>
                        </div>

                        {/* Batch Status */}
                        <div className="col-span-12 md:col-span-5 rounded-xl border border-white/60 bg-white/65 p-4 shadow-sm backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#ee2b7c 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm">Batch Status</h4>
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 bg-green-600 rounded-full animate-pulse"></span> Active
                                    </span>
                                </div>
                                <div className="flex items-end gap-2 my-2">
                                    <span className="text-3xl font-bold text-gray-900">24</span>
                                    <span className="text-sm text-gray-500 font-medium mb-1">/ 42 Online</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3 overflow-hidden">
                                    <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: '57%' }}></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    <div className="bg-white/50 rounded p-2 border border-pink-100 text-center">
                                        <p className="text-[10px] text-gray-500 uppercase">Engagement</p>
                                        <p className="text-sm font-bold text-pink-600">High</p>
                                    </div>
                                    <div className="bg-white/50 rounded p-2 border border-pink-100 text-center">
                                        <p className="text-[10px] text-gray-500 uppercase">Avg Time</p>
                                        <p className="text-sm font-bold text-pink-600">42m</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-3 border-b border-pink-100/50">
                            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                <PlayCircle className="h-4 w-4 text-pink-500" />
                                Recorded Daily Archives
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mr-2">Sort by Date</span>
                                <div className="flex gap-1">
                                    <button className="p-1 rounded-md hover:bg-white text-gray-500 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                                    <button className="p-1 rounded-md hover:bg-white text-gray-500 transition-colors"><ChevronRight className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Mock slider for archives */}
                        <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="min-w-[200px] w-[200px] h-full flex flex-col bg-white/80 rounded-lg border border-pink-100 shadow-sm group cursor-pointer hover:border-pink-300 transition-all">
                                    <div className="h-28 w-full bg-gray-200 rounded-t-lg relative">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-all">
                                            <PlayCircle className="h-8 w-8 text-white opacity-80" />
                                        </div>
                                    </div>
                                    <div className="p-3 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] text-pink-600 font-medium bg-pink-50 px-1.5 rounded">Day {12 - i}</span>
                                            <span className="text-[10px] text-gray-500">Oct {25 - i}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-xs line-clamp-2">Face Yoga Session</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Sidebar Chat */}
                <div className={`col-span-12 lg:col-span-3 h-full overflow-hidden transition-all ${isCreateBatchModalOpen ? 'opacity-50 blur-[2px] pointer-events-none' : ''}`}>
                    <div className="rounded-xl border border-white/60 bg-white/65 shadow-sm backdrop-blur-xl h-full flex flex-col">
                        <div className="p-3 border-b border-pink-100/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                    Batch Chat
                                    <span className="bg-pink-100 text-pink-600 text-[9px] font-bold px-1.5 rounded border border-pink-200">ADMIN</span>
                                </h3>
                                <p className="text-[10px] text-gray-500">24 Online • Mod Mode Active</p>
                            </div>
                            <div className="flex gap-1">
                                <button className="p-1.5 rounded-lg hover:bg-white text-gray-500 transition-colors"><SettingsIcon className="h-4 w-4" /></button>
                                <button className="p-1.5 rounded-lg hover:bg-white text-gray-500 transition-colors"><Search className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {/* Chat View Mockup */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-white/30 to-white/60">
                            {/* System message/pin */}
                            <div className="flex justify-center mb-2">
                                <div className="bg-pink-50 border border-pink-100 rounded-full pl-3 pr-1 py-1 text-[10px] font-medium text-pink-600 flex items-center gap-2">
                                    <Pin className="h-3 w-3" />
                                    You pinned a message
                                    <span className="bg-white/80 rounded-full p-0.5 hover:text-red-500 cursor-pointer"><X className="h-3 w-3" /></span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="h-6 w-6 rounded-full bg-pink-200"></div>
                                <div className="flex flex-col max-w-[85%]">
                                    <span className="font-bold text-[10px] text-gray-900 ml-1">Emily R.</span>
                                    <div className="bg-white px-3 py-2 rounded-2xl rounded-tl-none shadow-sm text-xs mt-0.5 border border-pink-50">
                                        <p className="text-gray-800">Is anyone else feeling the burn from yesterday? 🔥</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-row-reverse">
                                <div className="flex flex-col items-end max-w-[85%]">
                                    <span className="font-bold text-[10px] text-gray-500 mr-1 flexitems-center gap-1">
                                        YOU <Check className="h-3 w-3 inline text-green-500" />
                                    </span>
                                    <div className="bg-pink-500 text-white px-3 py-2 rounded-2xl rounded-tr-none shadow-sm text-xs mt-0.5">
                                        <p>Absolutely! Keep it up team!</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-white/80 border-t border-pink-100/50">
                            <div className="relative flex items-center gap-2">
                                <button className="text-gray-500 hover:text-pink-500 transition-colors absolute left-2 z-10"><ImageIcon className="h-4 w-4" /></button>
                                <input className="w-full bg-white border-none rounded-full py-2 pl-9 pr-10 text-xs shadow-inner focus:ring-1 focus:ring-pink-500" placeholder="Message batch as Admin..." />
                                <button className="absolute right-1.5 p-1 rounded-full text-pink-500 hover:bg-pink-50 transition-colors">
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE BATCH MODAL OVERLAY */}
            {isCreateBatchModalOpen && (
                <div className="absolute inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm cursor-pointer" onClick={() => setIsCreateBatchModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg h-full rounded-l-2xl border-l border-white/60 bg-white/80 backdrop-blur-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                        <div className="flex items-center justify-between p-5 border-b border-pink-100/50 bg-white/50 backdrop-blur-xl flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Create New Batch</h3>
                                <p className="text-xs text-gray-500">Set up a new group session schedule</p>
                            </div>
                            <button onClick={() => setIsCreateBatchModalOpen(false)} className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/20">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">Batch Name</label>
                                <input value={batchName} onChange={(e) => setBatchName(e.target.value)} className="w-full rounded-lg border-pink-200 bg-white focus:ring-pink-500 focus:border-pink-500 px-4 py-2 text-sm shadow-sm" placeholder="e.g. Morning Glow - Nov 2023" type="text" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">Start Date</label>
                                    <input value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border-pink-200 bg-white focus:ring-pink-500 focus:border-pink-500 px-4 py-2 text-sm shadow-sm" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">End Date</label>
                                    <input value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border-pink-200 bg-white focus:ring-pink-500 focus:border-pink-500 px-4 py-2 text-sm shadow-sm" type="date" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">Batch Timing</label>
                                <select className="w-full rounded-lg border-pink-200 bg-white focus:ring-pink-500 focus:border-pink-500 px-4 py-2 text-sm shadow-sm">
                                    <option>08:00 AM (Morning)</option>
                                    <option>10:00 AM (Late Morning)</option>
                                    <option>06:00 PM (Evening)</option>
                                </select>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-blue-900 flex items-center gap-2">
                                        <Video className="h-4 w-4" />
                                        Schedule on Zoom
                                    </span>
                                    <span className="text-[10px] text-blue-600/70 mt-0.5">Auto-generate meeting links via API</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">ZOOM API</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">Daily Session Plan</label>
                                    <button className="text-[10px] text-pink-600 font-bold hover:underline">Autofill Template</button>
                                </div>
                                <div className="bg-white/60 rounded-xl border border-pink-100 p-3 space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-1.5 rounded w-12 text-center">Day 1</span>
                                        <input className="flex-1 rounded-md border-gray-200 text-xs py-1.5" defaultValue="Introduction & Posture Check" />
                                    </div>
                                    <button className="w-full py-1.5 border border-dashed border-pink-300 text-pink-600 text-[10px] font-bold rounded-md hover:bg-pink-50 transition-colors flex items-center justify-center gap-1 mt-2">
                                        <Plus className="h-3 w-3" /> Add Day
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">Batch Thumbnail</label>
                                <div className="border-2 border-dashed border-pink-200 bg-white/60 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-pink-50 transition-colors cursor-pointer">
                                    <div className="h-10 w-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-pink-500 mb-2">
                                        <CloudUpload className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-900">Click to upload or drag & drop</p>
                                    <p className="text-[10px] text-gray-500 mt-1">SVG, PNG, JPG (max 2MB)</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-pink-100/50 bg-white/80 backdrop-blur-xl flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsCreateBatchModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                            <button onClick={handleCreateBatch} disabled={isPending} className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-pink-600 shadow-lg shadow-pink-500/30 hover:bg-pink-700 transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2">
                                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Create Batch
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
