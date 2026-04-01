'use client';

import { useState, useRef } from 'react';
import {
    Bell, Search, Settings, Filter, Send, History, CheckCircle,
    UploadCloud, X, FileText, Image as ImageIcon, CheckCircle2, Loader2,
    Sparkles, ArrowRight, Radio, ShieldCheck, Zap, Plus
} from 'lucide-react';
import { sendBroadcastAction, uploadBroadcastResource } from '@/lib/actions/broadcast';
import type { Profile, Batch, AudienceType, MessageContentType } from '@/types/database';
import { cn } from '@/lib/utils';

interface BroadcastClientProps {
    currentUser: Profile;
    batches: Partial<Batch>[];
    initialBroadcasts: any[];
    title: string;
    subtitle: string;
    badge: string;
}

export function BroadcastClient({ currentUser, batches, initialBroadcasts, title, subtitle, badge }: BroadcastClientProps) {
    const [broadcastTitle, setBroadcastTitle] = useState('');
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
        if (!content.trim() || !broadcastTitle.trim()) {
            alert('Please provide a title and message content.');
            return;
        }

        setSending(true);

        const result = await sendBroadcastAction({
            title: broadcastTitle,
            content,
            target_audience: targetAudience,
            target_batch_id: targetBatchId || undefined,
            file_url: fileUrl,
            file_name: fileName,
            content_type: contentType
        });

        if (result.success) {
            alert(`Broadcast sent successfully to ${result.count} recipients!`);
            setBroadcastTitle('');
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
        <div className="h-screen bg-background flex flex-col overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
            
            {/* 1. COMPACT HEADER */}
            <header className="flex items-center justify-between px-8 py-4 border-b border-primary/5 bg-white/40 backdrop-blur-3xl shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-[1.25rem] bg-foreground text-background flex items-center justify-center shadow-sm">
                        <Radio className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-serif font-black text-foreground tracking-tight italic">
                                {title}
                            </h1>
                            <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                                {badge}
                            </span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground/40 italic tracking-wide">
                            {subtitle}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-foreground/5 rounded-2xl border border-foreground/5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">
                            Portal Operational
                        </span>
                    </div>
                    <button className="h-10 w-10 rounded-xl bg-white border border-primary/5 shadow-sm flex items-center justify-center text-foreground hover:scale-110 transition-transform">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* 2. MAIN CONTENT AREA (TRI-PANEL) */}
            <main className="flex-1 flex overflow-hidden p-6 gap-6 relative z-10">
                
                {/* PANEL 1: TARGETING & ASSETS (Left - Narrow) */}
                <div className="w-[300px] flex flex-col gap-6 shrink-0 overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* Audience Section */}
                    <div className="p-6 rounded-3xl bg-white/60 border border-primary/5 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Filter className="w-4 h-4" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Target System</h3>
                        </div>

                        <div className="space-y-3">
                            {[
                                { id: 'one_on_one', label: '1-on-1 Students', color: 'bg-indigo-500' },
                                { id: 'group_session', label: 'Group Students', color: 'bg-rose-500' },
                                { id: 'all', label: 'All Students', color: 'bg-foreground' }
                            ].map((audience) => (
                                <button
                                    key={audience.id}
                                    onClick={() => setTargetAudience(audience.id as AudienceType)}
                                    className={cn(
                                        "w-full px-5 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-between border group",
                                        targetAudience === audience.id
                                            ? "bg-foreground text-background border-transparent"
                                            : "bg-white/40 text-foreground/40 border-primary/5 hover:bg-white hover:text-foreground"
                                    )}
                                >
                                    <span>{audience.label}</span>
                                    <div className={cn(
                                        "h-2 w-2 rounded-full group-hover:scale-150 transition-transform",
                                        targetAudience === audience.id ? "bg-primary" : audience.color
                                    )} />
                                </button>
                            ))}
                        </div>

                        {targetAudience === 'group_session' && batches.length > 0 && (
                            <div className="pt-4 border-t border-primary/5 animate-in slide-in-from-top-4">
                                <label className="mb-3 block text-[9px] font-bold uppercase tracking-widest text-primary/40 italic">
                                    Specific Collective Path
                                </label>
                                <select
                                    value={targetBatchId}
                                    onChange={(e) => setTargetBatchId(e.target.value)}
                                    className="w-full rounded-xl border border-primary/10 bg-white px-4 py-3 text-[11px] font-bold text-foreground outline-none shadow-sm transition-all focus:ring-4 focus:ring-primary/5"
                                >
                                    <option value="">All active groups</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="p-6 rounded-3xl bg-white/60 border border-primary/5 shadow-sm space-y-6 relative overflow-hidden group">
                        <UploadCloud className="absolute -bottom-10 -right-10 w-32 h-32 text-primary/5 transition-transform" />
                        
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="h-8 w-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                                <UploadCloud className="w-4 h-4" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Wisdom Registry</h3>
                        </div>

                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full h-32 rounded-2xl border-2 border-dashed border-primary/10 bg-white/40 flex flex-col items-center justify-center gap-3 transition-all hover:bg-white hover:border-primary/30 group/btn"
                        >
                            {uploading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            ) : (
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary transition-all">
                                    <Plus className="w-5 h-5" />
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">{uploading ? 'Transmitting' : 'Add Resource'}</p>
                                <p className="text-[8px] font-medium text-foreground/20 italic">PDF, PNG, JPG (50MB)</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* PANEL 2: COMPOSER (Center - Wide) */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex-1 rounded-[2.5rem] bg-white border border-primary/5 overflow-hidden flex flex-col relative group">
                        
                        {/* Interactive Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] to-transparent pointer-events-none" />

                        <div className="px-10 py-8 border-b border-primary/5 flex items-center justify-between bg-white relative z-10 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-primary text-background flex items-center justify-center">
                                    <Zap className="h-7 w-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-black text-foreground italic">Manifest Intent</h2>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary italic">Channeling to {targetAudience.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Broadcasting Life</span>
                            </div>
                        </div>

                        <div className="flex-1 p-10 flex flex-col gap-8 relative z-10 overflow-hidden">
                            <div className="shrink-0">
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="Enter Wisdom Subject..."
                                    className="w-full text-4xl font-serif font-black text-foreground placeholder:text-foreground/5 bg-transparent outline-none italic tracking-tight border-b-2 border-transparent focus:border-primary/10 pb-4 transition-all"
                                />
                            </div>

                            <div className="flex-1 min-h-0 relative">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Unfold your message here... The collective is listening."
                                    className="w-full h-full resize-none text-xl font-medium text-foreground/70 placeholder:text-foreground/5 bg-transparent outline-none italic leading-relaxed custom-scrollbar"
                                />
                            </div>

                            {fileUrl && (
                                <div className="shrink-0 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                                {contentType === 'image' ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                            </div>
                                            <div className="text-[11px] font-bold text-foreground">
                                                <p className="line-clamp-1">{fileName}</p>
                                                <p className="text-[9px] text-primary uppercase italic">Resource Bound</p>
                                            </div>
                                        </div>
                                        <button onClick={() => {setFileUrl(''); setFileName('');}} className="h-8 w-8 rounded-full hover:bg-white text-foreground/20 hover:text-rose-500 transition-colors">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-10 py-10 bg-foreground shrink-0 flex items-center justify-between group/footer">
                            <div className="flex items-center gap-4">
                                <Sparkles className="h-5 w-5 text-background/20" />
                                <p className="text-[10px] font-medium text-background/30 italic tracking-widest uppercase">Wisdom will be preserved in student archives.</p>
                            </div>
                            <button
                                onClick={handleSendBroadcast}
                                disabled={sending || !broadcastTitle.trim() || !content.trim()}
                                className="h-16 px-12 rounded-full bg-primary text-background flex items-center gap-4 transition-all hover:brightness-110 active:scale-95 disabled:opacity-20 relative overflow-hidden"
                            >
                                <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em]">
                                    {sending ? 'Radiating...' : 'Release Broadcast'}
                                </span>
                                <ArrowRight className="relative z-10 h-5 w-5 group-hover/footer:translate-x-2 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* PANEL 3: HISTORY (Right - Narrow) */}
                <div className="w-[340px] flex flex-col gap-6 shrink-0 overflow-hidden">
                    <div className="flex-1 rounded-3xl bg-white/60 border border-primary/5 shadow-sm flex flex-col overflow-hidden relative">
                        <div className="p-6 border-b border-primary/5 shrink-0 flex items-center justify-between">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Past Broadcasts</h3>
                                <p className="text-lg font-serif font-bold text-foreground italic">Chronicles</p>
                            </div>
                            <History className="h-5 w-5 text-primary/20" />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {initialBroadcasts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-20 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0,transparent_70%)]">
                                    <History className="h-12 w-12 mb-4" />
                                    <p className="text-xs font-bold italic">The path is clear...</p>
                                </div>
                            ) : (
                                initialBroadcasts.map((bc) => (
                                    <div key={bc.id} className="p-5 rounded-2xl bg-white border border-primary/5 hover:border-primary/20 shadow-sm transition-all hover:-translate-y-1 group/item">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="text-[13px] font-black text-foreground leading-tight line-clamp-1 group-hover/item:text-primary transition-colors">{bc.title}</h4>
                                            <span className="shrink-0 text-[8px] font-black text-primary/30 uppercase italic">
                                                {new Date(bc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-foreground/40 line-clamp-2 italic mb-4 leading-relaxed">{bc.content}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20 border border-foreground/5 px-2 py-0.5 rounded-full">
                                                {bc.target_audience.replace('_', ' ')}
                                            </span>
                                            {bc.notifications?.[0]?.count !== undefined && (
                                                <div className="flex items-center gap-1.5 text-primary">
                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                    <span className="text-[9px] font-black uppercase">{bc.notifications[0].count} Unified</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

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
                .text-rose-500 { color: #f43f5e; }
                .bg-rose-500 { background-color: #f43f5e; }
                .text-indigo-500 { color: #6366f1; }
                .bg-indigo-500 { background-color: #6366f1; }
            `}</style>
        </div>
    );
}
