import fs from 'fs';
const db = JSON.parse(fs.readFileSync('local_sheets_db.json', 'utf8'));

const getSheetValues = async (sheet: string) => db[sheet];
const updateSheetValues = async (sheet: string, data: any) => {
    db[sheet] = data;
    console.log("updateSheetValues called for", sheet);
    console.log("deleted? length is now", data.length);
};

async function handleDeletePartner(body: any) {
  const data = await getSheetValues("channel");
  if (!data) throw new Error("Sheet 'channel' tidak ditemukan");
  const rowNum = Number(body.id);
  console.log("rowNum:", rowNum, "data.length:", data.length);
  if (!isNaN(rowNum) && rowNum > 1 && rowNum <= data.length) {
    data.splice(rowNum - 1, 1);
    await updateSheetValues("channel", data);
  }
}

handleDeletePartner({ id: 3 });
