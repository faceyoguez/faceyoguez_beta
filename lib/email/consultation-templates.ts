// ─────────────────────────────────────────────────────────────
//  CONSULTATION EMAIL TEMPLATES
//  Appended to the main templates.ts export
// ─────────────────────────────────────────────────────────────
import { EMAIL_CONFIG } from './config';

const C = EMAIL_CONFIG.colors;

// ── Shared base layout (copied from templates.ts pattern) ─────
function baseLayout(content: string): string {
  const addr = EMAIL_CONFIG.businessAddress;
  const addressLine = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country]
    .filter(Boolean)
    .join(', ');

  const logo = EMAIL_CONFIG.logoUrl
    ? `<img src="${EMAIL_CONFIG.logoUrl}" alt="${EMAIL_CONFIG.brandName}" width="160" style="display:block;height:auto;border:0;" />`
    : `<span style="font-size:22px;font-weight:700;color:${C.dark};letter-spacing:-0.5px;">${EMAIL_CONFIG.brandName}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${EMAIL_CONFIG.brandName}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${C.background};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:${C.cardBg};border-radius:16px 16px 0 0;padding:32px 40px 24px;border-bottom:1px solid ${C.border};text-align:left;">
              ${logo}
              <p style="margin:4px 0 0;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:${C.muted};">${EMAIL_CONFIG.tagline}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${C.cardBg};padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:${C.cardBg};border-radius:0 0 16px 16px;padding:24px 40px 32px;border-top:1px solid ${C.border};">
              <p style="margin:0 0 6px;font-size:12px;color:${C.muted};">Questions? Reply to this email or reach us at <a href="mailto:${EMAIL_CONFIG.replyTo}" style="color:${C.primary};text-decoration:none;">${EMAIL_CONFIG.replyTo}</a></p>
              <p style="margin:0 0 6px;font-size:12px;color:${C.muted};"><a href="${EMAIL_CONFIG.social.instagram}" style="color:${C.muted};text-decoration:none;">Instagram</a> &nbsp;·&nbsp; <a href="${EMAIL_CONFIG.social.whatsapp}" style="color:${C.muted};text-decoration:none;">WhatsApp</a></p>
              ${addressLine ? `<p style="margin:0;font-size:11px;color:${C.muted};">${addressLine}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:32px 0 0;">
    <tr>
      <td style="border-radius:100px;background-color:${C.dark};">
        <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:13px;font-weight:700;letter-spacing:0.05em;color:#fff;text-decoration:none;border-radius:100px;">${text} →</a>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<div style="margin:28px 0;height:1px;background-color:${C.border};"></div>`;
}

function creditHighlight(): string {
  return `
  <div style="background:linear-gradient(135deg,#fff7f5 0%,#fff0ed 100%);border:2px solid ${C.primary};border-radius:12px;padding:20px 24px;margin:24px 0;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.primary};">💰 Your Consultation Credit</p>
    <p style="margin:0;font-size:22px;font-weight:700;color:${C.dark};">₹999 OFF</p>
    <p style="margin:4px 0 0;font-size:13px;color:${C.muted};">Applied automatically on your first 1-on-1 plan purchase</p>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
//  1. CONSULTATION RECEIPT EMAIL
// ─────────────────────────────────────────────────────────────
export interface ConsultationReceiptData {
  firstName: string;
  paymentId: string;
  consultationId: string;
  purchasedAt: Date;
}

export function consultationReceiptEmailHtml(data: ConsultationReceiptData): string {
  const dateStr = data.purchasedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const invoiceNo = `FYZ-CONS-${data.paymentId.replace('pay_', '').slice(-8).toUpperCase()}`;

  const body = `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.primary};">✅ Consultation Confirmed</p>
    <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:${C.dark};line-height:1.2;">You're all set, ${data.firstName}! 🌸</h1>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      We've received your consultation booking and your payment of <strong>₹999</strong> has been confirmed. Our team will review your details and connect with you very soon.
    </p>

    ${divider()}

    <!-- Invoice mini -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.muted};">Invoice No.</td>
        <td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:13px;text-align:right;font-weight:700;color:${C.dark};">${invoiceNo}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.muted};">Date</td>
        <td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:13px;text-align:right;color:${C.dark};">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.muted};">Service</td>
        <td style="padding:8px 0;border-bottom:1px solid ${C.border};font-size:13px;text-align:right;color:${C.dark};">Personal Consultation Session</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;font-size:14px;font-weight:700;color:${C.dark};">Total Paid</td>
        <td style="padding:12px 0 0;font-size:20px;font-weight:700;text-align:right;color:${C.primary};">₹999</td>
      </tr>
    </table>

    ${divider()}

    ${creditHighlight()}

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      When you're ready to take your face yoga journey further, this <strong>₹999 credit will automatically apply</strong> to your first 1-on-1 plan — no coupon needed. Just select a plan and the discount is yours!
    </p>

    ${ctaButton('Go to My Consultation', EMAIL_CONFIG.consultation.consultationUrl)}

    ${divider()}
    <p style="margin:0 0 4px;font-size:15px;color:${C.dark};">With warmth,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${C.dark};">Simrat</p>
    <p style="margin:2px 0 0;font-size:13px;color:${C.muted};">Founder · ${EMAIL_CONFIG.brandName}</p>
  `;

  return baseLayout(body);
}

// ─────────────────────────────────────────────────────────────
//  2. CONSULTATION ACTIVATED EMAIL
// ─────────────────────────────────────────────────────────────
export interface ConsultationActivatedData {
  firstName: string;
  consultationId: string;
}

export function consultationActivatedEmailHtml(data: ConsultationActivatedData): string {
  const body = `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.primary};">💬 We're Ready for You</p>
    <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:${C.dark};line-height:1.2;">Your consultation is now live, ${data.firstName}! ✨</h1>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      Wonderful news! A member of our team has just activated your personal consultation. You can now chat with us directly — ask anything, share your concerns, or tell us about your face yoga goals.
    </p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      Our team is here to listen, guide, and help you understand what approach will work best specifically for your face and goals. There are no generic answers here — this is all about <em>you</em>.
    </p>

    ${ctaButton('Open My Consultation Chat', EMAIL_CONFIG.consultation.consultationUrl)}

    ${divider()}

    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${C.dark};">Things you can share with us:</p>
    <ul style="margin:0;padding-left:20px;">
      <li style="font-size:14px;line-height:1.8;color:${C.dark};">Your primary skin or face concerns</li>
      <li style="font-size:14px;line-height:1.8;color:${C.dark};">How long you've been practising face yoga</li>
      <li style="font-size:14px;line-height:1.8;color:${C.dark};">Your daily routine and lifestyle</li>
      <li style="font-size:14px;line-height:1.8;color:${C.dark};">Any photos you'd like to share for assessment</li>
    </ul>

    ${divider()}
    <p style="margin:0 0 4px;font-size:15px;color:${C.dark};">With care,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${C.dark};">The Faceyoguez Team</p>
    <p style="margin:2px 0 0;font-size:13px;color:${C.muted};">Your personal wellness guides</p>
  `;

  return baseLayout(body);
}

// ─────────────────────────────────────────────────────────────
//  3. CONSULTATION ZOOM INVITE EMAIL
// ─────────────────────────────────────────────────────────────
export interface ConsultationZoomData {
  firstName: string;
  joinUrl: string;
  password: string;
  startTime: string; // ISO string
  durationMinutes: number;
  topic: string;
}

export function consultationZoomEmailHtml(data: ConsultationZoomData): string {
  const date = new Date(data.startTime);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const body = `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.primary};">📅 Zoom Call Confirmed</p>
    <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:${C.dark};line-height:1.2;">See you soon, ${data.firstName}! 🌸</h1>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      Your face-to-face consultation call has been scheduled. We can't wait to speak with you and help you create a roadmap that's truly made for your unique face.
    </p>

    ${divider()}

    <!-- Call details card -->
    <div style="background-color:${C.background};border:1px solid ${C.border};border-radius:12px;padding:24px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">Call Details</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${C.muted};width:100px;">Topic</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:${C.dark};">${data.topic}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${C.muted};">Date</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:${C.dark};">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${C.muted};">Time</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:${C.dark};">${timeStr} (IST)</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${C.muted};">Duration</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:${C.dark};">${data.durationMinutes} minutes</td>
        </tr>
        ${data.password ? `<tr><td style="padding:6px 0;font-size:13px;color:${C.muted};">Password</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:${C.dark};font-family:monospace;">${data.password}</td></tr>` : ''}
      </table>
    </div>

    ${ctaButton('Join Zoom Meeting', data.joinUrl)}

    ${divider()}

    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:${C.dark};">
      💡 <strong>A few tips before your call:</strong>
    </p>
    <ul style="margin:0;padding-left:20px;">
      <li style="font-size:14px;line-height:1.8;color:${C.dark};">Join 2-3 minutes early to check your audio and video</li>
      <li style="font-size:14px;line-height:1.8;color:${C.dark};">Find a well-lit spot so we can see your face clearly</li>
      <li style="font-size:14px;line-height:1.8;color:${C.dark};">Have a mirror nearby if possible</li>
      <li style="font-size:14px;line-height:1.8;color:${C.dark};">Jot down your top 3 concerns beforehand</li>
    </ul>

    ${divider()}
    <p style="margin:0 0 4px;font-size:15px;color:${C.dark};">With warmth,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${C.dark};">Simrat</p>
    <p style="margin:2px 0 0;font-size:13px;color:${C.muted};">Founder · ${EMAIL_CONFIG.brandName}</p>
  `;

  return baseLayout(body);
}

// ─────────────────────────────────────────────────────────────
//  4. POST-CONSULTATION NUDGE EMAIL
// ─────────────────────────────────────────────────────────────
export interface ConsultationPostNudgeData {
  firstName: string;
  staffNotes?: string;
}

export function consultationPostNudgeEmailHtml(data: ConsultationPostNudgeData): string {
  const body = `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.primary};">🌸 Your Journey Awaits</p>
    <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:${C.dark};line-height:1.2;">It was so wonderful connecting with you, ${data.firstName} 💛</h1>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      Thank you for taking the time to have a conversation with us today. We loved learning about your face yoga journey, your goals, and what you're hoping to achieve. Every face has a story, and yours is beautiful.
    </p>

    ${data.staffNotes ? `
    <div style="background-color:${C.background};border-left:3px solid ${C.primary};border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">A note from your consultant</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:${C.dark};font-style:italic;">"${data.staffNotes}"</p>
    </div>
    ` : ''}

    ${divider()}

    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${C.dark};">
      Based on our conversation, we truly believe a <strong>personalised 1-on-1 plan</strong> can make a real, visible difference for you. And here's the thing — <strong>your ₹999 consultation fee is already credited</strong> toward your first plan!
    </p>

    ${creditHighlight()}

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      This credit is automatically applied when you choose any 1-on-1 plan. No codes, no steps — just choose your plan and the discount is already there waiting for you. 💛
    </p>

    ${divider()}

    <!-- Plan options teaser -->
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">Your Personalised Plans (with your credit applied)</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${[
        { plan: 'Plan 1 — Monthly', original: '₹5,499', discounted: '₹4,500', tag: 'Most Accessible' },
        { plan: 'Plan 2 — 3 Months', original: '₹11,000', discounted: '₹10,001', tag: '🌟 Best Value' },
        { plan: 'Plan 3 — 6 Months', original: '₹18,000', discounted: '₹17,001', tag: '60% OFF' },
        { plan: 'Plan 4 — 12 Months', original: '₹30,000', discounted: '₹29,001', tag: '70% OFF' },
      ].map(p => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.border};">
          <p style="margin:0;font-size:13px;font-weight:700;color:${C.dark};">${p.plan}</p>
          <p style="margin:2px 0 0;font-size:11px;color:${C.muted};">${p.tag}</p>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${C.border};text-align:right;">
          <p style="margin:0;font-size:15px;font-weight:700;color:${C.primary};">${p.discounted}</p>
          <p style="margin:2px 0 0;font-size:11px;color:${C.muted};text-decoration:line-through;">${p.original}</p>
        </td>
      </tr>`).join('')}
    </table>

    ${ctaButton('Claim My ₹999 Credit & Choose a Plan', EMAIL_CONFIG.consultation.plansUrl)}

    ${divider()}

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      There's no pressure, of course. But whenever you feel ready to take the next step, we'll be right here — with a plan designed around your specific needs, your pace, and your beautiful face. 🌸
    </p>

    <p style="margin:0 0 4px;font-size:15px;color:${C.dark};">With so much warmth,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${C.dark};">Simrat</p>
    <p style="margin:2px 0 0;font-size:13px;color:${C.muted};">Founder · ${EMAIL_CONFIG.brandName}</p>
  `;

  return baseLayout(body);
}
