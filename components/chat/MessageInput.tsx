'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Paperclip, Image as ImageIcon, Plus } from 'lucide-react';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendFile: (file: File, type: 'image' | 'pdf' | 'file') => void;
}

export function MessageInput({ onSendText, onSendFile }: MessageInputProps) {
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
    <div className="px-6 py-5 bg-background/60 backdrop-blur-xl border-t border-primary/5 relative z-20">
      <div className="flex items-end gap-3 max-w-6xl mx-auto">
        <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-[1.8rem] flex items-end px-3 py-2 border border-primary/10 focus-within:border-primary/30 focus-within:ring-8 focus-within:ring-primary/5 transition-all duration-500 shadow-sm">
            
            <button
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 flex items-center justify-center rounded-2xl text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all duration-300 shrink-0"
                disabled={isSending}
                title="Attach File"
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
                className="flex-1 resize-none border-none bg-transparent py-2.5 px-3 text-[13px] sm:text-sm text-foreground placeholder-foreground/30 outline-none min-h-[44px] max-h-[150px] custom-scrollbar"
            />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="h-12 w-12 flex items-center justify-center rounded-[1.2rem] bg-foreground text-background shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-20 disabled:scale-100 disabled:shadow-none"
        >
          <Send className="h-5 w-5 fill-current" />
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
            background: rgba(0,0,0,0.05);
            border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
