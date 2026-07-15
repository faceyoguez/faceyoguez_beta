require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const fs = require('fs');

async function main() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    console.error("Missing Google Sheets config");
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:Z',
    });

    const rows = res.data.values;
    if (rows) {
      fs.writeFileSync('scratch/sheet_rows.json', JSON.stringify(rows, null, 2));
      console.log(`Saved ${rows.length} rows to scratch/sheet_rows.json`);
    }
  } catch (error) {
    console.error("Failed:", error);
  }
}

main();
