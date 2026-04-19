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
