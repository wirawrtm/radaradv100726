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
    // 1. Fetch current employee sheet
    const empRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'employee!A1:I500',
    });
    const empData = empRes.data.values || [];
    
    // Check if Iing Mubarok is already there
    const hasIing = empData.some(row => String(row[0] || '').trim().toLowerCase() === 'iing mubarok');
    if (!hasIing) {
      console.log('Iing Mubarok not found in employee. Adding at the end...');
      const newEmpRow = [ 'Iing Mubarok', 'Business Solution', 'Vegetables', 'Agus Herdianto', 'West Java', 'West', 'IINGWEST', '123', '1' ];
      empData.push(newEmpRow);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'employee!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: empData },
      });
      console.log('Added Iing Mubarok successfully.');
    } else {
      console.log('Iing Mubarok already exists in employee.');
    }

    // 2. Fetch current channel sheet
    const chanRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'channel!A1:G2000',
    });
    const chanData = chanRes.data.values || [];
    
    // Check if Qqqq is already there
    const hasQqqq = chanData.some(row => String(row[0] || '').trim().toLowerCase() === 'qqqq');
    if (!hasQqqq) {
      console.log('Qqqq not found in channel. Adding at the end...');
      const newChanRow = [ 'Qqqq', '', 'Distributor', '', '', 'West Java', 'Iing Mubarok' ];
      chanData.push(newChanRow);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'channel!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: chanData },
      });
      console.log('Added Qqqq successfully.');
    } else {
      console.log('Qqqq already exists in channel.');
    }

  } catch (e) {
    console.error('Error recreating:', e);
  }
}

main();
