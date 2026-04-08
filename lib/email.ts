import { transporter } from './mailer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.faceyoguez.com';
const FROM_EMAIL = process.env.EMAIL_FROM || 'Faceyoguez <noreply@faceyoguez.com>';

const BASE_STYLES = `
  font-family: Arial, sans-serif;
  color: #555555;
  line-height: 1.6;
`;

const CARD_STYLES = `
  max-width: 560px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  padding: 40px;
`;

const WRAPPER_STYLES = `
  background-color: #fdf2f8;
  padding: 40px 20px;
  width: 100%;
`;

const BUTTON_STYLES = `
  display: inline-block;
  background-color: #ec4899;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  text-decoration: none;
  margin-top: 16px;
  text-align: center;
`;

const DIVIDER = '<hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0;" />';

const HEADER = `
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="${SITE_URL}/logo.png" width="120" alt="Faceyoguez" style="max-width: 100%;" />
  </div>
`;

const FOOTER = `
  <div style="text-align: center; margin-top: 32px; font-size: 13px; color: #999999;">
    <p>Faceyoguez Wellness Platform &copy; ${new Date().getFullYear()}</p>
    <p>If you have any questions, reply to this email or visit our website.</p>
  </div>
`;

export async function sendWelcomeEmail({ to, studentName, planType }: { to: string, studentName: string, planType: string }) {
  const html = `
    <div style="${WRAPPER_STYLES}">
      <div style="${CARD_STYLES} ${BASE_STYLES}">
        ${HEADER}
        <h2 style="color: #1a1a1a; margin-top: 0;">Welcome to Faceyoguez, ${studentName}! 🌸</h2>
        <p>We are absolutely thrilled to welcome you to the community. Your wellness journey begins today.</p>
        <p>You have successfully unlocked the <strong>${planType}</strong> plan.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${SITE_URL}/dashboard" style="${BUTTON_STYLES}">Go To Your Dashboard</a>
        </div>
        <p>If you need any guidance or have questions, we are just a message away.</p>
        <p>Warmly,<br/><strong>The Faceyoguez Team</strong></p>
        ${DIVIDER}
        ${FOOTER}
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Faceyoguez! 🌸',
    html,
  });
}

export async function sendInvoiceEmail({ to, studentName, invoiceId, planType, amount, currency, paymentDate, paymentMethod }: {
  to: string, studentName: string, invoiceId: string, planType: string, amount: number, currency: string, paymentDate: string, paymentMethod: string
}) {
  const html = `
    <div style="${WRAPPER_STYLES}">
      <div style="${CARD_STYLES} ${BASE_STYLES}">
        ${HEADER}
        <h2 style="color: #1a1a1a; margin-top: 0;">Payment Receipt</h2>
        <p>Hi ${studentName},</p>
        <p>Thank you for your purchase. Here are the details of your transaction:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 0; color: #999;">Invoice ID</td>
            <td style="padding: 12px 0; text-align: right; color: #1a1a1a;"><strong>${invoiceId}</strong></td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 0; color: #999;">Plan</td>
            <td style="padding: 12px 0; text-align: right; color: #1a1a1a;"><strong>${planType}</strong></td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 0; color: #999;">Date</td>
            <td style="padding: 12px 0; text-align: right; color: #1a1a1a;"><strong>${paymentDate}</strong></td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px 0; color: #999;">Method</td>
            <td style="padding: 12px 0; text-align: right; color: #1a1a1a;"><strong>${paymentMethod}</strong></td>
          </tr>
          <tr>
            <td style="padding: 16px 0; color: #1a1a1a; font-size: 16px;"><strong>Amount Paid</strong></td>
            <td style="padding: 16px 0; text-align: right; color: #ec4899; font-size: 16px;"><strong>${currency} ${amount}</strong></td>
          </tr>
        </table>
        
        ${DIVIDER}
        ${FOOTER}
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Your Faceyoguez Payment Receipt',
    html,
  });
}

export async function sendMeetingInviteEmail({ to, studentName, instructorName, meetingTitle, meetingDate, meetingTime, zoomLink, zoomId, zoomPassword, calendarLink }: {
  to: string, studentName: string, instructorName: string, meetingTitle: string, meetingDate: string, meetingTime: string, zoomLink: string, zoomId: string, zoomPassword: string, calendarLink: string
}) {
  const html = `
    <div style="${WRAPPER_STYLES}">
      <div style="${CARD_STYLES} ${BASE_STYLES}">
        ${HEADER}
        <h2 style="color: #1a1a1a; margin-top: 0;">New Live Session Scheduled</h2>
        <p>Hi ${studentName},</p>
        <p><strong>${instructorName}</strong> has scheduled a new live session for you: <strong>${meetingTitle}</strong>.</p>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${meetingDate}</p>
          <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${meetingTime} (IST)</p>
          <p style="margin: 0 0 8px 0;"><strong>Meeting ID:</strong> ${zoomId}</p>
          <p style="margin: 0 0 0 0;"><strong>Passcode:</strong> ${zoomPassword}</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${zoomLink}" style="${BUTTON_STYLES}">Join Zoom Meeting</a>
        </div>
        <div style="text-align: center;">
          <a href="${calendarLink}" style="color: #ec4899; text-decoration: underline; font-size: 14px;">Add to Google Calendar</a>
        </div>
        
        <p style="margin-top: 32px;">Please join 5 minutes early to ensure your audio and video are working perfectly.</p>
        <p>Warmly,<br/><strong>Faceyoguez Desk</strong></p>
        ${DIVIDER}
        ${FOOTER}
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Live Session: ${meetingTitle}`,
    html,
  });
}

export async function sendThankYouEmail({ to, studentName, planType, memberSince, feedbackResponses }: {
  to: string, studentName: string, planType: string, memberSince: string, feedbackResponses: { question: string, answer: string }[]
}) {
  const feedbackHtml = feedbackResponses.map(f => `
    <div style="margin-bottom: 16px;">
      <p style="margin: 0 0 4px 0; color: #1a1a1a; font-weight: bold; font-size: 14px;">${f.question}</p>
      <p style="margin: 0; color: #555; background: #fafafa; padding: 12px; border-radius: 6px; border-left: 3px solid #ec4899;"><em>"${f.answer}"</em></p>
    </div>
  `).join('');

  const html = `
    <div style="${WRAPPER_STYLES}">
      <div style="${CARD_STYLES} ${BASE_STYLES}">
        ${HEADER}
        <h2 style="color: #1a1a1a; margin-top: 0;">Thank you for your trust, ${studentName}</h2>
        <p>Your <strong>${planType}</strong> journey has come to its natural close. We want to take a moment to genuinely thank you for trusting us with your time and your wellness since ${memberSince}.</p>
        <p>It's been wonderful having you in the Faceyoguez community. We read through your reflection on the journey:</p>
        
        <div style="margin: 32px 0;">
          ${feedbackHtml}
        </div>
        
        <p>We honor whatever path you choose next for your wellness. Whether you continue your exercises independently or decide to join us again in the future, we wish you nothing but the absolute best—radiance, health, and peace.</p>
        <p>If you ever miss the guided sessions, our doors are always open.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${SITE_URL}/plans" style="color: #ec4899; text-decoration: underline; font-weight: bold;">View Our Current Offerings</a>
        </div>
        
        <p>With deep gratitude,<br/><strong>The Faceyoguez Team</strong></p>
        ${DIVIDER}
        ${FOOTER}
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Thank you for your journey with us, ${studentName} ❤️`,
    html,
  });
}

export async function sendRenewalReminderEmail({ to, studentName, planType, daysRemaining, expiryDate }: {
  to: string, studentName: string, planType: string, daysRemaining: number, expiryDate: string
}) {
  const html = `
    <div style="${WRAPPER_STYLES}">
      <div style="${CARD_STYLES} ${BASE_STYLES}">
        ${HEADER}
        <h2 style="color: #1a1a1a; margin-top: 0;">Time to renew your radiance, ${studentName} ✨</h2>
        <p>We hope you're loving your Face Yoga journey with us! This is reaching out to let you know that your <strong>${planType}</strong> plan will expire in <strong>${daysRemaining} days</strong> (on ${expiryDate}).</p>
        <p>To ensure your practice continues without interruption and you keep access to all your tools and sessions, we recommend renewing your plan today.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${SITE_URL}/plans" style="${BUTTON_STYLES}">Renew Your Plan</a>
        </div>
        <p>If you have any questions or need help choosing the right plan for your next phase, just reply to this email.</p>
        <p>Warmly,<br/><strong>The Faceyoguez Team</strong></p>
        ${DIVIDER}
        ${FOOTER}
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Your Faceyoguez plan expires in ${daysRemaining} days`,
    html,
  });
}

export async function sendPaymentRecoveryEmail({ to, studentName, planType, amount }: {
  to: string, studentName: string, planType: string, amount: number
}) {
  const html = `
    <div style="${WRAPPER_STYLES}">
      <div style="${CARD_STYLES} ${BASE_STYLES}">
        ${HEADER}
        <h2 style="color: #1a1a1a; margin-top: 0;">We noticed a little hiccup with your payment</h2>
        <p>Hi ${studentName},</p>
        <p>We noticed that your recent attempt to purchase the <strong>${planType}</strong> for ₹${amount} didn't quite go through.</p>
        <p>Payments can fail for many reasons—sometimes it's just a temporary bank glitch or a small typo. We'd love to help you get started on your wellness journey.</p>
        <p>Would you like to try again? You can use a different card, UPI, or net banking.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${SITE_URL}/plans" style="${BUTTON_STYLES}">Retry Payment</a>
        </div>
        <p>If you're having persistent trouble, please reply to this email and we'll figure it out together.</p>
        <p>Warmly,<br/><strong>The Faceyoguez Team</strong></p>
        ${DIVIDER}
        ${FOOTER}
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Complete your Faceyoguez purchase',
    html,
  });
}
