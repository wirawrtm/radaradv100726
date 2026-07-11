import { db } from './index.js';
import { employee, channel, working, dr, hybrid, access } from './schema.js';
import { sql } from 'drizzle-orm';

export const SHEET_HEADERS: Record<string, string[]> = {
  employee: ["Nama", "Email", "User", "Position", "Province", "Area", "Upline", "Password", "Level", "Group"],
  channel: ["Name", "PIC", "Category", "Province", "Area"],
  working: ["Timestamp", "Channel", "Name Checker", "Lot", "Quantity (kg)", "Aging (month)", "Exp Date", "Crops", "Condition", "Shipping Date", "POG", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des", "upd_jan", "upd_feb", "upd_mar", "upd_apr", "upd_mei", "upd_jun", "upd_jul", "upd_ags", "upd_sep", "upd_okt", "upd_nov", "upd_des"],
  dr: ["Lot No", "Date", "Qty", "Hybrid", "Crops"],
  hybrid: ["Material", "Hybrid", "Crops"],
  access: ["position", "home", "partner", "stock", "pog", "overview", "temp", "access"]
};

export async function getSheetFromDb(sheetName: string): Promise<any[][] | null> {
  let records: any[] = [];
  if (sheetName === 'employee') records = await db.select().from(employee).orderBy(employee.id);
  else if (sheetName === 'channel') records = await db.select().from(channel).orderBy(channel.id);
  else if (sheetName === 'working') records = await db.select().from(working).orderBy(working.id);
  else if (sheetName === 'dr') records = await db.select().from(dr).orderBy(dr.id);
  else if (sheetName === 'hybrid') records = await db.select().from(hybrid).orderBy(hybrid.id);
  else if (sheetName === 'access') records = await db.select().from(access).orderBy(access.id);
  else return null;

  const headers = SHEET_HEADERS[sheetName];
  if (!headers) return null;

  const arr: any[][] = [headers];
  for (const row of records) {
    if (sheetName === 'employee') arr.push([row.nama, row.email, row.user, row.position, row.province, row.area, row.upline, row.password, row.level, row.group]);
    else if (sheetName === 'channel') arr.push([row.name, row.pic, row.category, row.province, row.area]);
    else if (sheetName === 'working') arr.push([row.timestamp, row.channel, row.nameChecker, row.lot, row.quantityKg, row.agingMonth, row.expDate, row.crops, row.condition, row.shippingDate, row.pog, row.jan, row.feb, row.mar, row.apr, row.mei, row.jun, row.jul, row.ags, row.sep, row.okt, row.nov, row.des, row.upd_jan, row.upd_feb, row.upd_mar, row.upd_apr, row.upd_mei, row.upd_jun, row.upd_jul, row.upd_ags, row.upd_sep, row.upd_okt, row.upd_nov, row.upd_des]);
    else if (sheetName === 'dr') arr.push([row.lotNo, row.date, row.qty, row.hybrid, row.crops]);
    else if (sheetName === 'hybrid') arr.push([row.material, row.hybrid, row.crops]);
    else if (sheetName === 'access') arr.push([row.position, row.home, row.partner, row.stock, row.pog, row.overview, row.temp, row.accessLevel]);
  }
  return arr;
}

export async function updateSheetInDb(sheetName: string, data: any[][]) {
  if (data.length <= 1) return; // Only headers or empty

  const records = data.slice(1);
  if (sheetName === 'employee') {
    await db.delete(employee);
    const inserts = records.map(row => ({
      nama: String(row[0]||''), email: String(row[1]||''), user: String(row[2]||''), position: String(row[3]||''), province: String(row[4]||''), area: String(row[5]||''), upline: String(row[6]||''), password: String(row[7]||''), level: String(row[8]||''), group: String(row[9]||'')
    }));
    for (let i = 0; i < inserts.length; i+=100) await db.insert(employee).values(inserts.slice(i, i+100));
  } else if (sheetName === 'channel') {
    await db.delete(channel);
    const inserts = records.map(row => ({
      name: String(row[0]||''), pic: String(row[1]||''), category: String(row[2]||''), province: String(row[3]||''), area: String(row[4]||'')
    }));
    for (let i = 0; i < inserts.length; i+=100) await db.insert(channel).values(inserts.slice(i, i+100));
  } else if (sheetName === 'working') {
    await db.delete(working);
    const inserts = records.map(row => ({
      timestamp: String(row[0]||''), channel: String(row[1]||''), nameChecker: String(row[2]||''), lot: String(row[3]||''), quantityKg: String(row[4]||''), agingMonth: String(row[5]||''), expDate: String(row[6]||''), crops: String(row[7]||''), condition: String(row[8]||''), shippingDate: String(row[9]||''), pog: String(row[10]||''), jan: String(row[11]||''), feb: String(row[12]||''), mar: String(row[13]||''), apr: String(row[14]||''), mei: String(row[15]||''), jun: String(row[16]||''), jul: String(row[17]||''), ags: String(row[18]||''), sep: String(row[19]||''), okt: String(row[20]||''), nov: String(row[21]||''), des: String(row[22]||''), upd_jan: String(row[23]||''), upd_feb: String(row[24]||''), upd_mar: String(row[25]||''), upd_apr: String(row[26]||''), upd_mei: String(row[27]||''), upd_jun: String(row[28]||''), upd_jul: String(row[29]||''), upd_ags: String(row[30]||''), upd_sep: String(row[31]||''), upd_okt: String(row[32]||''), upd_nov: String(row[33]||''), upd_des: String(row[34]||'')
    }));
    for (let i = 0; i < inserts.length; i+=100) await db.insert(working).values(inserts.slice(i, i+100));
  } else if (sheetName === 'dr') {
    await db.delete(dr);
    const inserts = records.map(row => ({
      lotNo: String(row[0]||''), date: String(row[1]||''), qty: String(row[2]||''), hybrid: String(row[3]||''), crops: String(row[4]||'')
    }));
    for (let i = 0; i < inserts.length; i+=100) await db.insert(dr).values(inserts.slice(i, i+100));
  } else if (sheetName === 'hybrid') {
    await db.delete(hybrid);
    const inserts = records.map(row => ({
      material: String(row[0]||''), hybrid: String(row[1]||''), crops: String(row[2]||'')
    }));
    for (let i = 0; i < inserts.length; i+=100) await db.insert(hybrid).values(inserts.slice(i, i+100));
  } else if (sheetName === 'access') {
    await db.delete(access);
    const inserts = records.map(row => ({
      position: String(row[0]||''), home: String(row[1]||''), partner: String(row[2]||''), stock: String(row[3]||''), pog: String(row[4]||''), overview: String(row[5]||''), temp: String(row[6]||''), accessLevel: String(row[7]||'')
    }));
    for (let i = 0; i < inserts.length; i+=100) await db.insert(access).values(inserts.slice(i, i+100));
  }
}

export async function appendRowToDb(sheetName: string, row: any[]) {
  if (sheetName === 'employee') {
    await db.insert(employee).values({
      nama: String(row[0]||''), email: String(row[1]||''), user: String(row[2]||''), position: String(row[3]||''), province: String(row[4]||''), area: String(row[5]||''), upline: String(row[6]||''), password: String(row[7]||''), level: String(row[8]||''), group: String(row[9]||'')
    });
  } else if (sheetName === 'channel') {
    await db.insert(channel).values({
      name: String(row[0]||''), pic: String(row[1]||''), category: String(row[2]||''), province: String(row[3]||''), area: String(row[4]||'')
    });
  } else if (sheetName === 'working') {
    await db.insert(working).values({
      timestamp: String(row[0]||''), channel: String(row[1]||''), nameChecker: String(row[2]||''), lot: String(row[3]||''), quantityKg: String(row[4]||''), agingMonth: String(row[5]||''), expDate: String(row[6]||''), crops: String(row[7]||''), condition: String(row[8]||''), shippingDate: String(row[9]||''), pog: String(row[10]||''), jan: String(row[11]||''), feb: String(row[12]||''), mar: String(row[13]||''), apr: String(row[14]||''), mei: String(row[15]||''), jun: String(row[16]||''), jul: String(row[17]||''), ags: String(row[18]||''), sep: String(row[19]||''), okt: String(row[20]||''), nov: String(row[21]||''), des: String(row[22]||''), upd_jan: String(row[23]||''), upd_feb: String(row[24]||''), upd_mar: String(row[25]||''), upd_apr: String(row[26]||''), upd_mei: String(row[27]||''), upd_jun: String(row[28]||''), upd_jul: String(row[29]||''), upd_ags: String(row[30]||''), upd_sep: String(row[31]||''), upd_okt: String(row[32]||''), upd_nov: String(row[33]||''), upd_des: String(row[34]||'')
    });
  } else if (sheetName === 'dr') {
    await db.insert(dr).values({
      lotNo: String(row[0]||''), date: String(row[1]||''), qty: String(row[2]||''), hybrid: String(row[3]||''), crops: String(row[4]||'')
    });
  } else if (sheetName === 'hybrid') {
    await db.insert(hybrid).values({
      material: String(row[0]||''), hybrid: String(row[1]||''), crops: String(row[2]||'')
    });
  } else if (sheetName === 'access') {
    await db.insert(access).values({
      position: String(row[0]||''), home: String(row[1]||''), partner: String(row[2]||''), stock: String(row[3]||''), pog: String(row[4]||''), overview: String(row[5]||''), temp: String(row[6]||''), accessLevel: String(row[7]||'')
    });
  }
}
