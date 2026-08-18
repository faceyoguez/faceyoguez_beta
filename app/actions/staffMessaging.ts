'use server';

import { requireAdminAccess } from './admin';
import { managementTransporter, MANAGEMENT_EMAIL_ADDRESS } from '@/lib/mailer';
import { EMAIL_CONFIG } from '@/lib/email/config';
import { sendWhatsAppMessage } from '@/lib/actions/whatsapp';

const MANAGEMENT_SENDER_NAME = EMAIL_CONFIG.senderName;

export interface SendResult {
  success: boolean;
  error?: string;
  suggestion?: string;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Turns a raw nodemailer/SMTP failure into a reason + actionable suggestion
 * a non-technical staff member can act on.
 */
function classifyEmailError(err: unknown): { reason: string; suggestion: string } {
  const code = (err as { code?: string; responseCode?: number })?.code;
  const responseCode = (err as { responseCode?: number })?.responseCode;
  const rawMessage = err instanceof Error ? err.message : String(err);

  if (code === 'EAUTH' || responseCode === 535) {
    return {
      reason: 'The management email account rejected the login credentials.',
      suggestion: 'Ask your admin to check MANAGEMENT_SMTP_USER / MANAGEMENT_SMTP_PASSWORD (the app password may be wrong or expired).',
    };
  }
  if (code === 'ECONNECTION' || code === 'ETIMEDOUT' || code === 'ESOCKET') {
    return {
      reason: "Couldn't connect to the email server.",
      suggestion: 'Check your internet connection and try sending again in a moment.',
    };
  }
  if (code === 'EENVELOPE') {
    return {
      reason: "The recipient's email address was rejected as invalid.",
      suggestion: "Double-check the student's email address and try again.",
    };
  }
  return {
    reason: rawMessage || 'The email failed to send for an unknown reason.',
    suggestion: 'Try again in a moment. If this keeps happening, contact your admin with this error message.',
  };
}

/**
 * Turns a raw Meta WhatsApp Cloud API failure into a reason + actionable
 * suggestion a non-technical staff member can act on.
 */
function classifyWhatsAppError(errorCode: string | number | undefined, rawMessage: string | undefined): { reason: string; suggestion: string } {
  if (errorCode === 'NOT_CONFIGURED') {
    return {
      reason: 'The WhatsApp Business API is not set up yet.',
      suggestion: 'Ask your admin to add the WhatsApp Business API credentials in the system settings — until then, WhatsApp messages cannot be sent from here.',
    };
  }
  if (errorCode === 'NETWORK_ERROR') {
    return {
      reason: "Couldn't reach WhatsApp's servers.",
      suggestion: 'Check your internet connection and try sending again in a moment.',
    };
  }
  if (errorCode === 190) {
    return {
      reason: 'The WhatsApp access token has expired or is invalid.',
      suggestion: 'Ask your admin to refresh WHATSAPP_ACCESS_TOKEN in the system settings.',
    };
  }
  if (errorCode === 131047) {
    return {
      reason: "This student hasn't messaged you in the last 24 hours, so WhatsApp blocks free-form messages to them.",
      suggestion: 'Ask the student to send any message to the WhatsApp number first, or use an approved template message instead.',
    };
  }
  if (errorCode === 131026) {
    return {
      reason: 'WhatsApp could not deliver the message — this number may not be on WhatsApp or has blocked business messages.',
      suggestion: "Confirm the student's phone number is correct and active on WhatsApp.",
    };
  }
  if (errorCode === 100) {
    return {
      reason: 'WhatsApp rejected the request — usually caused by a malformed phone number.',
      suggestion: "Check the student's phone number includes the country code with no spaces or symbols (e.g. 91XXXXXXXXXX).",
    };
  }
  if (errorCode === 131031 || errorCode === 368) {
    return {
      reason: 'The WhatsApp Business account has been restricted by Meta.',
      suggestion: 'Contact your admin — the WhatsApp Business account needs to be reviewed in Meta Business Manager.',
    };
  }
  return {
    reason: rawMessage || 'The WhatsApp message failed to send for an unknown reason.',
    suggestion: 'Try again in a moment. If this keeps happening, contact your admin with this error message.',
  };
}

/**
 * Sends a free-form email composed by staff, from the shared Faceyoguez
 * sender account, to a student. Used by the staff dashboard's "Message"
 * composer so staff never has to open their own personal Gmail.
 */
export async function sendManagementEmail(input: { to: string; subject: string; message: string }): Promise<SendResult> {
  await requireAdminAccess();

  const to = input.to?.trim();
  const subject = input.subject?.trim();
  const message = input.message?.trim();

  if (!to) return { success: false, error: 'Recipient email is required.', suggestion: 'This student has no email on file.' };
  if (!subject) return { success: false, error: 'Subject is required.', suggestion: 'Add a subject line before sending.' };
  if (!message) return { success: false, error: 'Message body is required.', suggestion: 'Write a message before sending.' };

  const htmlBody = escapeHtml(message).replace(/\n/g, '<br/>');

  try {
    await managementTransporter.sendMail({
      from: `"${MANAGEMENT_SENDER_NAME}" <${MANAGEMENT_EMAIL_ADDRESS}>`,
      replyTo: MANAGEMENT_EMAIL_ADDRESS,
      to,
      subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #1a1a1a;">${htmlBody}</div>`,
    });
    return { success: true };
  } catch (err) {
    console.error('[StaffMessaging] Management email send failed:', err);
    const { reason, suggestion } = classifyEmailError(err);
    return { success: false, error: reason, suggestion };
  }
}

/**
 * Sends a free-form WhatsApp message composed by staff, from the official
 * Faceyoguez WhatsApp Business number, via the Meta Cloud API. No login on
 * the staff's personal device/WhatsApp account is required — this hits the
 * API directly using WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN.
 */
export async function sendManagementWhatsApp(input: { to: string; message: string }): Promise<SendResult> {
  await requireAdminAccess();

  const to = input.to?.trim();
  const message = input.message?.trim();

  if (!to) return { success: false, error: 'Recipient phone number is required.', suggestion: 'This student has no phone number on file.' };
  if (!message) return { success: false, error: 'Message is required.', suggestion: 'Write a message before sending.' };

  const result = await sendWhatsAppMessage(to, message);
  if (result.success) return { success: true };

  const { reason, suggestion } = classifyWhatsAppError(result.errorCode, result.error);
  return { success: false, error: reason, suggestion };
}
