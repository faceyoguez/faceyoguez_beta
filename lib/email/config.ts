/**
 * ════════════════════════════════════════════════════════════════
 *  FACEYOGUEZ EMAIL CONFIGURATION
 *  ─────────────────────────────────────────────────────────────
 *  Edit this file to update brand details, copy, colors, and
 *  links across ALL transactional emails at once.
 * ════════════════════════════════════════════════════════════════
 */

export const EMAIL_CONFIG = {
  // ── Sender ────────────────────────────────────────────────────
  senderName: 'Simrat from Faceyoguez',
  senderEmail: 'simrat@faceyoguez.com',
  replyTo: 'simrat@faceyoguez.com',

  // ── Brand ─────────────────────────────────────────────────────
  brandName: 'Faceyoguez',
  tagline: 'Your Face Yoga Sanctuary',

  /**
   * LOGO: Replace the URL below with your hosted logo image.
   * Recommended: PNG, 200×60px, transparent background.
   * Upload to Supabase Storage → copy the public URL → paste here.
   *
   * Example:
   *   logoUrl: 'https://vdeddkrsumjhzkqaeywl.supabase.co/storage/v1/object/public/assets/logo.png',
   */
  logoUrl: '', // ← ADD YOUR LOGO URL HERE

  // ── Brand colors ──────────────────────────────────────────────
  colors: {
    primary: '#FF8A75',       // Peach accent
    dark: '#1a1a1a',          // Near-black text
    background: '#FFFAF7',    // Warm white page bg
    cardBg: '#ffffff',        // Card/section background
    border: '#f0e8e0',        // Subtle warm border
    muted: '#86868b',         // Muted grey text
  },

  // ── Site links ────────────────────────────────────────────────
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.faceyoguez.com',
  dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.faceyoguez.com'}/student/dashboard`,
  plansUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.faceyoguez.com'}/plans`,

  // ── Business address (shown in invoice & footer) ──────────────
  /**
   * Fill in your business address below.
   * This appears in the invoice email footer.
   */
  businessAddress: {
    line1: 'Faceyoguez',        // ← Your name / business name
    line2: '',                   // ← Street address or area (optional)
    city: '',                    // ← City
    state: '',                   // ← State
    pincode: '',                 // ← PIN code
    country: 'India',
  },

  // ── Social links ──────────────────────────────────────────────
  social: {
    instagram: 'https://www.instagram.com/faceyoguez', // ← Update if different
    whatsapp: 'https://wa.me/917837310255',
  },

  // ── Welcome email config ──────────────────────────────────────
  welcome: {
    subject: 'Welcome to Faceyoguez — Your Glow-Up Journey Begins ✨',
    // The primary call-to-action button in the welcome email
    ctaText: 'Explore Your Dashboard',
    ctaUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.faceyoguez.com'}/student/dashboard`,
    // What to say on the next-step card
    nextStepHeading: 'What happens next?',
    nextSteps: [
      'Browse our plans and choose the one that fits your ritual',
      'Join a live group session or book your personal 1-on-1 class',
      'Upload your Day 1 photo to start tracking your transformation',
    ],
  },

  // ── Invoice email config ──────────────────────────────────────
  invoice: {
    subject: (planLabel: string) => `Your Faceyoguez Invoice — ${planLabel} 🧾`,
    // Footer note below the invoice table
    note: 'Thank you for investing in yourself. Your journey to radiant skin starts now.',
    supportText: 'Questions about your purchase? Reply to this email — we respond within 24 hours.',
  },

  // ── Feedback thank-you email config ───────────────────────────
  feedback: {
    subject: 'Thank You for Your Feedback — We\'re Listening 🌸',
    // Personal closing message
    closingMessage:
      'Your words mean the world to us. Every piece of feedback helps us craft a better experience for every student on this journey. We genuinely read every response.',
    signOff: 'With gratitude,\nSimrat\nFounder, Faceyoguez',
  },
};

// ── Plan display labels ────────────────────────────────────────
// Update these if you rename your plans
export const PLAN_LABELS: Record<string, string> = {
  one_on_one: '1-on-1 Personal Session',
  group_session: '21-Day Live Group Transformation',
  lms: 'Self-Paced Video Course',
};
