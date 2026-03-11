'use client';

import { useState, useRef } from 'react';
import {
    Bell, Search, Settings, Filter, Send, History, CheckCircle,
    UploadCloud, X, FileText, Image as ImageIcon, CheckCircle2, Loader2
} from 'lucide-react';
import { sendBroadcastAction, uploadBroadcastResource } from '@/lib/actions/broadcast';
import type { Profile, Batch, AudienceType, MessageContentType } from '@/types/database';

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

        // 50MB limit
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
        <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-6 overflow-hidden p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Broadcasting Center</h1>
                    <p className="text-sm text-gray-500">Send announcements and resources to your students</p>
                </div>
            </div>

            <div className="grid h-full grid-cols-12 gap-6 overflow-hidden">
                {/* Left Column - Composer */}
                <div className="col-span-12 flex h-full flex-col gap-6 overflow-y-auto lg:col-span-8 custom-scrollbar pb-10">

                    {/* Audience Selector */}
                    <div className="rounded-2xl border border-white/60 bg-white/65 p-4 shadow-sm backdrop-blur-md">
                        <h3 className="mb-3 text-sm font-bold text-gray-900">Select Audience</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setTargetAudience('one_on_one')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${targetAudience === 'one_on_one' ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'bg-white text-gray-600 hover:bg-pink-50'}`}
                            >
                                1-on-1 Clients
                            </button>
                            <button
                                onClick={() => setTargetAudience('group_session')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${targetAudience === 'group_session' ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'bg-white text-gray-600 hover:bg-pink-50'}`}
                            >
                                Group Sessions
                            </button>
                            <button
                                onClick={() => setTargetAudience('all')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${targetAudience === 'all' ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'bg-white text-gray-600 hover:bg-pink-50'}`}
                            >
                                Everyone
                            </button>
                        </div>

                        {targetAudience === 'group_session' && batches.length > 0 && (
                            <div className="mt-4">
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Target Batch (Optional)
                                </label>
                                <select
                                    value={targetBatchId}
                                    onChange={(e) => setTargetBatchId(e.target.value)}
                                    className="w-full rounded-xl border border-pink-100 bg-white/50 px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
                                >
                                    <option value="">All active group session batches</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {targetAudience === 'group_session' && batches.length === 0 && (
                            <div className="mt-4 text-sm text-gray-500 italic">No active batches available.</div>
                        )}
                    </div>

                    {/* Composer */}
                    <div className="flex-1 rounded-2xl border border-white/60 bg-white/65 p-6 shadow-sm backdrop-blur-md">
                        <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                            <Send className="h-5 w-5 text-pink-500" />
                            Compose Message
                        </h3>

                        <div className="mb-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Message Subject / Title"
                                className="w-full rounded-xl border border-pink-100 bg-white/50 p-3 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-pink-200 placeholder:font-normal"
                            />
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your broadcast message here..."
                            rows={8}
                            className="w-full resize-none rounded-xl border border-pink-100 bg-white/50 p-4 text-sm outline-none transition-all focus:ring-2 focus:ring-pink-200"
                        />

                        {fileUrl && (
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-pink-50/50 p-3 border border-pink-100">
                                <div className="flex items-center gap-3">
                                    {contentType === 'image' ? <ImageIcon className="h-5 w-5 text-pink-500" /> : <FileText className="h-5 w-5 text-pink-500" />}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{fileName || 'Attached File'}</p>
                                        <p className="text-xs text-gray-500">Ready to send</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setFileUrl(''); setFileName(''); setContentType('text'); }}
                                    className="rounded-full p-1.5 text-gray-400 hover:bg-white hover:text-red-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">
                                This will send notifications to the specified users.
                            </span>
                            <button
                                onClick={handleSendBroadcast}
                                disabled={sending || !title.trim() || !content.trim()}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-200/50 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {sending ? 'Sending...' : 'Send Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column - History & Uploads */}
                <div className="col-span-12 flex h-full flex-col gap-6 lg:col-span-4 overflow-y-auto custom-scrollbar pb-10">

                    {/* File Attachment */}
                    <div className="rounded-2xl border border-white/60 bg-white/65 p-6 shadow-sm backdrop-blur-md">
                        <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                            <UploadCloud className="h-5 w-5 text-pink-500" />
                            Attach Resource
                        </h3>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-pink-100 bg-pink-50/30 p-8 text-center transition-all hover:bg-pink-100/50 group"
                        >
                            {uploading ? (
                                <Loader2 className="mb-2 h-8 w-8 animate-spin text-pink-500" />
                            ) : (
                                <UploadCloud className="mb-2 h-8 w-8 text-pink-400 group-hover:text-pink-600" />
                            )}
                            <p className="text-sm font-bold text-gray-600">{uploading ? 'Processing File...' : 'Click to upload or drag and drop'}</p>
                            <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG or Docs (max. 50MB)</p>
                        </button>
                    </div>

                    {/* Broadcast History */}
                    <div className="flex-1 rounded-2xl border border-white/60 bg-white/65 p-6 shadow-sm backdrop-blur-md flex flex-col min-h-[400px]">
                        <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                            <History className="h-5 w-5 text-pink-500" />
                            Recent Broadcasts
                        </h3>

                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {initialBroadcasts.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
                                    <History className="mb-2 h-8 w-8 text-gray-300" />
                                    <p className="text-sm font-medium">No broadcasts sent yet.</p>
                                </div>
                            ) : (
                                initialBroadcasts.map((bc) => (
                                    <div key={bc.id} className="rounded-xl border border-pink-50 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-gray-900 line-clamp-1">{bc.title}</h4>
                                            <span className="shrink-0 text-[10px] font-bold text-gray-400">
                                                {new Date(bc.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{bc.content}</p>

                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="rounded bg-pink-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-600">
                                                {bc.target_audience.replace('_', ' ')}
                                            </span>
                                            {bc.notifications?.[0]?.count !== undefined && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    {bc.notifications[0].count} Sent
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
