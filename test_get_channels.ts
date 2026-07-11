import fs from 'fs';

const db = JSON.parse(fs.readFileSync('local_sheets_db.json', 'utf8'));
const data = db.channel;
const headers = data[0];
const idx = {
    pic: headers.findIndex((h: any) =>
      /pic|user|nama|analyst|solution/i.test(String(h).trim()),
    ),
    channel: headers.findIndex((h: any) =>
      /channel|kiosk|nama toko|toko|name/i.test(String(h).trim()),
    ),
};
console.log(idx);
