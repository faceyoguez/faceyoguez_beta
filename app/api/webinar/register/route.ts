import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Simple server-side validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, Email, and Phone fields are all required.' },
        { status: 400 }
      );
    }

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!sheetId) {
      console.error('Google Sheets config missing: GOOGLE_SHEET_ID is not defined in .env');
      return NextResponse.json(
        { error: 'Server configuration error: GOOGLE_SHEET_ID is missing.' },
        { status: 500 }
      );
    }

    if (!clientEmail || !privateKey) {
      console.error('Google Sheets config missing: GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY is not defined in .env');
      return NextResponse.json(
        { error: 'Server configuration error: Google service account credentials are missing.' },
        { status: 500 }
      );
    }

    // Initialize Google Auth client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Format timestamp in Indian Standard Time (IST)
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium',
    });

    // Append values to sheet (Columns: Timestamp, Name, Email, Phone)
    const values = [[timestamp, name, email, phone]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:D', // Appends to the first sheet automatically
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error writing to Google Sheet:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit registration. Please try again.' },
      { status: 500 }
    );
  }
}
