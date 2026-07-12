const { google } = require('googleapis');

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function main() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sales!A1:R15',
    });
    const rows = res.data.values || [];
    console.log('Headers:', rows[0]);
    rows.slice(1, 10).forEach((row, i) => {
      console.log(`Row ${i + 2}:`, row);
    });
  } catch (e) {
    console.error(e);
  }
}

main();
