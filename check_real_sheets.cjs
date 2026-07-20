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

async function run() {
  try {
    const resWorking = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'working!A1:O100', // Let's check first 100 rows
    });
    const workingRows = resWorking.data.values || [];
    console.log('Total working rows in Google Sheet:', workingRows.length);
    if (workingRows.length > 0) {
      console.log('Working Headers:', workingRows[0]);
      console.log('First data row:', workingRows[1]);
    }

    const resChannel = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'channel!A1:O100',
    });
    const channelRows = resChannel.data.values || [];
    console.log('Total channel rows in Google Sheet:', channelRows.length);
    if (channelRows.length > 0) {
      console.log('Channel Headers:', channelRows[0]);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
