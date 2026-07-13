import { config } from 'dotenv';
config({ path: '.env.local' });
import { transporter } from './lib/mailer';
import { sendBrandedMeetingInviteEmail, sendMeetingCancellationEmail } from './lib/email/sender';

async function run() {
  const testEmail = "joelsiby@gmail.com"; // Let's use a dummy but valid looking email to avoid actual bounce or maybe the user's email if they gave one? The user hasn't provided one. Let's send it to a local mock if possible, but actually we just want to see if the Promise resolves or throws.

  console.log("Testing cancelation email...");
  await sendMeetingCancellationEmail("test@example.com", {
    studentName: "Test Student",
    meetingTitle: "Test Meeting",
    meetingTimeStr: "2024-03-24T18:00:00Z",
    meetingType: "one_on_one"
  });
  console.log("Cancelation email done.");

  console.log("Testing invite email...");
  await sendBrandedMeetingInviteEmail("test@example.com", {
    studentName: "Test Student",
    instructorName: "Test Instructor",
    meetingTitle: "Test Meeting",
    meetingDate: "March 24, 2024",
    meetingTime: "6:00 PM",
    zoomLink: "https://zoom.us/j/123",
    zoomId: "123456789",
    zoomPassword: "pwd",
    calendarLink: "https://google.com",
    meetingType: "one_on_one"
  });
  console.log("Invite email done.");
}
run().catch(console.error);
