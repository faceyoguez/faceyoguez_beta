'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react';

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
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-pink-100/40 bg-white/40 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-end gap-2 rounded-xl bg-white/70 px-2 py-1.5 ring-1 ring-pink-100/50 transition-all focus-within:ring-2 focus-within:ring-pink-200">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-500"
          disabled={isSending}
        >
          <Paperclip className="h-5 w-5" />
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
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none border-none bg-transparent py-1.5 text-sm text-gray-700 placeholder-gray-400 outline-none"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="rounded-lg bg-pink-500 p-1.5 text-white shadow-sm transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
