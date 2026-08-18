'use server';

import { transporter } from '@/lib/mailer';
import { EMAIL_CONFIG } from '../email/config';

export async function sendDirectStudentEmail(to: string, subject: string, body: string) {
  try {
    const FROM = `"${EMAIL_CONFIG.senderName}" <${EMAIL_CONFIG.senderEmail}>`;

    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      text: body,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          ${body.replace(/\n/g, '<br>')}
        </div>
      `,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('[Email] Direct send failed:', error);
    return { success: false, error: error.message };
  }
}
