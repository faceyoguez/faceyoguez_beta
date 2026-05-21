require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testGoogleSheets() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    console.error("Missing Google Sheets config in .env.local!");
    console.log("Please set GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY.");
    process.exit(1);
  }

  console.log("Config detected:");
  console.log("- Sheet ID:", sheetId);
  console.log("- Client Email:", clientEmail);
  console.log("- Private Key length:", privateKey.length);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium',
    });

    const values = [[timestamp, "Test User", "test@example.com", "+91 99999 99999"]];

    console.log("Attempting to append row to A:D...");
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:D',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    console.log("Success! Row appended.");
    console.log("Response details:", response.data);
  } catch (error) {
    console.error("Google Sheets Test Failed:", error);
  }
}

testGoogleSheets();
