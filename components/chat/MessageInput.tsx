'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Paperclip, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendFile: (file: File, type: 'image' | 'pdf' | 'file') => void;
  dark?: boolean;
}

export function MessageInput({ onSendText, onSendFile, dark = false }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="flex items-end gap-3 max-w-6xl mx-auto">
        <div className={cn(
          "flex-1 rounded-[2rem] flex items-end px-3 py-2 border transition-all duration-500",
          dark 
            ? "bg-white/10 border-white/5 focus-within:bg-white/15 focus-within:ring-4 focus-within:ring-[#FF8A75]/10" 
            : "bg-white focus-within:ring-8 focus-within:ring-primary/5 border-primary/10 focus-within:border-primary/30"
        )}>
            
            <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-2xl transition-all duration-300 shrink-0",
                  dark ? "text-white/20 hover:text-[#FF8A75] hover:bg-white/10" : "text-foreground/40 hover:text-primary hover:bg-primary/5"
                )}
                disabled={isSending}
                title="Attach Reflections"
            >
                <Plus className="h-5 w-5" />
            </button>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
            />

            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Share your reflections..."
                rows={1}
                className={cn(
                  "flex-1 resize-none border-none bg-transparent py-2.5 px-3 text-[14px] outline-none min-h-[44px] max-h-[200px] custom-scrollbar selection:bg-[#FF8A75]/20",
                  dark ? "text-white placeholder-white/20" : "text-foreground placeholder-foreground/30"
                )}
            />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className={cn(
            "h-12 w-12 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-20 disabled:scale-100 shadow-xl",
            dark ? "bg-[#FF8A75] text-white shadow-[#FF8A75]/20" : "bg-foreground text-background shadow-primary/10"
          )}
        >
          <Send className={cn("h-5 w-5 fill-current", isSending && "animate-pulse")} />
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
