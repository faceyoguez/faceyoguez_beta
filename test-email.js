require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function main() {
  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("Connection successful!");
    
    console.log("Attempting to send a test email...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // Send to self
      subject: "Test Email from Faceyoguez",
      text: "If you are reading this, the mailer is working.",
    });
    console.log("Email sent successfully: ", info.messageId);
  } catch (error) {
    console.error("Error occurred:");
    console.error(error);
  }
}

main();
