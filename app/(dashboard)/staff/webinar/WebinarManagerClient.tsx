'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { setWebinarWhatsAppLink } from '@/lib/actions/webinar';
import { Save, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export function WebinarManagerClient({ initialLink }: { initialLink: string }) {
  const [link, setLink] = useState(initialLink);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!link.trim()) {
      toast.error('Please enter a valid link');
      return;
    }
    
    // Basic validation
    if (!link.startsWith('http')) {
      toast.error('Link must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    const { success, error } = await setWebinarWhatsAppLink(link.trim());
    setIsSaving(false);

    if (success) {
      toast.success('Webinar link updated successfully!');
    } else {
      toast.error(error || 'Failed to update link');
    }
  };

  return (
    <div className="min-h-full bg-[#FFFAF7] p-6 sm:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-aktiv font-bold text-[#1a1a1a]">Webinar Settings</h1>
          <p className="text-sm font-jakarta text-[#1a1a1a]/60">
            Manage the WhatsApp community link for the weekend live webinar landing page.
          </p>
        </div>

        {/* Manager Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-8 rounded-[2rem] border border-[#FF8A75]/20 shadow-xl shadow-[#FF8A75]/5 space-y-6"
        >
          <div className="space-y-4">
            <label className="text-sm font-bold font-jakarta text-[#1a1a1a] flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#FF8A75]" /> WhatsApp Community Link
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#FFFAF7] border border-[#FF8A75]/20 rounded-xl font-jakarta text-sm focus:outline-none focus:border-[#FF8A75] focus:ring-1 focus:ring-[#FF8A75] transition-all"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FF8A75] hover:bg-[#e76f51] text-white rounded-xl font-bold font-jakarta text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : (
                  <>
                    <Save className="w-4 h-4" /> Save Link
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-[#1a1a1a]/50 font-jakarta">
              This link will be used for all "Join" buttons on the <a href="/webinar" target="_blank" className="text-[#FF8A75] hover:underline inline-flex items-center gap-1">public webinar page <ExternalLink className="w-3 h-3"/></a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
