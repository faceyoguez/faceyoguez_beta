'use client';

import { useEffect, useState } from 'react';
import { getWebinarWhatsAppLink } from '@/lib/actions/webinar';
import { cn } from '@/lib/utils';

interface WhatsAppCommunityButtonProps {
  className?: string;
}

/**
 * "Join our WhatsApp community" — sits to the left of <SupportContact/>
 * wherever that appears. Link is admin-configurable (falls back to the
 * support number if that fetch fails).
 */
export function WhatsAppCommunityButton({ className }: WhatsAppCommunityButtonProps) {
  const [communityLink, setCommunityLink] = useState('https://wa.me/917837310255');

  useEffect(() => {
    getWebinarWhatsAppLink()
      .then((link) => { if (link) setCommunityLink(link); })
      .catch(() => { /* keep the default support number */ });
  }, []);

  return (
    <a
      href={communityLink}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-[#25D366]/20',
        'shadow-[0_0_16px_rgba(37,211,102,0.35)] hover:shadow-[0_0_24px_rgba(37,211,102,0.55)]',
        'hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300',
        className
      )}
    >
      <img src="/assets/whatsapp_icon.png" alt="WhatsApp" className="w-6 h-6 object-contain shrink-0" />
      <span className="text-[9px] font-bold text-slate-500 leading-tight max-w-[110px] text-left">
        Join our WhatsApp community for exclusive updates
      </span>
    </a>
  );
}
