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
