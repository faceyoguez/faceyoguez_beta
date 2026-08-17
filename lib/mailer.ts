import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Dedicated transporter for staff-composed messages that must appear to come
 * from management@faceyoguez.com, kept separate from the transactional
 * `transporter` above so it never touches SMTP_USER's send-as identity.
 *
 * Configure MANAGEMENT_SMTP_USER / MANAGEMENT_SMTP_PASSWORD to the actual
 * management@faceyoguez.com mailbox credentials (a Gmail App Password if it's
 * a Google Workspace mailbox). Falls back to the shared SMTP_* credentials
 * with the "From" header overridden — that only works if management@ is
 * already a verified "Send As" alias on that account, otherwise Gmail will
 * silently rewrite the From header or reject the send.
 */
export const managementTransporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  host: process.env.MANAGEMENT_SMTP_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.MANAGEMENT_SMTP_PORT || process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MANAGEMENT_SMTP_USER || process.env.SMTP_USER,
    pass: process.env.MANAGEMENT_SMTP_PASSWORD || process.env.SMTP_PASSWORD,
  },
});

export const MANAGEMENT_EMAIL_ADDRESS =
  process.env.MANAGEMENT_SMTP_USER || process.env.MANAGEMENT_EMAIL_ADDRESS || 'management@faceyoguez.com';
