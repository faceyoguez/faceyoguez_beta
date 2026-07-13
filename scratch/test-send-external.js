require('dotenv').config({ path: '.env.local' });
const { transporter } = require('../lib/mailer');

async function main() {
  const externalEmail = 'joellsiby@gmail.com'; // Try sending to Joel's email
  console.log(`Testing SMTP send to external recipient: ${externalEmail}`);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: externalEmail,
      subject: "Test External Email from Faceyoguez",
      text: "Testing SMTP relay to external domains. Please let us know if you receive this.",
    });
    console.log("External email sent successfully!", info.messageId);
  } catch (error) {
    console.error("External email send failed:");
    console.error(error);
  } finally {
    transporter.close();
  }
}

main().catch(console.error);
