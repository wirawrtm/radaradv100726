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

const sheetNames = [ 'employee', 'access', 'channel', 'working', 'dr', 'hybrid', 'Sales' ];

async function main() {
  console.log('Starting full database health check...\n');
  
  for (const sheetName of sheetNames) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z5000`,
      });
      const data = res.data.values || [];
      if (data.length === 0) {
        console.log(`[${sheetName}] Sheet is empty!\n`);
        continue;
      }
      
      const headers = data[0];
      console.log(`[${sheetName}] Found ${data.length} rows (including headers). Columns:`, headers);
      
      let errorCount = 0;
      let emptyCount = 0;
      
      for (let r = 1; r < data.length; r++) {
        const row = data[r];
        for (let c = 0; c < headers.length; c++) {
          const val = row[c];
          const valStr = String(val || '').trim();
          
          if (valStr.startsWith('#ERROR!') || valStr.startsWith('#REF!') || valStr.startsWith('#VALUE!') || valStr.startsWith('#N/A')) {
            console.log(`  -> [ERROR] Row ${r + 1}, Col ${c + 1} (${headers[c]}): Value is '${valStr}'`);
            errorCount++;
          }
          if (c === 0 && valStr === '') {
            console.log(`  -> [EMPTY PRIMARY KEY] Row ${r + 1}, Col 1 (${headers[0]}) is empty!`);
            emptyCount++;
          }
        }
      }
      
      console.log(`[${sheetName}] Scan complete. Errors: ${errorCount}, Empty primary keys: ${emptyCount}\n`);
    } catch (e) {
      console.error(`[${sheetName}] Failed to scan:`, e.message);
    }
  }
}

main();
