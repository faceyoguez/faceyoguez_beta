import nodemailer from 'nodemailer';
import { EMAIL_CONFIG } from './email/config';

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
 * Staff-composed messages (student/staff/instructor mail) all send through
 * the same authenticated account as everything else — a separate
 * "management@faceyoguez.com" identity previously existed here but sent
 * with a From address that didn't match the actual authenticated SMTP
 * account, which Gmail silently rejects. Kept as separate named exports so
 * call sites don't need to change, but both now just point at the one
 * working transporter/address.
 */
export const managementTransporter = transporter;

export const MANAGEMENT_EMAIL_ADDRESS = EMAIL_CONFIG.senderEmail;
