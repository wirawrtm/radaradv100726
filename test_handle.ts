import fs from 'fs';
// We will mock getSheetValues, updateSheetValues and see if it works

const db = JSON.parse(fs.readFileSync('local_sheets_db.json', 'utf8'));

const getSheetValues = async (sheet: string) => db[sheet];
const updateSheetValues = async (sheet: string, data: any) => {
    db[sheet] = data;
    console.log("updateSheetValues called for", sheet);
    console.log("new row:", data[1]);
};

function findEmployeeDetails(pic: string, empData: any[]) {
    return { upline: "UP", area: "AREA" };
}
function getUserGroup() { return "GROUP"; }
function getUserProvince() { return "PROV"; }

async function handleUpdatePartner(body: any) {
  const data = await getSheetValues("channel");
  const headers = data[0];
  const idx = {
    pic: headers.findIndex((h: any) =>
      /pic|user|nama|analyst|solution/i.test(String(h).trim()),
    ),
    channel: headers.findIndex((h: any) =>
      /channel|kiosk|nama toko|toko|name/i.test(String(h).trim()),
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
  
  const rowNum = Number(body.id);
  console.log("rowNum:", rowNum, "data.length:", data.length);
  if (!isNaN(rowNum) && rowNum > 1 && rowNum <= data.length) {
    const empData = (await getSheetValues("employee")) || [];
    const empDetails = findEmployeeDetails(body.pic, empData);
    let userGroup = body.group || "";
    if (!userGroup) {
      userGroup = getUserGroup();
    }
    let userProvince = body.province || "";
    if (!userProvince) {
      userProvince = getUserProvince();
    }

    const rowIndex = rowNum - 1;
    if (idx.pic !== -1 && body.pic !== undefined) {
      data[rowIndex][idx.pic] = body.pic;
    }
    if (idx.upline !== -1) {
      data[rowIndex][idx.upline] = empDetails.upline || "";
    }
    const resolvedProv = userProvince || empDetails.area;
    if (idx.area !== -1 && resolvedProv) {
      data[rowIndex][idx.area] = resolvedProv;
    }
    if (idx.channel !== -1 && body.name !== undefined && body.name !== "") {
      data[rowIndex][idx.channel] = body.name;
    }
    if (idx.cat !== -1 && body.category !== undefined && body.category !== "") {
      data[rowIndex][idx.cat] = body.category;
    }
    if (idx.group !== -1 && userGroup) {
      data[rowIndex][idx.group] = userGroup;
    }

    await updateSheetValues("channel", data);
  }
}

handleUpdatePartner({
      id: 2,
      pic: "TEST",
      name: "TEST KIOSK",
      category: "R1",
      user: "Moh. Abu Amar"
});
