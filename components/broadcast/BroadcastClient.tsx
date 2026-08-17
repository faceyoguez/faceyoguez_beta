'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell, Search, Settings, Filter, Send, History, CheckCircle,
    UploadCloud, X, FileText, Image as ImageIcon, CheckCircle2, Loader2,
    ArrowRight, Radio, ShieldCheck, Zap, Plus, Check
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
    const router = useRouter();
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetAudience, setTargetAudience] = useState<AudienceType>('one_on_one');
    const [targetBatchId, setTargetBatchId] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const [fileUrl, setFileUrl] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [contentType, setContentType] = useState<MessageContentType>('text');
    const [sendWhatsApp, setSendWhatsApp] = useState(false);
    const [sendEmail, setSendEmail] = useState(false);

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
                    setFileName(res.name || '');
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
            content_type: contentType,
            send_whatsapp: sendWhatsApp,
            send_email: sendEmail
        });

        if (result.success) {
            const channels = [sendWhatsApp && 'WhatsApp', sendEmail && 'Gmail'].filter(Boolean).join(' + ');
            alert(`Broadcast sent successfully to ${result.count} recipients!${channels ? ` (also sent via ${channels})` : ''}`);
            setBroadcastTitle('');
            setContent('');
            setFileUrl('');
            setFileName('');
            setContentType('text');
            setSendWhatsApp(false);
            setSendEmail(false);
            // Pull the freshly-saved broadcast into the History panel without a manual page reload.
            router.refresh();
        } else {
            alert(`Failed to send broadcast: ${result.error}`);
        }

        setSending(false);
    };

    return (
        <div className="min-h-screen lg:h-screen bg-background flex flex-col lg:overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">

            {/* 1. COMPACT HEADER */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 lg:px-8 py-4 border-b border-primary/5 bg-white/40 backdrop-blur-3xl shrink-0 z-20 gap-3">
                <div className="flex items-center gap-3 lg:gap-6">
                    <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-[1.25rem] bg-foreground text-background flex items-center justify-center shadow-sm shrink-0">
                        <Radio className="h-5 w-5 lg:h-6 lg:w-6" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                            <h1 className="text-lg lg:text-2xl font-bold text-foreground tracking-tight">
                                {title}
                            </h1>
                            <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                                {badge}
                            </span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground/40 tracking-wide">
                            {subtitle}
                        </p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-4">
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
            <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 lg:p-6 gap-4 lg:gap-6 relative z-10">

                {/* PANEL 1: TARGETING & ASSETS (Left - Narrow) */}
                <div className="w-full lg:w-[300px] flex flex-col gap-4 lg:gap-6 shrink-0 lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">

                    {/* Audience Section */}
                    <div className="p-6 rounded-3xl bg-white/60 border border-primary/5 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Filter className="w-4 h-4" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Target Audience</h3>
                        </div>

                        <div className="space-y-3">
                            {[
                                { id: 'one_on_one', label: '1-on-1 Students', color: 'bg-[#5B7A8C]' },
                                { id: 'group_session', label: 'Group Students', color: 'bg-[#FF6B4E]' },
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
                    </div>

                    <div className="p-6 rounded-3xl bg-white/60 border border-primary/5 shadow-sm space-y-6 relative overflow-hidden group">
                        <UploadCloud className="absolute -bottom-10 -right-10 w-32 h-32 text-primary/5 transition-transform" />

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="h-8 w-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                                <UploadCloud className="w-4 h-4" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Resource Library</h3>
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
                                <p className="text-[8px] font-medium text-foreground/20">PDF, PNG, JPG (50MB)</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* PANEL 2: COMPOSER (Center - Wide) */}
                <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-w-0">
                    <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-2xl lg:rounded-[2.5rem] bg-white border border-primary/5 overflow-hidden flex flex-col relative group">

                        {/* Interactive Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] to-transparent pointer-events-none" />

                        <div className="px-4 lg:px-8 py-3.5 lg:py-5 border-b border-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white relative z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                                    <Zap className="h-4 w-4 lg:h-4.5 lg:w-4.5" />
                                </div>
                                <div>
                                    <h2 className="text-sm lg:text-base font-bold text-foreground leading-tight">Compose Message</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary leading-tight mt-0.5">Channeling to {targetAudience.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Broadcasting Live</span>
                            </div>
                        </div>

                        <div className="flex-1 p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 relative z-10 overflow-hidden">
                            <div className="shrink-0">
                                <input
                                    type="text"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="Enter broadcast title..."
                                    className="w-full text-base lg:text-lg font-bold text-foreground placeholder:text-foreground/30 placeholder:font-medium bg-foreground/[0.03] rounded-xl px-4 py-3 outline-none tracking-tight border border-foreground/5 focus:border-primary/30 focus:bg-primary/[0.03] transition-all"
                                />
                            </div>

                            <div className="flex-1 min-h-0 relative">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full h-full resize-none text-sm font-medium text-foreground/80 placeholder:text-foreground/30 bg-foreground/[0.02] rounded-xl px-4 py-3.5 outline-none leading-relaxed custom-scrollbar min-h-[120px] border border-foreground/5 focus:border-primary/30 focus:bg-primary/[0.02] transition-all"
                                />
                            </div>

                            {fileUrl && (
                                <div className="shrink-0 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/15">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm">
                                                {contentType === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                            </div>
                                            <div className="text-[11px] font-bold text-foreground">
                                                <p className="line-clamp-1">{fileName}</p>
                                                <p className="text-[9px] text-primary uppercase tracking-wide">Resource bound</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { setFileUrl(''); setFileName(''); }} className="h-7 w-7 rounded-full hover:bg-white text-foreground/30 hover:text-rose-500 transition-colors flex items-center justify-center">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-4 lg:px-8 py-4 lg:py-5 bg-[#FCEEE8] border-t border-primary/15 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                            {/* Also-send-via toggles: bulk WhatsApp / bulk Gmail, no personal login required */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/45 mr-1">Also send via</span>
                                <button
                                    type="button"
                                    onClick={() => setSendWhatsApp((v) => !v)}
                                    aria-pressed={sendWhatsApp}
                                    title="Also send via WhatsApp"
                                    className={cn(
                                        "relative h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-white",
                                        sendWhatsApp
                                            ? "border-[#25D366] shadow-[0_0_0_3px_rgba(37,211,102,0.15)]"
                                            : "border-foreground/10 opacity-50 hover:opacity-80 hover:border-foreground/20"
                                    )}
                                >
                                    <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-7 h-7 object-contain" />
                                    {sendWhatsApp && (
                                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#25D366] border-2 border-white flex items-center justify-center">
                                            <Check className="w-2 h-2 text-white" strokeWidth={4} />
                                        </span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSendEmail((v) => !v)}
                                    aria-pressed={sendEmail}
                                    title="Also send via Gmail"
                                    className={cn(
                                        "relative h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-white",
                                        sendEmail
                                            ? "border-[#FF6B4E] shadow-[0_0_0_3px_rgba(255,107,78,0.15)]"
                                            : "border-foreground/10 opacity-50 hover:opacity-80 hover:border-foreground/20"
                                    )}
                                >
                                    <img src="/assets/gmail_icon.png" alt="Gmail" className="w-7 h-7 object-contain" />
                                    {sendEmail && (
                                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#FF6B4E] border-2 border-white flex items-center justify-center">
                                            <Check className="w-2 h-2 text-white" strokeWidth={4} />
                                        </span>
                                    )}
                                </button>
                            </div>

                            <button
                                onClick={handleSendBroadcast}
                                disabled={sending || !broadcastTitle.trim() || !content.trim()}
                                className="h-9 px-5 rounded-full bg-foreground text-white flex items-center gap-2 transition-all hover:bg-foreground/85 active:scale-95 disabled:opacity-30 w-full sm:w-auto justify-center shrink-0 shadow-md shadow-foreground/20"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    {sending ? 'Sending...' : 'Send Broadcast'}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* PANEL 3: HISTORY (Right - Narrow) */}
                <div className="w-full lg:w-[340px] flex flex-col gap-6 shrink-0 lg:overflow-hidden">
                    <div className="flex-1 min-h-[300px] lg:min-h-0 rounded-3xl bg-white/60 border border-primary/5 shadow-sm flex flex-col overflow-hidden relative">
                        <div className="p-6 border-b border-primary/5 shrink-0 flex items-center justify-between">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Past Broadcasts</h3>
                                <p className="text-lg font-bold text-foreground">History</p>
                            </div>
                            <History className="h-5 w-5 text-primary/20" />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {initialBroadcasts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-20 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0,transparent_70%)]">
                                    <History className="h-12 w-12 mb-4" />
                                    <p className="text-xs font-bold">The path is clear...</p>
                                </div>
                            ) : (
                                initialBroadcasts.map((bc) => (
                                    <div key={bc.id} className="p-5 rounded-2xl bg-white border border-primary/5 hover:border-primary/20 shadow-sm transition-all hover:-translate-y-1 group/item">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="text-[13px] font-black text-foreground leading-tight line-clamp-1 group-hover/item:text-primary transition-colors">{bc.title}</h4>
                                            <span className="shrink-0 text-[8px] font-black text-primary/30 uppercase">
                                                {new Date(bc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-foreground/40 line-clamp-2 mb-4 leading-relaxed">{bc.content}</p>
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
            `}</style>
        </div>
    );
}
