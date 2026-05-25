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
