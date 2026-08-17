'use client';

import React from 'react';

interface SupportContactProps {
  className?: string;
  showText?: boolean;
}

export function SupportContact({ className, showText = true }: SupportContactProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className || ''}`}>
      {showText && (
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e76f51]">
          Support
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {/* WhatsApp Button */}
        <a
          href="https://wa.me/917837310255"
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 w-8 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all duration-300 flex items-center justify-center shadow-sm"
          title="WhatsApp Support"
        >
          <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-6 h-6 object-contain" />
        </a>

        {/* Email Button */}
        <a
          href="mailto:management@faceyoguez.com"
          className="h-8 w-8 rounded-xl bg-[#bc162d]/10 hover:bg-[#bc162d]/20 transition-all duration-300 flex items-center justify-center shadow-sm"
          title="Email Support"
        >
          <img src="/assets/gmail_icon.png" alt="Gmail" className="w-6 h-6 object-contain" />
        </a>
      </div>
    </div>
  );
}
