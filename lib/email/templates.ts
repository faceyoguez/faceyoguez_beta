/**
 * ════════════════════════════════════════════════════════════════
 *  FACEYOGUEZ EMAIL TEMPLATES
 *  ─────────────────────────────────────────────────────────────
 *  All 3 transactional email HTML templates live here.
 *  Brand config (colors, links, copy) is pulled from ./config.ts
 *  so you never need to touch these unless you want layout changes.
 * ════════════════════════════════════════════════════════════════
 */

import { EMAIL_CONFIG, PLAN_LABELS } from './config';

const C = EMAIL_CONFIG.colors;

// ── Shared base layout ─────────────────────────────────────────
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
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${EMAIL_CONFIG.brandName}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${C.background};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:${C.cardBg};border-radius:16px 16px 0 0;padding:32px 40px 24px;border-bottom:1px solid ${C.border};text-align:left;">
              ${logo}
              <p style="margin:4px 0 0;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:${C.muted};">${EMAIL_CONFIG.tagline}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:${C.cardBg};padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:${C.cardBg};border-radius:0 0 16px 16px;padding:24px 40px 32px;border-top:1px solid ${C.border};">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:12px;color:${C.muted};">
                      Questions? Reply to this email or reach us at
                      <a href="mailto:${EMAIL_CONFIG.replyTo}" style="color:${C.primary};text-decoration:none;">${EMAIL_CONFIG.replyTo}</a>
                    </p>
                    <p style="margin:0 0 6px;font-size:12px;color:${C.muted};">
                      <a href="${EMAIL_CONFIG.social.instagram}" style="color:${C.muted};text-decoration:none;">Instagram</a>
                      &nbsp;·&nbsp;
                      <a href="${EMAIL_CONFIG.social.whatsapp}" style="color:${C.muted};text-decoration:none;">WhatsApp</a>
                    </p>
                    ${addressLine ? `<p style="margin:0;font-size:11px;color:${C.muted};">${addressLine}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Reusable sub-components ────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
//  1. WELCOME EMAIL
// ─────────────────────────────────────────────────────────────
export function welcomeEmailHtml(firstName: string): string {
  const cfg = EMAIL_CONFIG.welcome;

  const steps = cfg.nextSteps
    .map((step, i) => `
      <tr>
        <td style="padding:10px 0;vertical-align:top;">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="width:28px;vertical-align:top;padding-top:1px;">
                <div style="width:22px;height:22px;border-radius:50%;background-color:${C.primary};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px;">${i + 1}</div>
              </td>
              <td style="padding-left:12px;font-size:14px;color:${C.dark};line-height:1.6;">${step}</td>
            </tr>
          </table>
        </td>
      </tr>`)
    .join('');

  const body = `
    <!-- Greeting -->
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.primary};">✨ Welcome to your sanctuary</p>
    <h1 style="margin:0 0 20px;font-size:28px;font-weight:700;color:${C.dark};line-height:1.2;">Hello, ${firstName} 🌸</h1>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      We are so glad you're here. Faceyoguez was built for women who believe that true radiance starts from within — and with consistent, joyful practice, your face reflects that light.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      You've just taken the first step on a journey that thousands of women have walked before you — and come out the other side glowing, confident, and transformed.
    </p>

    ${divider()}

    <!-- Next steps -->
    <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">${cfg.nextStepHeading}</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${steps}
    </table>

    ${ctaButton(cfg.ctaText, cfg.ctaUrl)}

    ${divider()}

    <!-- Sign-off -->
    <p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:${C.dark};">With warmth,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${C.dark};">Simrat</p>
    <p style="margin:2px 0 0;font-size:13px;color:${C.muted};">Founder · ${EMAIL_CONFIG.brandName}</p>
  `;

  return baseLayout(body);
}

// ─────────────────────────────────────────────────────────────
//  2. INVOICE EMAIL
// ─────────────────────────────────────────────────────────────
export interface InvoiceData {
  firstName: string;
  planType: string;
  planVariant: string;
  amount: number;
  paymentId: string;
  orderId: string;
  purchasedAt: Date;
  couponCode?: string | null;
  couponDiscount?: number;
  durationMonths?: number;
}

export function invoiceEmailHtml(data: InvoiceData): string {
  const cfg = EMAIL_CONFIG.invoice;
  const planLabel = PLAN_LABELS[data.planType] || data.planType;
  const invoiceNumber = `FYZ-${data.paymentId.replace('pay_', '').slice(-8).toUpperCase()}`;
  const dateStr = data.purchasedAt.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const originalAmount = data.couponDiscount
    ? Math.round(data.amount / (1 - data.couponDiscount / 100))
    : data.amount;
  const discountAmount = originalAmount - data.amount;

  const rows = [
    { label: planLabel, detail: `${data.planVariant} · ${data.durationMonths || 1} month${(data.durationMonths || 1) > 1 ? 's' : ''}`, amount: `₹${originalAmount.toLocaleString('en-IN')}` },
    ...(data.couponCode ? [{ label: `Coupon: ${data.couponCode}`, detail: `${data.couponDiscount}% off`, amount: `−₹${discountAmount.toLocaleString('en-IN')}` }] : []),
  ];

  const rowHtml = rows.map(row => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${C.border};">
        <p style="margin:0;font-size:14px;font-weight:600;color:${C.dark};">${row.label}</p>
        <p style="margin:2px 0 0;font-size:12px;color:${C.muted};">${row.detail}</p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${C.border};text-align:right;font-size:14px;font-weight:600;color:${C.dark};">${row.amount}</td>
    </tr>`).join('');

  const body = `
    <!-- Invoice header -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.primary};">Payment Confirmed 🎉</p>
          <h1 style="margin:0;font-size:26px;font-weight:700;color:${C.dark};">Invoice</h1>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">Invoice No.</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:${C.dark};">${invoiceNumber}</p>
          <p style="margin:4px 0 0;font-size:12px;color:${C.muted};">${dateStr}</p>
        </td>
      </tr>
    </table>

    ${divider()}

    <!-- Billed to -->
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">Billed to</p>
    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${C.dark};">${data.firstName}</p>

    ${divider()}

    <!-- Line items -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <th style="text-align:left;padding-bottom:10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};border-bottom:2px solid ${C.border};">Description</th>
        <th style="text-align:right;padding-bottom:10px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};border-bottom:2px solid ${C.border};">Amount</th>
      </tr>
      ${rowHtml}
      <!-- Total -->
      <tr>
        <td style="padding:16px 0 0;">
          <p style="margin:0;font-size:14px;font-weight:700;color:${C.dark};">Total Paid</p>
        </td>
        <td style="padding:16px 0 0;text-align:right;">
          <p style="margin:0;font-size:20px;font-weight:700;color:${C.primary};">₹${data.amount.toLocaleString('en-IN')}</p>
        </td>
      </tr>
    </table>

    ${divider()}

    <!-- Payment reference -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td style="padding:0 0 6px;">
          <p style="margin:0;font-size:12px;color:${C.muted};">Payment ID</p>
          <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:${C.dark};font-family:monospace;">${data.paymentId}</p>
        </td>
      </tr>
    </table>

    ${divider()}

    <!-- Note -->
    <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${C.dark};">${cfg.note}</p>
    <p style="margin:0;font-size:13px;color:${C.muted};">${cfg.supportText}</p>

    ${ctaButton('Go to My Dashboard', EMAIL_CONFIG.dashboardUrl)}

    ${divider()}
    <p style="margin:0 0 4px;font-size:15px;color:${C.dark};">With warmth,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${C.dark};">Simrat</p>
    <p style="margin:2px 0 0;font-size:13px;color:${C.muted};">Founder · ${EMAIL_CONFIG.brandName}</p>
  `;

  return baseLayout(body);
}

// ─────────────────────────────────────────────────────────────
//  3. FEEDBACK THANK-YOU EMAIL
// ─────────────────────────────────────────────────────────────
export interface FeedbackEmailData {
  firstName: string;
  rating?: number;
  comments: string;
  planTaken: string;
}

export function feedbackEmailHtml(data: FeedbackEmailData): string {
  const cfg = EMAIL_CONFIG.feedback;

  const stars = data.rating
    ? Array.from({ length: 5 }, (_, i) =>
        `<span style="font-size:18px;color:${i < data.rating! ? '#FFB800' : C.border};">★</span>`
      ).join('')
    : '';

  const body = `
    <!-- Greeting -->
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${C.primary};">🌸 Thank You</p>
    <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:${C.dark};line-height:1.2;">Your feedback means everything to us</h1>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      Dear ${data.firstName},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${C.dark};">
      ${cfg.closingMessage}
    </p>

    ${divider()}

    <!-- Feedback summary card -->
    <div style="background-color:${C.background};border-radius:12px;padding:20px 24px;border:1px solid ${C.border};">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">Your Feedback Summary</p>
      ${stars ? `<p style="margin:0 0 10px;">${stars}</p>` : ''}
      <p style="margin:0 0 6px;font-size:12px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Plan</p>
      <p style="margin:0 0 14px;font-size:14px;color:${C.dark};">${PLAN_LABELS[data.planTaken] || data.planTaken}</p>
      <p style="margin:0 0 6px;font-size:12px;color:${C.muted};text-transform:uppercase;letter-spacing:0.1em;font-weight:700;">Your Words</p>
      <p style="margin:0;font-size:14px;color:${C.dark};line-height:1.6;font-style:italic;">"${data.comments}"</p>
    </div>

    ${divider()}

    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:${C.dark};">
      We're constantly evolving Faceyoguez to be the best possible space for your transformation. Your voice directly shapes that journey.
    </p>

    <!-- Sign-off from config -->
    <p style="margin:0;font-size:15px;line-height:1.8;color:${C.dark};white-space:pre-line;">${cfg.signOff}</p>

    ${divider()}
    <p style="margin:0;font-size:13px;color:${C.muted};">
      Want to continue your journey?
      <a href="${EMAIL_CONFIG.dashboardUrl}" style="color:${C.primary};font-weight:600;text-decoration:none;">Visit your dashboard →</a>
    </p>
  `;

  return baseLayout(body);
}
