'use client';

import { useState, useRef } from 'react';
import {
    Bell, Search, Settings, Filter, Send, History, CheckCircle,
    UploadCloud, X, FileText, Image as ImageIcon, CheckCircle2, Loader2,
    Sparkles, ArrowRight, Radio
} from 'lucide-react';
import { sendBroadcastAction, uploadBroadcastResource } from '@/lib/actions/broadcast';
import type { Profile, Batch, AudienceType, MessageContentType } from '@/types/database';
import { cn } from '@/lib/utils';

interface InstructorBroadcastClientProps {
    currentUser: Profile;
    batches: Partial<Batch>[];
    initialBroadcasts: any[];
}

export function InstructorBroadcastClient({ currentUser, batches, initialBroadcasts }: InstructorBroadcastClientProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetAudience, setTargetAudience] = useState<AudienceType>('one_on_one');
    const [targetBatchId, setTargetBatchId] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const [fileUrl, setFileUrl] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [contentType, setContentType] = useState<MessageContentType>('text');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            alert('File size too large. Max 50MB.');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const res = await uploadBroadcastResource(
                    file.name,
                    file.type,
                    file.size,
                    base64
                );

                if (res.success && res.url) {
                    setFileUrl(res.url);
                    setFileName(res.name);
                    setContentType(file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file');
                } else {
                    alert('Upload failed: ' + res.error);
                }
                setUploading(false);
            };
        } catch (err) {
            console.error('Upload error:', err);
            setUploading(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (!content.trim() || !title.trim()) {
            alert('Please provide a title and message content.');
            return;
        }

        if (targetAudience === 'group_session' && !targetBatchId) {
            alert('Please select a specific batch, or choose to send to ALL group session users.');
            return;
        }

        setSending(true);

        const result = await sendBroadcastAction({
            title,
            content,
            target_audience: targetAudience,
            target_batch_id: targetBatchId || undefined,
            file_url: fileUrl,
            file_name: fileName,
            content_type: contentType
        });

        if (result.success) {
            alert(`Broadcast sent successfully to ${result.count} recipients!`);
            setTitle('');
            setContent('');
            setFileUrl('');
            setFileName('');
            setContentType('text');
        } else {
            alert(`Failed to send broadcast: ${result.error}`);
        }

        setSending(false);
    };

    return (
        <div className="flex flex-col gap-10 p-8 lg:p-12 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase border border-primary/10">
                        <Radio className="w-3 h-3" />
                        Universal Connection
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground tracking-tight">
                        Broadcasting Center
                    </h1>
                    <p className="text-lg text-foreground/40 italic font-medium max-w-lg leading-relaxed">
                        Manifest wisdom across the entire collective.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-10 relative z-10">
                {/* Left Column - Composer */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">

                    {/* Audience Selector */}
                    <div className="rounded-3xl p-8 border border-primary/5 shadow-sm transition-all duration-700 bg-white/60 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/30">
                                <Filter className="w-4 h-4" />
                            </div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/30">Target Audience</h3>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { id: 'one_on_one', label: '1-on-1 Clients' },
                                { id: 'group_session', label: 'Group Sessions' },
                                { id: 'all', label: 'Universal Collective' }
                            ].map((audience) => (
                                <button
                                    key={audience.id}
                                    onClick={() => setTargetAudience(audience.id as AudienceType)}
                                    className={cn(
                                        "px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500 border",
                                        targetAudience === audience.id 
                                            ? "bg-foreground text-background shadow-lg border-transparent hover:scale-105" 
                                            : "bg-white text-foreground/40 border-primary/5 hover:bg-primary/5 hover:text-primary"
                                    )}
                                >
                                    {audience.label}
                                </button>
                            ))}
                        </div>

                        {targetAudience === 'group_session' && batches.length > 0 && (
                            <div className="mt-8 animate-in slide-in-from-top-4 duration-500">
                                <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-primary/30 italic">
                                    Specific Collective Path
                                </label>
                                <select
                                    value={targetBatchId}
                                    onChange={(e) => setTargetBatchId(e.target.value)}
                                    className="w-full rounded-2xl border border-primary/10 bg-white/80 px-5 py-4 text-sm font-bold text-foreground outline-none transition-all focus:ring-4 focus:ring-primary/5 focus:border-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FF8A75%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat shadow-sm"
                                >
                                    <option value="">All active group session batches</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Composer */}
                    <div className="rounded-[2.5rem] p-10 border border-primary/5 shadow-sm relative overflow-hidden bg-white/60 backdrop-blur-xl">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                            <Send className="w-32 h-32 text-primary" />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-10">
                            <div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg">
                                <Send className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-serif font-bold text-foreground">Compose Wisdom</h3>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-primary italic">Broadcasting to {targetAudience.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="group">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Wisdom Subject / Radiant Title"
                                    className="w-full rounded-2xl border border-primary/10 bg-white/80 px-6 py-4 text-sm font-bold text-foreground outline-none transition-all focus:ring-4 focus:ring-primary/5 focus:border-primary/20 placeholder:font-bold placeholder:text-foreground/10 italic shadow-sm"
                                />
                            </div>

                            <div className="group">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Channel your message here..."
                                    rows={10}
                                    className="w-full resize-none rounded-2xl border border-primary/10 bg-white/80 px-8 py-8 text-sm font-medium text-foreground outline-none transition-all focus:ring-4 focus:ring-primary/5 focus:border-primary/20 placeholder:text-foreground/10 leading-[1.8] italic custom-scrollbar shadow-inner"
                                />
                            </div>

                            {fileUrl && (
                                <div className="animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-primary/10 shadow-md">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                                                {contentType === 'image' ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{fileName || 'Attached Resource'}</p>
                                                <p className="text-[9px] font-black text-primary uppercase tracking-widest italic">Manifested Resource</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setFileUrl(''); setFileName(''); setContentType('text'); }}
                                            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-primary/5 text-primary/40 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="h-4 w-4 text-primary/40" />
                                    <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest italic">
                                        Wisdom will be preserved in student registries.
                                    </p>
                                </div>
                                <button
                                    onClick={handleSendBroadcast}
                                    disabled={sending || !title.trim() || !content.trim()}
                                    className="group relative h-16 px-12 rounded-full overflow-hidden bg-foreground text-background transition-all duration-700 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-20 flex items-center gap-4 shadow-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em]">
                                        {sending ? 'Manifesting...' : 'Release Broadcast'}
                                    </span>
                                    <ArrowRight className="relative z-10 w-4.5 w-4.5 group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - History & Uploads */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">

                    {/* File Attachment */}
                    <div className="rounded-3xl p-8 border border-primary/5 shadow-sm relative overflow-hidden group bg-white/60 backdrop-blur-xl">
                        <div className="absolute -bottom-8 -right-8 p-10 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110">
                            <UploadCloud className="w-40 h-40 text-primary" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <UploadCloud className="w-4 h-4" />
                            </div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Registry Upload</h3>
                        </div>

                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/10 bg-white/40 p-10 text-center transition-all duration-700 hover:border-primary/20 hover:bg-white group/upload shadow-inner"
                        >
                            {uploading ? (
                                <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary/40" />
                            ) : (
                                <div className="mb-4 h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-md border border-primary/5 group-hover/upload:scale-110 transition-transform">
                                    <UploadCloud className="h-7 w-7 text-primary/10 group-hover/upload:text-primary transition-colors" />
                                </div>
                            )}
                            <p className="text-sm font-bold text-foreground/60">{uploading ? 'Channelling...' : 'Upload Sacred Resource'}</p>
                            <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-primary/20 italic">Digital Essence (max. 50MB)</p>
                        </button>
                    </div>

                    {/* Broadcast History */}
                    <div className="flex-1 rounded-[2.5rem] p-10 border border-primary/5 shadow-sm flex flex-col min-h-[500px] relative overflow-hidden bg-white/60 backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/30">Past Rituals</h3>
                                <p className="text-xl font-serif font-bold text-foreground italic">Chronicles</p>
                            </div>
                            <History className="h-5 w-5 text-primary/10" />
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar relative z-10">
                            {initialBroadcasts.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center space-y-4 opacity-10">
                                    <div className="h-16 w-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/20">
                                        <History className="h-7 w-7" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground italic">The chronicles are empty...</p>
                                </div>
                            ) : (
                                initialBroadcasts.map((bc) => (
                                    <div key={bc.id} className="group p-6 rounded-2xl bg-white/80 border border-primary/5 hover:border-primary/20 shadow-md transition-all duration-700 hover:scale-[1.02]">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <h4 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{bc.title}</h4>
                                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-primary/30 italic">
                                                {new Date(bc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-foreground/40 line-clamp-2 leading-relaxed italic mb-4">{bc.content}</p>

                                        <div className="flex items-center justify-between">
                                            <span className="px-3 py-1 rounded-full bg-primary/5 text-primary/40 text-[9px] font-black uppercase tracking-widest border border-primary/10">
                                                {bc.target_audience.replace('_', ' ')}
                                            </span>
                                            {bc.notifications?.[0]?.count !== undefined && (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/5">
                                                    <CheckCircle2 className="h-3 w-3 text-primary" />
                                                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
                                                        {bc.notifications[0].count} Unified
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
