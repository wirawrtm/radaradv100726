import fs from 'fs';
const db = JSON.parse(fs.readFileSync('local_sheets_db.json', 'utf8'));
const headers = db.channel[0];
const idx = {
    pic: headers.findIndex((h: any) =>
      /pic|user|nama|analyst|solution/i.test(String(h).trim()),
    ),
    channel: headers.findIndex((h: any) =>
      /channel|kiosk|nama toko|toko/i.test(String(h).trim()),
    ),
    cat: headers.findIndex((h: any) =>
      /kategori|category|klasifikasi|^cat$/i.test(String(h).trim()),
    ),
    upline: headers.findIndex((h: any) =>
      /upline|spv|supervisor/i.test(String(h).trim()),
    ),
    area: headers.findIndex((h: any) =>
      /area|provinsi|province|wilayah/i.test(String(h).trim()),
    ),
    group: headers.findIndex((h: any) =>
      /group|tim|divisi|division/i.test(String(h).trim()),
    ),
};
console.log(headers);
console.log(idx);
