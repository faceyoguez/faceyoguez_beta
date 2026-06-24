const path = require('path');
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

// 1. Setup mailer transporter (same as lib/mailer.ts)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Helper to calculate end date (simulating our modified code logic)
function calculateEndDate(startDate, durationMonths, planType) {
  const start = new Date(startDate);
  const end = new Date(start);
  if (planType === 'group_session') {
    if (durationMonths === 1) {
      end.setDate(start.getDate() + 40);
    } else if (durationMonths === 3) {
      end.setDate(start.getDate() + 110);
    } else {
      end.setMonth(start.getMonth() + (durationMonths || 1));
    }
  } else {
    end.setMonth(start.getMonth() + (durationMonths || 1));
  }
  return end.toISOString().split('T')[0];
}

async function testMain() {
  console.log("=== STARTING PURCHASE & EMAIL VERIFICATION TEST ===");

  // A. Verify Date Calculations for 1 month and 3 month group plans
  const baseDate = "2026-06-23";
  console.log(`\nBase Activation Date: ${baseDate}`);

  const test1Month = calculateEndDate(baseDate, 1, 'group_session');
  const expected1Month = "2026-08-02"; // 23 June + 40 days = 2 August
  console.log(`1-Month Group Plan duration (40 days): ${test1Month}`);
  if (test1Month === expected1Month) {
    console.log("✅ 1-Month Group Plan duration calculation is correct!");
  } else {
    console.error(`❌ 1-Month Group Plan duration calculation failed. Expected: ${expected1Month}, Got: ${test1Month}`);
  }

  const test3Month = calculateEndDate(baseDate, 3, 'group_session');
  const expected3Month = "2026-10-11"; // 23 June + 110 days = 11 October
  console.log(`3-Month Group Plan duration (110 days): ${test3Month}`);
  if (test3Month === expected3Month) {
    console.log("✅ 3-Month Group Plan duration calculation is correct!");
  } else {
    console.error(`❌ 3-Month Group Plan duration calculation failed. Expected: ${expected3Month}, Got: ${test3Month}`);
  }

  // B. Verify SMTP connection & send a test invoice email
  console.log("\nVerifying SMTP mail server connection...");
  try {
    await transporter.verify();
    console.log("✅ SMTP Connection successful!");

    if (!process.env.SMTP_USER) {
      console.warn("⚠️ SMTP_USER is not configured. Skipping test email sending.");
      return;
    }

    console.log(`Attempting to send test invoice email to: ${process.env.SMTP_USER}...`);
    const info = await transporter.sendMail({
      from: `"Faceyoguez Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: "🔔 Test Invoice: Group Session 1 Month Plan Activation",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #FF8A75; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #FF8A75;">Faceyoguez Purchase Confirmation</h2>
          <p>Hi Test User,</p>
          <p>Your <strong>Face Yoga 21-Day Transformation (Group Session)</strong> plan has been successfully activated.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <table style="width: 100%; font-size: 14px;">
            <tr><td><strong>Plan:</strong></td><td>Group Session - 1 Month (40 Days Access)</td></tr>
            <tr><td><strong>Amount:</strong></td><td>₹1,499.00</td></tr>
            <tr><td><strong>Start Date:</strong></td><td>${baseDate}</td></tr>
            <tr><td><strong>End Date:</strong></td><td>${test1Month}</td></tr>
            <tr><td><strong>Payment ID:</strong></td><td>pay_test_dummy123</td></tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #777;">This is a automated test verification email from Antigravity.</p>
        </div>
      `,
    });
    console.log("✅ Test email sent successfully! Message ID:", info.messageId);

  } catch (smtpError) {
    console.error("❌ SMTP connection or mail sending failed:");
    console.error(smtpError);
  }
}

testMain();
