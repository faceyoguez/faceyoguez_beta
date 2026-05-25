/**
 * lib/pixel.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central helper for all Meta Pixel (fbq) events in Faceyoguez.
 *
 * Usage:
 *   import { pixel } from '@/lib/pixel';
 *   pixel.viewContent({ contentName: 'Live Group Plan Page' });
 *   pixel.initiateCheckout({ value: 1499, planId: 'group_session' });
 *   pixel.purchase({ value: 3499, planId: 'lms', paymentId: 'pay_xxx' });
 *   pixel.lead({ source: 'signup_form' });
 *   pixel.custom('ConsultationBooked', { amount: 999 });
 */

function fire(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
}

function fireCustom(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}

// ── Standard Events ───────────────────────────────────────────────────────────

export const pixel = {
  /**
   * PageView — fired automatically by MetaPixel component on every route change.
   * Call manually only if you need to force a second fire (rare).
   */
  pageView() {
    fire('PageView');
  },

  /**
   * ViewContent — fire when a user lands on a plan/product detail page.
   * Maps to Meta's "View Content" standard event.
   */
  viewContent(params: {
    contentName?: string;
    content_name?: string;
    contentIds?: string[];
    content_ids?: string[];
    contentType?: string;
    content_type?: string;
    value?: number;
    currency?: string;
  }) {
    fire('ViewContent', {
      content_name: params.content_name ?? params.contentName,
      content_ids: params.content_ids ?? params.contentIds ?? [],
      content_type: params.content_type ?? params.contentType ?? 'product',
      value: params.value,
      currency: params.currency ?? 'INR',
    });
  },

  /**
   * Lead — fire when a user submits the signup form (creates an account).
   * This is a high-value signal: tells Meta who your prospective buyers are.
   */
  lead(params?: { source?: string; email?: string }) {
    fire('Lead', {
      content_name: 'Signup Form',
      source: params?.source ?? 'web',
      ...(params?.email ? { email: params.email } : {}),
    });
  },

  /**
   * CompleteRegistration — fire after successful account creation & login.
   */
  completeRegistration(params?: { method?: string }) {
    fire('CompleteRegistration', {
      method: params?.method ?? 'email',
    });
  },

  /**
   * InitiateCheckout — fire when the user taps "Subscribe Now" and the
   * checkout sheet opens (before Razorpay loads).
   */
  initiateCheckout(params: {
    value: number;
    planId: string;
    planLabel?: string;
    currency?: string;
  }) {
    fire('InitiateCheckout', {
      value: params.value,
      currency: params.currency ?? 'INR',
      content_ids: [params.planId],
      content_name: params.planLabel ?? params.planId,
      content_type: 'product',
    });
  },

  /**
   * AddToCart — fire when a bump/upsell is selected in the checkout sheet.
   */
  addToCart(params: { itemId: string; itemName: string; value: number }) {
    fire('AddToCart', {
      content_ids: [params.itemId],
      content_name: params.itemName,
      value: params.value,
      currency: 'INR',
    });
  },

  /**
   * Purchase — fire after Razorpay payment is verified server-side.
   * The most important event — optimises for ROAS in your ad campaigns.
   */
  purchase(params: {
    value: number;
    planId: string;
    planLabel?: string;
    paymentId?: string;
    currency?: string;
  }) {
    fire('Purchase', {
      value: params.value,
      currency: params.currency ?? 'INR',
      content_ids: [params.planId],
      content_name: params.planLabel ?? params.planId,
      content_type: 'product',
      transaction_id: params.paymentId,
    });
  },

  /**
   * Search — fire when a user searches for a plan or content.
   */
  search(query: string) {
    fire('Search', { search_string: query });
  },

  // ── Custom Events ─────────────────────────────────────────────────────────

  /**
   * Fire any custom event (trackCustom) for audience building in Events Manager.
   */
  custom(eventName: string, params?: Record<string, unknown>) {
    fireCustom(eventName, params);
  },

  /**
   * ThankYouViewed — custom signal after a completed purchase.
   * Use this in Ads Manager to build high-intent lookalike audiences.
   */
  thankYouViewed(params: { planId?: string; amount?: number; paymentId?: string }) {
    fireCustom('ThankYouViewed', {
      plan_id: params.planId ?? 'unknown',
      amount_inr: params.amount ?? 0,
      payment_id: params.paymentId ?? '',
      source: 'purchase_success_overlay',
    });
  },

  /**
   * ConsultationBooked — fires when a 1-on-1 consultation is paid for.
   */
  consultationBooked(params?: { amount?: number }) {
    fireCustom('ConsultationBooked', {
      amount_inr: params?.amount ?? 999,
      plan_type: 'consultation',
    });
  },

  /**
   * PlanPageView — fires on each marketing plan page (/plans/*).
   * Lets you compare which plan page drives the most interest.
   */
  planPageView(planType: 'live_group' | 'personal_classes' | 'video_courses' | 'student_plans') {
    fireCustom('PlanPageView', { plan_type: planType });
  },

  /**
   * LoginSuccess — fires after a user logs in successfully.
   */
  loginSuccess() {
    fireCustom('LoginSuccess');
  },

  /**
   * LandingPageViewed — fires on homepage load.
   */
  landingPageViewed() {
    fireCustom('LandingPageViewed', { page: 'homepage' });
  },

  /**
   * HeroCtaClicked — fires when any CTA button in the Hero section is clicked.
   */
  heroCtaClicked(params: { buttonLabel: string }) {
    fireCustom('HeroCtaClicked', { button_label: params.buttonLabel });
  },

  /**
   * ScrollSection — fires when a major section scrolls into view.
   * sectionName = 'philosophy' | 'gallery' | 'testimonials' | 'plans' | 'instructor' | 'faq' | 'footer'
   */
  scrollSection(sectionName: string) {
    fireCustom('ScrollSection', { section: sectionName });
  },

  /**
   * TestimonialVideoPlayed — fires when a user clicks play on a testimonial video.
   */
  testimonialVideoPlayed(params: { videoId: string; videoIndex: number }) {
    fireCustom('TestimonialVideoPlayed', { video_id: params.videoId, video_index: params.videoIndex });
  },

  /**
   * PlanCardClicked — fires when a plan card in the Offerings section is clicked.
   */
  planCardClicked(params: { planId: string; planTitle: string }) {
    fireCustom('PlanCardClicked', { plan_id: params.planId, plan_title: params.planTitle });
  },

  /**
   * ConsultationEnquiryClicked — fires when the orange Consultation Enquiry Form button is clicked.
   */
  consultationEnquiryClicked() {
    fireCustom('ConsultationEnquiryClicked', { source: 'floating_button' });
  },

  /**
   * WhatsAppChatClicked — fires when the WhatsApp Quick Chat link is clicked.
   */
  whatsAppChatClicked() {
    fireCustom('WhatsAppChatClicked', { source: 'floating_enquiry' });
  },

  /**
   * EmailEnquiryClicked — fires when the Email Send Enquiry link is clicked.
   */
  emailEnquiryClicked() {
    fireCustom('EmailEnquiryClicked', { source: 'floating_enquiry' });
  },

  /**
   * ContactButtonClicked — fires when the main Contact Us toggle button is opened.
   */
  contactButtonClicked() {
    fireCustom('ContactButtonClicked', { source: 'floating_button' });
  },

  /**
   * NewsletterSubscribed — fires when the newsletter form in the footer is submitted.
   */
  newsletterSubscribed() {
    fireCustom('NewsletterSubscribed', { source: 'footer' });
  },

  /**
   * SocialLinkClicked — fires when the user clicks Instagram or Facebook footer icon.
   */
  socialLinkClicked(params: { platform: 'instagram' | 'facebook' | 'youtube' }) {
    fireCustom('SocialLinkClicked', { platform: params.platform });
  },

  /**
   * PaymentFailed — fires when Razorpay payment attempt fails.
   */
  paymentFailed(params: { planId: string; planLabel?: string; value?: number; reason?: string }) {
    fireCustom('PaymentFailed', {
      plan_id: params.planId,
      plan_label: params.planLabel ?? params.planId,
      amount_inr: params.value,
      failure_reason: params.reason,
    });
  },

  /**
   * DashboardReached — fires when a verified user lands on the dashboard for the first time.
   */
  dashboardReached(params: { role: string }) {
    fireCustom('DashboardReached', { user_role: params.role });
  },

  /**
   * PlanCtaClicked — fires when a CTA button on any plan detail page is clicked.
   */
  planCtaClicked(params: { planId: string; planLabel: string; buttonLabel: string }) {
    fireCustom('PlanCtaClicked', {
      plan_id: params.planId,
      plan_label: params.planLabel,
      button_label: params.buttonLabel,
    });
  },
};

// ── Named re-exports for `import * as pixel` pattern ─────────────────────────
export const pageView = pixel.pageView.bind(pixel);
export const viewContent = pixel.viewContent.bind(pixel);
export const lead = pixel.lead.bind(pixel);
export const completeRegistration = pixel.completeRegistration.bind(pixel);
export const initiateCheckout = pixel.initiateCheckout.bind(pixel);
export const addToCart = pixel.addToCart.bind(pixel);
export const purchase = pixel.purchase.bind(pixel);
export const search = pixel.search.bind(pixel);
export const custom = pixel.custom.bind(pixel);
export const thankYouViewed = pixel.thankYouViewed.bind(pixel);
export const consultationBooked = pixel.consultationBooked.bind(pixel);
export const planPageView = pixel.planPageView.bind(pixel);
export const loginSuccess = pixel.loginSuccess.bind(pixel);
export const landingPageViewed = pixel.landingPageViewed.bind(pixel);
export const heroCtaClicked = pixel.heroCtaClicked.bind(pixel);
export const scrollSection = pixel.scrollSection.bind(pixel);
export const testimonialVideoPlayed = pixel.testimonialVideoPlayed.bind(pixel);
export const planCardClicked = pixel.planCardClicked.bind(pixel);
export const consultationEnquiryClicked = pixel.consultationEnquiryClicked.bind(pixel);
export const whatsAppChatClicked = pixel.whatsAppChatClicked.bind(pixel);
export const emailEnquiryClicked = pixel.emailEnquiryClicked.bind(pixel);
export const contactButtonClicked = pixel.contactButtonClicked.bind(pixel);
export const newsletterSubscribed = pixel.newsletterSubscribed.bind(pixel);
export const socialLinkClicked = pixel.socialLinkClicked.bind(pixel);
export const paymentFailed = pixel.paymentFailed.bind(pixel);
export const dashboardReached = pixel.dashboardReached.bind(pixel);
export const planCtaClicked = pixel.planCtaClicked.bind(pixel);
