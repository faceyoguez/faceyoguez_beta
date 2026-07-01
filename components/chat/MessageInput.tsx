'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Paperclip, Image as ImageIcon, Plus, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendFile: (file: File, type: 'image' | 'pdf' | 'file') => void;
  onSendVoice?: (blob: Blob) => void;
  dark?: boolean;
}

export function MessageInput({ onSendText, onSendFile, onSendVoice, dark = false }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      alert('Microphone access is blocked in non-secure HTTP contexts. Please access the site via localhost or HTTPS.');
      return;
    }

    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support microphone access. Please try a different browser or check HTTPS context.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (onSendVoice && audioBlob.size > 0) {
          onSendVoice(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Microphone permission was denied. Please allow microphone access in your browser settings (look for the mic icon in your address bar).');
      } else {
        alert(`Could not access microphone: ${err.message || err.name || 'Unknown error'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    onSendText(trimmed);
    setText('');
    setIsSending(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'image' | 'pdf' | 'file' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type === 'application/pdf') type = 'pdf';

    onSendFile(file, type);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
  };

  return (
    <div className={cn(
      "px-6 py-5 border-t relative z-20 transition-all duration-700",
      dark ? "bg-[#1a1a1a] border-white/5" : "bg-background/60 backdrop-blur-3xl border-primary/5"
    )}>
      <div className="flex items-center gap-2 max-w-6xl mx-auto">
        <div className={cn(
          "flex-1 rounded-full flex items-center px-2 py-1 border transition-all duration-500",
          dark 
            ? "bg-white/10 border-white/5 focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-[#FF8A75]/10" 
            : "bg-white focus-within:ring-4 focus-within:ring-primary/5 border-primary/10 focus-within:border-primary/30"
        )}>
            
            <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-full transition-all duration-300 shrink-0",
                  dark ? "text-white/20 hover:text-[#FF8A75] hover:bg-white/10" : "text-foreground/40 hover:text-primary hover:bg-primary/5"
                )}
                disabled={isSending || isRecording}
                title="Attach Reflections"
            >
                <Plus className="h-4 w-4" />
            </button>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
            />

            {onSendVoice && !isRecording && (
              <button
                type="button"
                onClick={startRecording}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-full transition-all duration-300 shrink-0",
                  dark ? "text-white/20 hover:text-[#FF8A75] hover:bg-white/10" : "text-foreground/40 hover:text-primary hover:bg-primary/5"
                )}
                disabled={isSending}
                title="Record Voice Note"
              >
                <Mic className="h-4.5 w-4.5" />
              </button>
            )}

            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20 text-red-500 font-bold text-xs animate-pulse">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  Recording Audio... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="h-6 px-3 rounded-full bg-red-500 text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Stop & Send
                </button>
              </div>
            ) : (
              <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your reflections..."
                  rows={1}
                  className={cn(
                    "flex-1 resize-none border-none bg-transparent py-1.5 px-2 text-sm outline-none min-h-[32px] max-h-[150px] custom-scrollbar selection:bg-[#FF8A75]/20 flex items-center",
                    dark ? "text-white placeholder-white/20" : "text-foreground placeholder-foreground/30"
                  )}
              />
            )}
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-20 disabled:scale-100 shadow-sm",
            dark ? "bg-[#FF8A75] text-white shadow-[#FF8A75]/20" : "bg-foreground text-background shadow-primary/10"
          )}
        >
          <Send className={cn("h-4 w-4 fill-current ml-0.5", isSending && "animate-pulse")} />
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(${dark ? '255,255,255' : '0,0,0'}, ${dark ? '0.1' : '0.05'});
            border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
