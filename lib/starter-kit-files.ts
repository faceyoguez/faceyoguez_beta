/**
 * Single source of truth for the Starter Pack PDFs — which files exist,
 * which folder they belong to, and which plan unlocks which folder.
 * Used by both components/ui/StarterKitSection.tsx (dashboard UI) and the
 * post-purchase "send the starter pack" email — keeping one list means the
 * two can't silently drift out of sync.
 */

export interface StarterKitFile {
  key: string;
  label: string;
  /** Public path, e.g. /assets/starter_pdf/group/faceyoguez-faq.pdf */
  href: string;
}

export interface StarterKitFolder {
  key: string;
  label: string;
  blurb: string;
  files: StarterKitFile[];
}

export const PLAN_STARTER_FOLDERS: Record<string, StarterKitFolder> = {
  one_on_one: {
    key: 'one_on_one',
    label: '1:1 Kit',
    blurb: 'Your personal session lowdown',
    files: [
      { key: '1-1-welcome', label: 'Welcome Guide', href: '/assets/starter_pdf/1-on-1/faceyoguez-1to1-welcome-guide.pdf' },
      { key: '1-1-faq', label: 'FAQ', href: '/assets/starter_pdf/1-on-1/faceyoguez-1to1-faq.pdf' },
    ],
  },
  group_session: {
    key: 'group_session',
    label: 'Group Kit',
    blurb: 'The group class lowdown',
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
    files: [
      { key: 'reco-welcome', label: 'Welcome Guide', href: '/assets/starter_pdf/recordings/faceyoguez-welcome-guide.pdf' },
      { key: 'reco-posture', label: 'Posture Routine', href: '/assets/starter_pdf/recordings/bodyworks-posture-routine.pdf' },
    ],
  },
};

export const SETUP_GUIDE_FOLDER: StarterKitFolder = {
  key: 'setup-guide',
  label: 'Setup Guide',
  blurb: 'Get your space camera-ready',
  files: [
    { key: 'setup-guide-main', label: 'Setup Guide', href: '/assets/starter_pdf/setup-guide/faceyoguez-setup-guide.pdf' },
    { key: 'setup-posture', label: 'Posture Guide', href: '/assets/starter_pdf/setup-guide/faceyoguez-posture-guide.pdf' },
  ],
};

export const PRE_POST_FILE: StarterKitFile = {
  key: 'pre-post-guide',
  label: 'Pre & Post Practice Guide',
  href: '/assets/starter_pdf/pre-post-practice-guide.pdf',
};

/** Returns every folder + standalone file relevant to a student's active plans. */
export function getStarterKitForPlans(activePlanTypes: string[]): { folders: StarterKitFolder[]; standaloneFiles: StarterKitFile[] } {
  const planFolders = activePlanTypes
    .map((p) => PLAN_STARTER_FOLDERS[p])
    .filter((f): f is StarterKitFolder => !!f);
  return {
    folders: [...planFolders, SETUP_GUIDE_FOLDER],
    standaloneFiles: [PRE_POST_FILE],
  };
}

/** Flattens folders+standalone files into a single file list (for email links, etc.). */
export function getAllStarterKitFiles(activePlanTypes: string[]): StarterKitFile[] {
  const { folders, standaloneFiles } = getStarterKitForPlans(activePlanTypes);
  return [...folders.flatMap((f) => f.files), ...standaloneFiles];
}
