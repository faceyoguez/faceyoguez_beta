'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Backpack, X, Eye, Download, FileText, Users, User, PlayCircle, Folder, ChevronRight, ChevronLeft } from 'lucide-react';

interface StarterKitSectionProps {
  activePlanTypes: string[];
  className?: string;
}

interface KitFile {
  key: string;
  label: string;
  href: string;
}

interface KitEntry {
  key: string;
  label: string;
  blurb: string;
  icon: typeof FileText;
  files: KitFile[];
}

const PLAN_FOLDERS: Record<string, KitEntry> = {
  one_on_one: {
    key: 'one_on_one',
    label: '1:1 Kit',
    blurb: 'Your personal session lowdown',
    icon: User,
    files: [
      { key: '1-1-welcome', label: 'Welcome Guide', href: '/assets/starter_pdf/1-on-1/faceyoguez-1to1-welcome-guide.pdf' },
      { key: '1-1-faq', label: 'FAQ', href: '/assets/starter_pdf/1-on-1/faceyoguez-1to1-faq.pdf' },
    ],
  },
  group_session: {
    key: 'group_session',
    label: 'Group Kit',
    blurb: 'The group class lowdown',
    icon: Users,
    files: [
      { key: 'group-welcome', label: 'Welcome Guide', href: '/assets/starter_pdf/group/faceyoguez-welcome-guide.pdf' },
      { key: 'group-faq', label: 'FAQ', href: '/assets/starter_pdf/group/faceyoguez-faq.pdf' },
      { key: 'group-posture', label: 'Posture Routine', href: '/assets/starter_pdf/group/bodyworks-posture-routine.pdf' },
    ],
  },
  lms: {
    key: 'lms',
    label: 'Recordings',
    blurb: 'Course + recordings lowdown',
    icon: PlayCircle,
    files: [
      { key: 'reco-welcome', label: 'Welcome Guide', href: '/assets/starter_pdf/recordings/faceyoguez-welcome-guide.pdf' },
      { key: 'reco-posture', label: 'Posture Routine', href: '/assets/starter_pdf/recordings/bodyworks-posture-routine.pdf' },
    ],
  },
};

const SETUP_GUIDE_FOLDER: KitEntry = {
  key: 'setup-guide',
  label: 'Setup Guide',
  blurb: 'Get your space camera-ready',
  icon: FileText,
  files: [
    { key: 'setup-guide-main', label: 'Setup Guide', href: '/assets/starter_pdf/setup-guide/faceyoguez-setup-guide.pdf' },
    { key: 'setup-posture', label: 'Posture Guide', href: '/assets/starter_pdf/setup-guide/faceyoguez-posture-guide.pdf' },
  ],
};

const PRE_POST_FILE: KitFile = {
  key: 'pre-post-guide',
  label: 'Pre & Post Practice Guide',
  href: '/assets/starter_pdf/pre-post-practice-guide.pdf',
};

function FileRow({ file }: { file: KitFile }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100/50 hover:border-[#e76f51]/20 hover:bg-white hover:shadow-sm transition-all">
      <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#e76f51] shrink-0">
        <FileText className="w-4.5 h-4.5" />
      </div>
      <p className="text-[12px] font-bold text-slate-800 truncate flex-1 min-w-0">{file.label}</p>
      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={file.href}
          target="_blank"
          rel="noopener noreferrer"
          title="View"
          className="h-9 w-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-[#e76f51] hover:border-[#e76f51]/30 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </a>
        <a
          href={file.href}
          download
          title="Download"
          className="h-9 w-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-[#e76f51] transition-colors"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export function StarterKitSection({ activePlanTypes, className }: StarterKitSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openFolder, setOpenFolder] = useState<KitEntry | null>(null);

  const planFolders = activePlanTypes
    .map((p) => PLAN_FOLDERS[p])
    .filter((f): f is KitEntry => !!f);
  const folders = [...planFolders, SETUP_GUIDE_FOLDER];
  const totalFileCount = folders.reduce((n, f) => n + f.files.length, 0) + 1;

  const close = () => {
    setIsOpen(false);
    setOpenFolder(null);
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-full text-left bg-gradient-to-br from-[#1a1a1a] to-[#2a2320] rounded-[1.75rem] border border-white/5 shadow-sm p-5 lg:p-6 flex items-center gap-4 lg:gap-5 relative overflow-hidden group hover:shadow-lg hover:shadow-[#e76f51]/10 transition-all duration-500"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#e76f51]/20 blur-3xl group-hover:bg-[#e76f51]/30 transition-colors duration-700" />

          <div className="h-12 w-12 lg:h-14 lg:w-14 shrink-0 rounded-2xl bg-[#e76f51] flex items-center justify-center shadow-lg shadow-[#e76f51]/30 relative z-10">
            <Backpack className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </div>

          <div className="min-w-0 flex-1 relative z-10">
            <div className="flex items-center gap-2">
              <h2 className="text-base lg:text-lg font-aktiv font-bold text-white tracking-tight">Starter Pack</h2>
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#e76f51] bg-[#e76f51]/10 px-2 py-0.5 rounded-full border border-[#e76f51]/20">
                New
              </span>
            </div>
            <p className="text-xs text-white/40 font-medium mt-0.5 truncate">
              The essentials before you dive in ✨
            </p>
          </div>

          <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.15em] text-white/70 bg-white/10 group-hover:bg-white/20 px-3.5 py-2 rounded-xl transition-colors relative z-10">
            Open
          </span>
        </button>
      </motion.section>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-4 bottom-4 top-auto sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto z-[100] w-auto sm:w-full sm:max-w-lg max-h-[85vh] bg-white rounded-[1.75rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 lg:p-6 border-b border-slate-50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {openFolder ? (
                    <button
                      onClick={() => setOpenFolder(null)}
                      className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                      title="Back"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-[#e76f51] flex items-center justify-center shadow-md shadow-[#e76f51]/20 shrink-0">
                      <Backpack className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-aktiv font-bold text-[#1a1a1a] truncate">
                      {openFolder ? openFolder.label : 'Starter Pack'}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">
                      {openFolder ? `${openFolder.files.length} file${openFolder.files.length === 1 ? '' : 's'}` : `${totalFileCount} files · view or save`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={close}
                  className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
                {openFolder ? (
                  openFolder.files.map((file) => <FileRow key={file.key} file={file} />)
                ) : (
                  <>
                    {folders.map((folder) => {
                      const Icon = folder.icon;
                      return (
                        <button
                          key={folder.key}
                          onClick={() => setOpenFolder(folder)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 border border-slate-100/50 hover:border-[#e76f51]/20 hover:bg-white hover:shadow-sm transition-all text-left"
                        >
                          <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#e76f51] shrink-0">
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-slate-800 truncate">{folder.label}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{folder.blurb}</p>
                          </div>
                          <Folder className="w-4 h-4 text-slate-300 shrink-0" />
                          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                        </button>
                      );
                    })}
                    <FileRow file={PRE_POST_FILE} />
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
