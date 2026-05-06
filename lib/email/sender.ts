/**
 * ════════════════════════════════════════════════════════════════
 *  FACEYOGUEZ EMAIL SENDER
 *  ─────────────────────────────────────────────────────────────
 *  Three send functions — one per email type.
 *  Import and call wherever the trigger happens.
 * ════════════════════════════════════════════════════════════════
 */

import { transporter } from '@/lib/mailer';
import { EMAIL_CONFIG, PLAN_LABELS } from './config';
import {
  welcomeEmailHtml,
  invoiceEmailHtml,
  feedbackEmailHtml,
  type InvoiceData,
  type FeedbackEmailData,
} from './templates';
import {
  consultationReceiptEmailHtml,
  consultationActivatedEmailHtml,
  consultationZoomEmailHtml,
  consultationPostNudgeEmailHtml,
  type ConsultationReceiptData,
  type ConsultationActivatedData,
  type ConsultationZoomData,
  type ConsultationPostNudgeData,
} from './consultation-templates';

const FROM = `"${EMAIL_CONFIG.senderName}" <${EMAIL_CONFIG.senderEmail}>`;

// ── 1. Welcome Email ───────────────────────────────────────────
export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject: EMAIL_CONFIG.welcome.subject,
      html: welcomeEmailHtml(firstName),
    });
    console.log(`[Email] Welcome sent → ${to}`);
  } catch (err) {
    // Non-fatal: log but don't crash the signup flow
    console.error('[Email] Welcome email failed:', err);
  }
}

// ── 2. Invoice Email ───────────────────────────────────────────
export async function sendInvoiceEmail(to: string, data: InvoiceData): Promise<void> {
  const planLabel = PLAN_LABELS[data.planType] || data.planType;
  try {
    await transporter.sendMail({
      from: FROM,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject: EMAIL_CONFIG.invoice.subject(planLabel),
      html: invoiceEmailHtml(data),
    });
    console.log(`[Email] Invoice sent → ${to} (${data.paymentId})`);
  } catch (err) {
    // Non-fatal: log but don't crash the payment flow
    console.error('[Email] Invoice email failed:', err);
  }
}

// ── 3. Feedback Thank-You Email ────────────────────────────────
export async function sendFeedbackThankYouEmail(to: string, data: FeedbackEmailData): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject: EMAIL_CONFIG.feedback.subject,
      html: feedbackEmailHtml(data),
    });
    console.log(`[Email] Feedback thank-you sent → ${to}`);
  } catch (err) {
    // Non-fatal: log but don't crash the feedback submit
    console.error('[Email] Feedback thank-you email failed:', err);
  }
}

// ── 4. Consultation Receipt ────────────────────────────────────
export async function sendConsultationReceiptEmail(to: string, data: ConsultationReceiptData): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject: EMAIL_CONFIG.consultation.receiptSubject,
      html: consultationReceiptEmailHtml(data),
    });
    console.log(`[Email] Consultation receipt sent → ${to}`);
  } catch (err) {
    console.error('[Email] Consultation receipt failed:', err);
  }
}

// ── 5. Consultation Activated ──────────────────────────────────
export async function sendConsultationActivatedEmail(to: string, data: ConsultationActivatedData): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject: EMAIL_CONFIG.consultation.activatedSubject,
      html: consultationActivatedEmailHtml(data),
    });
    console.log(`[Email] Consultation activated sent → ${to}`);
  } catch (err) {
    console.error('[Email] Consultation activated failed:', err);
  }
}

// ── 6. Consultation Zoom Invite ────────────────────────────────
export async function sendConsultationZoomEmail(to: string, data: ConsultationZoomData): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject: EMAIL_CONFIG.consultation.zoomSubject,
      html: consultationZoomEmailHtml(data),
    });
    console.log(`[Email] Consultation Zoom invite sent → ${to}`);
  } catch (err) {
    console.error('[Email] Consultation Zoom invite failed:', err);
  }
}

// ── 7. Post-Consultation Plan Nudge ───────────────────────────
export async function sendConsultationPostNudgeEmail(to: string, data: ConsultationPostNudgeData): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject: EMAIL_CONFIG.consultation.postNudgeSubject,
      html: consultationPostNudgeEmailHtml(data),
    });
    console.log(`[Email] Post-consultation nudge sent → ${to}`);
  } catch (err) {
    console.error('[Email] Post-consultation nudge failed:', err);
  }
}
