/**
 * GOOGLE APPS SCRIPT - code.gs
 * 
 * SCRIPT UNTUK MAKSIMALKAN PENAMBAHAN, UPDATE, DAN PENGHAPUSAN PARTNER
 * LANGSUNG DARI GOOGLE SPREADSHEET APPS SCRIPT.
 * 
 * Petunjuk Penggunaan:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu "Ekstensi" > "Apps Script" (Extensions > Apps Script).
 * 3. Hapus kode lama atau tambahkan fungsi-fungsi di bawah ini ke dalam editor Apps Script Anda.
 * 4. Klik ikon Simpan (Save).
 * 5. Klik "Terapkan" > "Penerapan baru" (Deploy > New deployment).
 * 6. Pilih jenis penerapan: "Aplikasi Web" (Web app).
 * 7. Konfigurasikan:
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)
 * 8. Klik "Terapkan" (Deploy), setujui izin jika diminta, lalu salin URL Aplikasi Web yang diberikan.
 */

// Helper: Membersihkan string agar pencocokan nama partner lebih akurat (case-insensitive & mengabaikan spasi/simbol)
function cleanForMatch(val) {
  if (!val) return "";
  return String(val)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Handle POST Requests
 */
function doPost(e) {
  var result = {};
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else {
      throw new Error("Tidak ada data postData yang diterima.");
    }
    
    var action = body.action;
    
    if (action === "addPartner") {
      result = handleAddPartner(body);
    } else if (action === "updatePartner") {
      result = handleUpdatePartner(body);
    } else if (action === "deletePartner") {
      result = handleDeletePartner(body);
    } else {
      result = { 
        status: "error", 
        message: "Aksi '" + action + "' belum diimplementasikan di Google Apps Script ini." 
      };
    }
  } catch (err) {
    result = { 
      status: "error", 
      message: "Gagal memproses request: " + err.toString() 
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle GET Requests - Routes read requests to the appropriate Google Sheets reader
 */
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  var user = e && e.parameter && e.parameter.user || "";
  var lot = e && e.parameter && e.parameter.lot || "";
  
  var result = {};
  
  try {
    if (!action) {
      result = {
        status: "success",
        message: "Google Apps Script aktif dan terhubung dengan sukses!"
      };
    } else if (action === "getWorkingData") {
      result = handleGetWorkingData(user);
    } else if (action === "getChannels") {
      result = handleGetChannels(user);
    } else if (action === "getDrSalesData") {
      result = handleGetDrSalesData(user);
    } else if (action === "getLotInfo") {
      result = handleGetLotInfo(lot);
    } else if (action === "getUserProfile") {
      result = handleGetUserProfile(user);
    } else if (action === "getEmployees") {
      result = handleGetEmployees();
    } else if (action === "getInitialData") {
      result = handleGetInitialData(user);
    } else if (action === "getAccessRules") {
      result = handleGetAccessRules();
    } else {
      result = {
        status: "error",
        message: "Aksi '" + action + "' belum diimplementasikan di Google Apps Script ini."
      };
    }
  } catch (err) {
    result = {
      status: "error",
      message: "Gagal memproses request GET: " + err.toString()
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tambah Partner Baru (Atau update jika nama partner sudah ada)
 */
function handleAddPartner(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("channel");
  if (!sheet) {
    return { status: "error", message: "Sheet 'channel' tidak ditemukan." };
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var idxPic = -1;
  var idxChannel = -1;
  var idxCat = -1;
  var idxProvince = -1;
  var idxArea = -1;
  
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (/pic|user|nama|analyst|solution/i.test(h)) idxPic = i;
    if (/channel|kiosk|nama toko|toko|name|distributor|partner|mitra/i.test(h)) idxChannel = i;
    if (/kategori|category|klasifikasi|^cat$/i.test(h)) idxCat = i;
    if (/provinsi|province/i.test(h)) idxProvince = i;
    if (/^area$/i.test(h)) idxArea = i;
  }
  
  if (idxChannel === -1) {
    return { status: "error", message: "Kolom nama partner tidak ditemukan di header sheet 'channel'." };
  }
  
  // Mencegah duplikasi: Jika partner sudah ada, langsung perbarui baris yang ada
  if (body.name) {
    var cleanNewName = cleanForMatch(body.name);
    var existingIndex = -1;
    for (var r = 1; r < data.length; r++) {
      if (cleanForMatch(data[r][idxChannel]) === cleanNewName) {
        existingIndex = r;
        break;
      }
    }
    
    if (existingIndex !== -1) {
      var userProvince = body.province || "";
      var userArea = "";
      
      // Cari data wilayah berdasarkan kecocokan PIC lain
      if (body.pic && data.length > 1) {
        var cleanPic = cleanForMatch(body.pic);
        for (var r = 1; r < data.length; r++) {
          if (r !== existingIndex && idxPic !== -1 && cleanForMatch(data[r][idxPic]) === cleanPic) {
            if (idxProvince !== -1 && data[r][idxProvince]) {
              userProvince = String(data[r][idxProvince]).trim();
            }
            if (idxArea !== -1 && data[r][idxArea]) {
              userArea = String(data[r][idxArea]).trim();
            }
            break;
          }
        }
      }
      
      // Update data sel partner yang ada
      if (idxPic !== -1 && body.pic !== undefined) {
        sheet.getRange(existingIndex + 1, idxPic + 1).setValue(body.pic);
      }
      if (idxProvince !== -1 && userProvince) {
        sheet.getRange(existingIndex + 1, idxProvince + 1).setValue(userProvince);
      }
      if (idxArea !== -1 && userArea) {
        sheet.getRange(existingIndex + 1, idxArea + 1).setValue(userArea);
      }
      if (idxCat !== -1 && body.category !== undefined && body.category !== "") {
        sheet.getRange(existingIndex + 1, idxCat + 1).setValue(body.category);
      }
      
      return {
        status: "success",
        id: existingIndex + 1,
        message: "Partner '" + body.name + "' sudah ada di database, data berhasil diperbarui."
      };
    }
  }
  
  // Mencari wilayah berdasarkan PIC jika menambahkan partner baru
  var userProvince = body.province || "";
  var userArea = "";
  
  if (body.pic && data.length > 1) {
    var cleanPic = cleanForMatch(body.pic);
    for (var r = 1; r < data.length; r++) {
      if (idxPic !== -1 && cleanForMatch(data[r][idxPic]) === cleanPic) {
        if (idxProvince !== -1 && data[r][idxProvince]) {
          userProvince = String(data[r][idxProvince]).trim();
        }
        if (idxArea !== -1 && data[r][idxArea]) {
          userArea = String(data[r][idxArea]).trim();
        }
        break;
      }
    }
  }
  
  // Buat baris baru sesuai urutan header
  var newRow = [];
  for (var i = 0; i < headers.length; i++) {
    newRow.push("");
  }
  
  if (idxChannel !== -1) newRow[idxChannel] = body.name || "";
  if (idxCat !== -1) newRow[idxCat] = body.category || "";
  if (idxPic !== -1) newRow[idxPic] = body.pic || "";
  if (idxProvince !== -1) newRow[idxProvince] = userProvince || "";
  if (idxArea !== -1) newRow[idxArea] = userArea || "";
  
  sheet.appendRow(newRow);
  
  var newId = data.length + 1; // ID baris baru di spreadsheet
  return {
    status: "success",
    id: newId,
    message: "Partner '" + body.name + "' berhasil ditambahkan!"
  };
}

/**
 * Edit / Update Partner
 */
function handleUpdatePartner(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("channel");
  if (!sheet) {
    return { status: "error", message: "Sheet 'channel' tidak ditemukan." };
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var idxPic = -1;
  var idxChannel = -1;
  var idxCat = -1;
  var idxProvince = -1;
  var idxArea = -1;
  
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (/pic|user|nama|analyst|solution/i.test(h)) idxPic = i;
    if (/channel|kiosk|nama toko|toko|name|distributor|partner|mitra/i.test(h)) idxChannel = i;
    if (/kategori|category|klasifikasi|^cat$/i.test(h)) idxCat = i;
    if (/provinsi|province/i.test(h)) idxProvince = i;
    if (/^area$/i.test(h)) idxArea = i;
  }
  
  var rowIndex = -1;
  var rowNum = Number(body.id);
  
  // 1. Validasi via Row Number (ID baris)
  if (!isNaN(rowNum) && rowNum > 1 && rowNum <= data.length) {
    var potentialRow = data[rowNum - 1];
    if (potentialRow && idxChannel !== -1) {
      var currentClean = cleanForMatch(potentialRow[idxChannel]);
      var cleanOrig = body.originalName ? cleanForMatch(body.originalName) : "";
      var cleanName = body.name ? cleanForMatch(body.name) : "";
      
      if (cleanOrig && currentClean === cleanOrig) {
        rowIndex = rowNum - 1;
      } else if (cleanName && currentClean === cleanName) {
        rowIndex = rowNum - 1;
      }
    }
  }
  
  // 2. Fallback pencarian berdasarkan nama asli
  if (rowIndex === -1 && body.originalName && idxChannel !== -1) {
    var targetClean = cleanForMatch(body.originalName);
    for (var r = 1; r < data.length; r++) {
      if (cleanForMatch(data[r][idxChannel]) === targetClean) {
        rowIndex = r;
        break;
      }
    }
  }
  
  // 3. Fallback pencarian berdasarkan nama baru
  if (rowIndex === -1 && body.name && idxChannel !== -1) {
    var targetClean = cleanForMatch(body.name);
    for (var r = 1; r < data.length; r++) {
      if (cleanForMatch(data[r][idxChannel]) === targetClean) {
        rowIndex = r;
        break;
      }
    }
  }
  
  if (rowIndex > 0 && rowIndex < data.length) {
    var userProvince = body.province || "";
    var userArea = "";
    
    // Tarik data wilayah berdasarkan PIC
    if (body.pic && data.length > 1) {
      var cleanPic = cleanForMatch(body.pic);
      for (var r = 1; r < data.length; r++) {
        if (r !== rowIndex && idxPic !== -1 && cleanForMatch(data[r][idxPic]) === cleanPic) {
          if (idxProvince !== -1 && data[r][idxProvince]) {
            userProvince = String(data[r][idxProvince]).trim();
          }
          if (idxArea !== -1 && data[r][idxArea]) {
            userArea = String(data[r][idxArea]).trim();
          }
          break;
        }
      }
    }
    
    // Simpan perubahan ke baris partner
    if (idxPic !== -1 && body.pic !== undefined) {
      sheet.getRange(rowIndex + 1, idxPic + 1).setValue(body.pic);
    }
    if (idxProvince !== -1) {
      var nextProvince = userProvince || data[rowIndex][idxProvince] || "";
      sheet.getRange(rowIndex + 1, idxProvince + 1).setValue(nextProvince);
    }
    if (idxArea !== -1) {
      var nextArea = userArea || data[rowIndex][idxArea] || "";
      sheet.getRange(rowIndex + 1, idxArea + 1).setValue(nextArea);
    }
    if (idxChannel !== -1 && body.name !== undefined && body.name !== "") {
      sheet.getRange(rowIndex + 1, idxChannel + 1).setValue(body.name);
    }
    if (idxCat !== -1 && body.category !== undefined && body.category !== "") {
      sheet.getRange(rowIndex + 1, idxCat + 1).setValue(body.category);
    }
    
    return { 
      status: "success", 
      message: "Partner '" + body.name + "' berhasil diperbarui!" 
    };
  } else {
    // Jika tidak ditemukan sama sekali, tambahkan partner baru
    return handleAddPartner(body);
  }
}

/**
 * Hapus Partner
 */
function handleDeletePartner(body) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("channel");
  if (!sheet) {
    return { status: "error", message: "Sheet 'channel' tidak ditemukan." };
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var idxPic = -1;
  var idxChannel = -1;
  var idxCat = -1;
  var idxProvince = -1;
  var idxArea = -1;
  
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (/pic|user|nama|analyst|solution/i.test(h)) idxPic = i;
    if (/channel|kiosk|nama toko|toko|name|distributor|partner|mitra/i.test(h)) idxChannel = i;
    if (/kategori|category|klasifikasi|^cat$/i.test(h)) idxCat = i;
    if (/provinsi|province/i.test(h)) idxProvince = i;
    if (/^area$/i.test(h)) idxArea = i;
  }
  
  if (idxChannel === -1) {
    return { status: "error", message: "Kolom nama partner tidak ditemukan di sheet." };
  }
  
  var rowIndex = -1;
  var rowNum = Number(body.id);
  
  // 1. Validasi via Row Number (ID baris)
  if (!isNaN(rowNum) && rowNum > 1 && rowNum <= data.length) {
    var potentialRow = data[rowNum - 1];
    if (potentialRow && idxChannel !== -1) {
      var currentClean = cleanForMatch(potentialRow[idxChannel]);
      var cleanOrig = body.originalName ? cleanForMatch(body.originalName) : "";
      var cleanName = body.name ? cleanForMatch(body.name) : "";
      
      if (cleanOrig && currentClean === cleanOrig) {
        rowIndex = rowNum - 1;
      } else if (cleanName && currentClean === cleanName) {
        rowIndex = rowNum - 1;
      }
    }
  }
  
  // 2. Fallback pencarian berdasarkan nama asli (originalName)
  if (rowIndex === -1 && body.originalName && idxChannel !== -1) {
    var targetClean = cleanForMatch(body.originalName);
    for (var r = 1; r < data.length; r++) {
      if (cleanForMatch(data[r][idxChannel]) === targetClean) {
        rowIndex = r;
        break;
      }
    }
  }
  
  // 3. Fallback pencarian berdasarkan nama baru (name)
  if (rowIndex === -1 && body.name && idxChannel !== -1) {
    var targetClean = cleanForMatch(body.name);
    for (var r = 1; r < data.length; r++) {
      if (cleanForMatch(data[r][idxChannel]) === targetClean) {
        rowIndex = r;
        break;
      }
    }
  }
  
  if (rowIndex > 0 && rowIndex < data.length) {
    var deletedName = data[rowIndex][idxChannel];
    sheet.deleteRow(rowIndex + 1); // deleteRow menggunakan index berbasis 1
    return { 
      status: "success", 
      message: "Partner '" + deletedName + "' berhasil dihapus!" 
    };
  }
  
  return {
    status: "error",
    message: rowIndex === -1
      ? "Data partner '" + (body.name || body.id) + "' tidak ditemukan."
      : "Indeks baris tidak valid untuk penghapusan."
  };
}

/**
 * Helper: Ambil semua data sel dari sheet berdasarkan nama
 */
function getSheetValues(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  return sheet.getDataRange().getValues();
}

/**
 * Handler: Ambil data Working/Checker
 */
function handleGetWorkingData(user) {
  var data = getSheetValues("working");
  if (!data || data.length <= 1) return { status: "success", data: [] };
  var headers = data[0];
  
  function getIdx(patterns) {
    return headers.findIndex(function(h) {
      return patterns.test(String(h).trim());
    });
  }
  
  var idx = {
    lot: getIdx(/^lot package$|^lot$/i),
    hybrid: getIdx(/^hybrid$|^material$/i),
    stock: getIdx(/^quantity \(kg\)|^qty$|^stock$|^kg$/i),
    aging: getIdx(/^aging \(month\)/i),
    exp: getIdx(/^exp date$|^expired$/i),
    kiosk: getIdx(/^channel$|^kiosk$/i),
    crops: getIdx(/^crops$/i),
    time: getIdx(/^tgl$|^waktu$|^date$|^timestamp$/i),
    cond: getIdx(/^condition$|^kondisi$/i),
    dr: getIdx(/^shipping date$|^dr date$/i),
    user: getIdx(/^name checker$|^nama checker$|^user$|^pic$|^checker$/i),
    pog: getIdx(/^pog$|^selisih$/i)
  };
  
  var monthIndices = getMonthIndices(headers);
  var updMonthIndices = getUpdMonthIndices(headers);
  
  var result = data.slice(1).filter(function(row) {
    return row[0] !== "" && row[0] !== undefined;
  }).map(function(row) {
    var rowItem = {
      lot: idx.lot !== -1 ? row[idx.lot] : "",
      hybrid: idx.hybrid !== -1 ? row[idx.hybrid] : "",
      crops: (idx.crops !== -1 && row[idx.crops] !== "" && row[idx.crops] !== undefined) ? row[idx.crops] : "Uncategorized Crops",
      stock: (idx.stock !== -1 && row[idx.stock] !== "" && row[idx.stock] !== undefined) ? Number(row[idx.stock]) || 0 : 0,
      aging: (idx.aging !== -1 && row[idx.aging] !== "" && row[idx.aging] !== undefined) ? row[idx.aging] : "-",
      expired: (idx.exp !== -1 && row[idx.exp]) ? formatMyDate(row[idx.exp]) : "N/A",
      drDate: (idx.dr !== -1 && row[idx.dr]) ? formatMyDate(row[idx.dr]) : "N/A",
      kiosk: idx.kiosk !== -1 ? row[idx.kiosk] : "",
      timestamp: (idx.time !== -1 && row[idx.time]) ? row[idx.time] : "",
      condition: (idx.cond !== -1 && row[idx.cond]) ? row[idx.cond] : "tetap",
      user: (idx.user !== -1 && row[idx.user]) ? String(row[idx.user]).trim() : "",
      pog: (idx.pog !== -1 && row[idx.pog] !== "" && row[idx.pog] !== undefined) ? Number(row[idx.pog]) || 0 : 0
    };
    
    var months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    months.forEach(function(m, mIdx) {
      var colIdx = monthIndices[mIdx];
      if (colIdx !== -1 && colIdx < row.length) {
        rowItem[m.toLowerCase()] = (row[colIdx] !== "" && row[colIdx] !== undefined) ? Number(row[colIdx]) || 0 : 0;
      } else {
        rowItem[m.toLowerCase()] = 0;
      }
      
      var updColIdx = updMonthIndices[mIdx];
      if (updColIdx !== -1 && updColIdx < row.length) {
        rowItem["upd_" + m.toLowerCase()] = (row[updColIdx] !== "" && row[updColIdx] !== undefined) ? String(row[updColIdx]).trim() : "";
      } else {
        rowItem["upd_" + m.toLowerCase()] = "";
      }
    });
    return rowItem;
  });
  
  return { status: "success", data: result };
}

/**
 * Helper: Ambil index kolom bulan
 */
function getMonthIndices(headers) {
  var synonyms = [
    ["jan", "januari", "january"],
    ["feb", "februari", "february"],
    ["mar", "maret", "march"],
    ["apr", "april"],
    ["mei", "may"],
    ["jun", "juni", "june"],
    ["jul", "juli", "july"],
    ["ags", "agu", "agst", "agustus", "aug", "august"],
    ["sep", "sept", "september"],
    ["okt", "oct", "oktober", "october"],
    ["nov", "november"],
    ["des", "dec", "desember", "december"]
  ];
  var matchedIndices = [];
  for (var m = 0; m < 12; m++) {
    var list = synonyms[m];
    var idx = headers.findIndex(function(h) {
      var hStr = String(h || "").trim().toLowerCase();
      return list.some(function(syn) { return hStr === syn; });
    });
    matchedIndices.push(idx);
  }
  return matchedIndices;
}

/**
 * Helper: Ambil index kolom update bulan
 */
function getUpdMonthIndices(headers) {
  var synonyms = [
    ["jan", "januari", "january"],
    ["feb", "februari", "february"],
    ["mar", "maret", "march"],
    ["apr", "april"],
    ["mei", "may"],
    ["jun", "juni", "june"],
    ["jul", "juli", "july"],
    ["ags", "agu", "agst", "agustus", "aug", "august"],
    ["sep", "sept", "september"],
    ["okt", "oct", "oktober", "october"],
    ["nov", "november"],
    ["des", "dec", "desember", "december"]
  ];
  var matchedIndices = [];
  for (var m = 0; m < 12; m++) {
    var list = synonyms[m];
    var idx = headers.findIndex(function(h) {
      if (h === undefined || h === null) return false;
      var hStr = String(h).trim().toLowerCase().replace(/[\s_\-\/]/g, "");
      if (!hStr.startsWith("upd")) return false;
      var remains = hStr.substring(3);
      return list.some(function(syn) { return remains === syn; });
    });
    matchedIndices.push(idx);
  }
  return matchedIndices;
}

/**
 * Handler: Ambil data Partner/Channel yang sesuai hak akses
 */
function handleGetChannels(user) {
  var data = getSheetValues("channel");
  if (!data || data.length <= 1) return { status: "success", data: [] };
  var lowerUser = String(user).trim().toLowerCase();
  
  var empData = getSheetValues("employee");
  var authorizedPICs = [lowerUser];
  var isBusinessAnalyst = 
    lowerUser === "adityawiratama" || 
    lowerUser.includes("adityawiratama") || 
    lowerUser === "analyst" || 
    lowerUser === "businessanalyst";
    
  var empHeaders = empData ? empData[0] : null;
  var matchedRow = null;
  var idxE = { name: -1, email: -1, upline: -1, pos: -1 };
  
  if (empData && empData.length > 0) {
    idxE.name = empHeaders.findIndex(function(h) { return /nama|name|pic/i.test(String(h).trim()); });
    idxE.email = empHeaders.findIndex(function(h) { return /email|user/i.test(String(h).trim()); });
    idxE.upline = empHeaders.findIndex(function(h) { return /upline|spv|supervisor|atasan|manager/i.test(String(h).trim()); });
    idxE.pos = empHeaders.findIndex(function(h) { return /position|jabatan/i.test(String(h).trim()); });
    
    matchedRow = findEmployeeRow(user, empData);
    var userAliases = new Set([lowerUser]);
    
    if (matchedRow) {
      var emailIdx = empHeaders.findIndex(function(h) { return /email/i.test(String(h).trim()); });
      var userIdx = empHeaders.findIndex(function(h) { return /^user$|^username$|^user\s*name$/i.test(String(h).trim().toLowerCase()); });
      var rowName = idxE.name !== -1 ? String(matchedRow[idxE.name] || "").trim().toLowerCase() : "";
      var rowEmail = emailIdx !== -1 ? String(matchedRow[emailIdx] || "").trim().toLowerCase() : "";
      var rowUser = userIdx !== -1 ? String(matchedRow[userIdx] || "").trim().toLowerCase() : "";
      var rowPos = idxE.pos !== -1 ? String(matchedRow[idxE.pos] || "").trim().toLowerCase() : "";
      
      if (rowName !== "") userAliases.add(rowName);
      if (rowEmail !== "") userAliases.add(rowEmail);
      if (rowUser !== "") userAliases.add(rowUser);
      
      var cleanRowPos = rowPos.replace(/\s+/g, "");
      var levelIdx = empHeaders.findIndex(function(h) { return /level|grade/i.test(String(h).trim()); });
      var rowLevel = levelIdx !== -1 ? String(matchedRow[levelIdx] || "").trim().toLowerCase() : "";
      if (cleanRowPos === "businessanalyst" || cleanRowPos === "analyst" || rowLevel === "admin") {
        isBusinessAnalyst = true;
      }
    }
    
    if (isBusinessAnalyst) {
      var emailIdx = empHeaders.findIndex(function(h) { return /email/i.test(String(h).trim()); });
      var userIdx = empHeaders.findIndex(function(h) { return /^user$|^username$|^user\s*name$/i.test(String(h).trim().toLowerCase()); });
      var groupIdx = empHeaders.findIndex(function(h) { return /group|tim|divisi|division/i.test(String(h).trim()); });
      var levelIdx = empHeaders.findIndex(function(h) { return /level|grade/i.test(String(h).trim()); });
      
      var adminGroup = "";
      if (matchedRow && levelIdx !== -1 && groupIdx !== -1) {
        var rowLevel2 = String(matchedRow[levelIdx] || "").trim().toLowerCase();
        if (rowLevel2 === "admin") {
          adminGroup = String(matchedRow[groupIdx] || "").trim().toLowerCase();
        }
      }
      
      empData.slice(1).forEach(function(row) {
        var rowGroup = groupIdx !== -1 ? String(row[groupIdx] || "").trim().toLowerCase() : "";
        var rowName = idxE.name !== -1 ? String(row[idxE.name] || "").trim().toLowerCase() : "";
        var rowEmail = emailIdx !== -1 ? String(row[emailIdx] || "").trim().toLowerCase() : "";
        var rowUser = userIdx !== -1 ? String(row[userIdx] || "").trim().toLowerCase() : "";
        
        if (adminGroup && adminGroup !== "all" && adminGroup !== "") {
          if (rowGroup !== adminGroup && rowName !== lowerUser && rowEmail !== lowerUser && rowUser !== lowerUser) {
            return;
          }
        }
        
        if (rowName !== "") userAliases.add(rowName);
        if (rowEmail !== "") userAliases.add(rowEmail);
        if (rowUser !== "") userAliases.add(rowUser);
      });
    }
    
    var queue = Array.from(userAliases);
    var visited = new Set(queue);
    userAliases.forEach(function(alias) {
      if (!authorizedPICs.includes(alias)) authorizedPICs.push(alias);
    });
    
    while (queue.length > 0) {
      var currentUpline = queue.shift();
      empData.slice(1).forEach(function(row) {
        var empNameRaw = idxE.name !== -1 ? String(row[idxE.name] || "").trim() : "";
        var empNameLower = empNameRaw.toLowerCase();
        var empEmailRaw = idxE.email !== -1 ? String(row[idxE.email] || "").trim() : "";
        var empEmailLower = empEmailRaw.toLowerCase();
        var empUplineRaw = idxE.upline !== -1 ? String(row[idxE.upline] || "").trim() : "";
        var empUplineLower = empUplineRaw.toLowerCase();
        
        if (empUplineLower !== "") {
          var isMatch = empUplineLower === currentUpline || empUplineLower.includes(currentUpline) || currentUpline.includes(empUplineLower);
          if (isMatch) {
            if (empNameLower !== "" && !visited.has(empNameLower)) {
              visited.add(empNameLower);
              queue.push(empNameLower);
              if (!authorizedPICs.includes(empNameLower)) authorizedPICs.push(empNameLower);
            }
            if (empEmailLower !== "" && !visited.has(empEmailLower)) {
              visited.add(empEmailLower);
              queue.push(empEmailLower);
              if (!authorizedPICs.includes(empEmailLower)) authorizedPICs.push(empEmailLower);
            }
          }
        }
      });
    }
  }
  
  var headers = data[0];
  var idx = {
    pic: headers.findIndex(function(h) { return /pic|user|nama|analyst|solution/i.test(String(h).trim()); }),
    channel: headers.findIndex(function(h) { return /channel|kiosk|nama toko|toko|name|distributor|partner|mitra/i.test(String(h).trim()); }),
    cat: headers.findIndex(function(h) { return /kategori|category|klasifikasi|^cat$/i.test(String(h).trim()); }),
    upline: headers.findIndex(function(h) { return /upline|spv|supervisor/i.test(String(h).trim()); }),
    area: headers.findIndex(function(h) { return /area|provinsi|province|wilayah/i.test(String(h).trim()); }),
    group: headers.findIndex(function(h) { return /group|tim|divisi|division/i.test(String(h).trim()); })
  };
  
  var picToAreaMap = {};
  if (empData && empData.length > 1) {
    var empHeadersVal = empData[0];
    var nameCol = empHeadersVal.findIndex(function(h) { return /nama|name|pic/i.test(String(h).trim()); });
    var emailCol = empHeadersVal.findIndex(function(h) { return /email|user/i.test(String(h).trim()); });
    var areaCol = empHeadersVal.findIndex(function(h) { return /area/i.test(String(h).trim()); });
    var provCol = empHeadersVal.findIndex(function(h) { return /province|provinsi/i.test(String(h).trim()); });
    
    empData.slice(1).forEach(function(empRow) {
      var empName = nameCol !== -1 ? String(empRow[nameCol] || "").trim().toLowerCase() : "";
      var empEmail = emailCol !== -1 ? String(empRow[emailCol] || "").trim().toLowerCase() : "";
      var empArea = (areaCol !== -1 && empRow[areaCol] !== "" && empRow[areaCol] !== undefined) ? String(empRow[areaCol]).trim() :
                    (provCol !== -1 && empRow[provCol] !== "" && empRow[provCol] !== undefined) ? String(empRow[provCol]).trim() : "";
      if (empArea) {
        if (empName) picToAreaMap[empName] = empArea;
        if (empEmail) picToAreaMap[empEmail] = empArea;
      }
    });
  }
  
  var channels = data.slice(1).map(function(row, i) {
    if (row[0] === "" || row[0] === undefined) return null;
    var catValue = (idx.cat !== -1 && row[idx.cat] !== "" && row[idx.cat] !== undefined) ? String(row[idx.cat]).trim() : "Uncategorized";
    var rowGroup = (idx.group !== -1 && row[idx.group] !== "" && row[idx.group] !== undefined) ? String(row[idx.group]).trim() : "";
    
    if (idx.pic !== -1 && idx.channel !== -1) {
      var picLower = String(row[idx.pic] || "").trim().toLowerCase();
      var uplineLower = idx.upline !== -1 ? String(row[idx.upline] || "").trim().toLowerCase() : "";
      
      var isAuth = isBusinessAnalyst || picLower === "" || picLower === "tanpa pic" || picLower === "tidak ada" || picLower === lowerUser ||
                   (lowerUser !== "" && picLower.includes(lowerUser)) || uplineLower === lowerUser || (lowerUser !== "" && uplineLower.includes(lowerUser)) ||
                   authorizedPICs.some(function(auth) { return picLower === auth || (auth !== "" && picLower.includes(auth)); });
                   
      if (isAuth) {
        var sheetArea = (idx.area !== -1 && row[idx.area] !== "" && row[idx.area] !== undefined) ? String(row[idx.area]).trim() : "";
        var resolvedArea = sheetArea || picToAreaMap[picLower] || "-";
        return {
          id: i + 2,
          name: row[idx.channel],
          category: catValue,
          pic: String(row[idx.pic] || "").trim(),
          upline: idx.upline !== -1 ? String(row[idx.upline] || "").trim() : "",
          area: resolvedArea,
          group: rowGroup
        };
      }
    } else if (idx.channel !== -1) {
      var sheetArea = (idx.area !== -1 && row[idx.area] !== "" && row[idx.area] !== undefined) ? String(row[idx.area]).trim() : "";
      return {
        id: i + 2,
        name: row[idx.channel],
        category: catValue,
        pic: "",
        upline: "",
        area: sheetArea || "-",
        group: rowGroup
      };
    }
    return null;
  }).filter(Boolean);
  
  return { status: "success", data: channels };
}

/**
 * Handler: Ambil data DR Sales
 */
function handleGetDrSalesData(user) {
  var hybridMap = {};
  var hData = getSheetValues("hybrid");
  if (hData && hData.length > 1) {
    var hHeaders = hData[0];
    var idxH = {
      desc: hHeaders.findIndex(function(h) { return /material.*desc|description/i.test(String(h).trim()); }),
      hybrid: hHeaders.findIndex(function(h) { return /^hybrid$/i.test(String(h).trim()); }),
      crops: hHeaders.findIndex(function(h) { return /^crops$/i.test(String(h).trim()); })
    };
    if (idxH.desc !== -1 && idxH.hybrid !== -1) {
      hData.slice(1).forEach(function(row) {
        var mDesc = String(row[idxH.desc] || "").trim().toLowerCase();
        if (mDesc) {
          hybridMap[mDesc] = {
            hybrid: String(row[idxH.hybrid] || "").trim(),
            crops: (idxH.crops !== -1 && row[idxH.crops] !== undefined) ? String(row[idxH.crops]).trim() : ""
          };
        }
      });
    }
  }

  var data = getSheetValues("dr");
  if (!data || data.length <= 1) return { status: "success", data: [] };
  var headers = data[0];

  var hIdx = {
    qty: headers.findIndex(function(h) { return /qty|quantity/i.test(String(h).trim()); }),
    type: headers.findIndex(function(h) { return /order type/i.test(String(h).trim()); }),
    channel: headers.findIndex(function(h) { return /channel|kiosk|nama toko|toko|name|distributor|partner|mitra/i.test(String(h).trim()); }),
    lot: headers.findIndex(function(h) { return /lot/i.test(String(h).trim()); }),
    desc: headers.findIndex(function(h) { return /material.*desc|description/i.test(String(h).trim()); }),
    dr: headers.findIndex(function(h) { return /dr date|shipping date/i.test(String(h).trim()); }),
    exp: headers.findIndex(function(h) { return /exp date|expired/i.test(String(h).trim()); })
  };

  var result = data.slice(1).filter(function(row) {
    return hIdx.type !== -1 && String(row[hIdx.type] || "").trim().toLowerCase() === "sales";
  }).map(function(row) {
    var rawDesc = hIdx.desc !== -1 ? String(row[hIdx.desc] || "").trim() : "";
    var mapInfo = hybridMap[rawDesc.toLowerCase()] || { hybrid: rawDesc, crops: "" };
    var drValue = (hIdx.dr !== -1 && row[hIdx.dr]) ? formatMyDate(row[hIdx.dr]) : "N/A";
    var expValue = (hIdx.exp !== -1 && row[hIdx.exp]) ? formatMyDate(row[hIdx.exp]) : "N/A";
    return {
      lot: hIdx.lot !== -1 ? String(row[hIdx.lot] || "").trim().toUpperCase() : "",
      hybrid: mapInfo.hybrid,
      crops: mapInfo.crops,
      channel: hIdx.channel !== -1 ? String(row[hIdx.channel] || "").trim() : "",
      qty: hIdx.qty !== -1 ? Number(row[hIdx.qty]) || 0 : 0,
      drDate: drValue,
      expired: expValue
    };
  });
  return { status: "success", data: result };
}

/**
 * Handler: Ambil info lot tertentu
 */
function handleGetLotInfo(lotNo) {
  if (!lotNo) return { status: "error", message: "Lot number is required" };
  var hybridMap = {};
  var hData = getSheetValues("hybrid");
  if (hData && hData.length > 1) {
    var hHeaders = hData[0];
    var idxH = {
      desc: hHeaders.findIndex(function(h) { return /material.*desc|description/i.test(String(h).trim()); }),
      hybrid: hHeaders.findIndex(function(h) { return /^hybrid$/i.test(String(h).trim()); }),
      crops: hHeaders.findIndex(function(h) { return /^crops$/i.test(String(h).trim()); })
    };
    if (idxH.desc !== -1 && idxH.hybrid !== -1) {
      hData.slice(1).forEach(function(row) {
        var mDesc = String(row[idxH.desc] || "").trim().toLowerCase();
        if (mDesc) {
          hybridMap[mDesc] = {
            hybrid: String(row[idxH.hybrid] || "").trim(),
            crops: (idxH.crops !== -1 && row[idxH.crops] !== undefined) ? String(row[idxH.crops]).trim() : ""
          };
        }
      });
    }
  }
  var data = getSheetValues("dr");
  if (!data || data.length <= 1) return { status: "error", message: "No data" };
  var headers = data[0];
  var idx = {
    lot: headers.findIndex(function(h) { return /lot/i.test(String(h).trim()); }),
    desc: headers.findIndex(function(h) { return /material.*desc|description/i.test(String(h).trim()); }),
    dr: headers.findIndex(function(h) { return /dr date|shipping date/i.test(String(h).trim()); }),
    exp: headers.findIndex(function(h) { return /exp date|expired/i.test(String(h).trim()); })
  };
  if (idx.lot === -1) return { status: "error", message: "Lot column missing" };
  
  function calcMonths(start, end) {
    try {
      if (!start || !end || start === "" || end === "") return "";
      var d1 = new Date(start);
      var d2 = new Date(end);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "";
      return Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24) / 30.416);
    } catch (e) {
      return "";
    }
  }

  var todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  var targetLot = String(lotNo).trim().toUpperCase();
  var foundRow = data.slice(1).find(function(row) {
    return String(row[idx.lot] || "").trim().toUpperCase() === targetLot;
  });
  if (foundRow) {
    var rawDesc = idx.desc !== -1 ? String(foundRow[idx.desc] || "").trim() : "Unknown Material";
    var mapInfo = hybridMap[rawDesc.toLowerCase()] || { hybrid: rawDesc, crops: "" };
    var drDateVal = idx.dr !== -1 ? foundRow[idx.dr] : "";

    return {
      status: "success",
      data: {
        desc: mapInfo.hybrid,
        crops: mapInfo.crops,
        drDate: idx.dr !== -1 ? formatMyDate(drDateVal) : "N/A",
        expDate: idx.exp !== -1 ? formatMyDate(foundRow[idx.exp]) : "N/A",
        aging: calcMonths(drDateVal, todayDate)
      }
    };
  }
  return { status: "error", message: "Lot not found" };
}

/**
 * Handler: Ambil daftar karyawan/user
 */
function handleGetEmployees() {
  var data = getSheetValues("employee");
  if (!data || data.length <= 1) return { status: "success", data: [] };
  var headers = data[0];
  var emailIdx = headers.findIndex(function(h) { return /email/i.test(String(h).trim()); });
  var userIdx = headers.findIndex(function(h) { return /^user$|^username$|^user\s*name$/i.test(String(h).trim().toLowerCase()); });
  var idx = {
    name: headers.findIndex(function(h) { return /nama|name|pic/i.test(String(h).trim()); }),
    email: emailIdx !== -1 ? emailIdx : headers.findIndex(function(h) { return /email|user/i.test(String(h).trim()); }),
    username: userIdx !== -1 ? userIdx : -1,
    pos: headers.findIndex(function(h) { return /position|jabatan/i.test(String(h).trim()); }),
    prov: headers.findIndex(function(h) { return /province|provinsi/i.test(String(h).trim()); }),
    area: headers.findIndex(function(h) { return /area/i.test(String(h).trim()); }),
    upline: headers.findIndex(function(h) { return /upline|spv|supervisor|atasan|manager/i.test(String(h).trim()); }),
    password: headers.findIndex(function(h) { return /password|pass/i.test(String(h).trim()); }),
    level: headers.findIndex(function(h) { return /level|grade/i.test(String(h).trim()); }),
    group: headers.findIndex(function(h) { return /group|tim|divisi|division/i.test(String(h).trim()); })
  };

  var result = data.slice(1).filter(function(row) {
    return row[idx.name] !== "" && row[idx.name] !== undefined;
  }).map(function(row) {
    var p = idx.pos !== -1 ? row[idx.pos] : "Business Solution";
    return {
      name: idx.name !== -1 ? String(row[idx.name] || "").trim() : "",
      email: idx.email !== -1 ? String(row[idx.email] || "").trim() : "",
      user: idx.username !== -1 ? String(row[idx.username] || "").trim() : "",
      position: normalizePosition(p),
      province: idx.prov !== -1 ? String(row[idx.prov] || "").trim() : "-",
      area: idx.area !== -1 ? String(row[idx.area] || "").trim() : "-",
      upline: idx.upline !== -1 ? String(row[idx.upline] || "").trim() : "",
      password: idx.password !== -1 ? String(row[idx.password] || "").trim() : "",
      level: (idx.level !== -1 && row[idx.level] !== "" && row[idx.level] !== undefined) ? row[idx.level] : null,
      group: idx.group !== -1 ? String(row[idx.group] || "").trim() : ""
    };
  });
  
  var seenEmployees = new Set();
  var dedupedResult = [];
  for (var i = 0; i < result.length; i++) {
    var emp = result[i];
    var cleanName = String(emp.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seenEmployees.has(cleanName) && cleanName !== "") {
      seenEmployees.add(cleanName);
      dedupedResult.push(emp);
    }
  }
  
  return { status: "success", data: dedupedResult };
}

/**
 * Handler: Ambil profil user login
 */
function handleGetUserProfile(user) {
  var employeesRes = handleGetEmployees();
  var employees = employeesRes.status === "success" ? employeesRes.data : [];
  if (employees.length === 0) {
    return { status: "error", message: "Data employee kosong atau tidak ditemukan" };
  }

  var lowerUser = String(user).trim().toLowerCase();

  var foundEmployee = employees.find(function(emp) {
    var rowUser = String(emp.user || "").trim().toLowerCase();
    var rowEmail = String(emp.email || "").trim().toLowerCase();
    var rowUserLocal = rowEmail.includes("@") ? rowEmail.split("@")[0] : rowEmail;

    if (rowUser !== "") {
      return rowUser === lowerUser || rowEmail === lowerUser;
    } else {
      return rowUserLocal === lowerUser || rowEmail === lowerUser;
    }
  });

  if (!foundEmployee) {
    return { status: "error", message: "Username tidak ditemukan: " + user };
  }

  var resolvedUser = foundEmployee.user || (foundEmployee.email ? (foundEmployee.email.includes("@") ? foundEmployee.email.split("@")[0] : foundEmployee.email) : "");

  var profile = {
    name: foundEmployee.name,
    email: foundEmployee.email,
    user: resolvedUser,
    position: foundEmployee.position,
    province: foundEmployee.province,
    area: foundEmployee.area,
    password: foundEmployee.password,
    upline: foundEmployee.upline,
    level: foundEmployee.level,
    group: foundEmployee.group,
    subordinates: []
  };

  var userAliases = new Set([lowerUser]);
  if (profile.name !== "") userAliases.add(profile.name.toLowerCase());
  if (profile.email !== "") userAliases.add(profile.email.toLowerCase());
  if (profile.user !== "") userAliases.add(profile.user.toLowerCase());

  var cleanProfilePos = profile.position ? profile.position.toLowerCase().replace(/\s+/g, "") : "";
  var profileLevelClean = profile.level ? String(profile.level).toLowerCase().trim() : "";
  var isBusinessAnalyst =
    lowerUser === "adityawiratama" ||
    lowerUser.includes("adityawiratama") ||
    cleanProfilePos === "businessanalyst" ||
    cleanProfilePos === "analyst" ||
    profileLevelClean === "admin";
    
  if (isBusinessAnalyst) {
    if (profileLevelClean !== "admin") {
      profile.position = "Business Analyst";
    }
    var asmSubordinates = [];
    if (profileLevelClean !== "admin") {
      employees.forEach(function(emp) {
        if (emp.name !== "" && emp.position === "Area Sales Manager") {
          if (!asmSubordinates.includes(emp.name)) {
            asmSubordinates.push(emp.name);
          }
        }
      });
    }
    profile.subordinates = asmSubordinates;
    return { status: "success", data: profile };
  }

  var subs = [];
  var queue = Array.from(userAliases);
  var visited = new Set(queue);

  while (queue.length > 0) {
    var currentUpline = queue.shift();
    employees.forEach(function(emp) {
      var empNameRaw = String(emp.name || "").trim();
      var empNameLower = empNameRaw.toLowerCase();
      var empEmailRaw = String(emp.email || "").trim();
      var empEmailLower = empEmailRaw.toLowerCase();
      var empUplineRaw = String(emp.upline || "").trim();
      var empUplineLower = empUplineRaw.toLowerCase();

      if (empUplineLower !== "") {
        var isMatch =
          empUplineLower === currentUpline ||
          empUplineLower.includes(currentUpline) ||
          currentUpline.includes(empUplineLower);
        if (isMatch) {
          var addedAny = false;
          if (empNameLower !== "" && !visited.has(empNameLower)) {
            visited.add(empNameLower);
            queue.push(empNameLower);
            addedAny = true;
          }
          if (empEmailLower !== "" && !visited.has(empEmailLower)) {
            visited.add(empEmailLower);
            queue.push(empEmailLower);
            addedAny = true;
          }
          if (addedAny) {
            var displayName = empNameRaw !== "" ? empNameRaw : empEmailRaw;
            if (displayName !== "" && !subs.includes(displayName)) {
              subs.push(displayName);
            }
          }
        }
      }
    });
  }

  profile.subordinates = subs;
  return { status: "success", data: profile };
}

/**
 * Handler: Ambil aturan akses
 */
function handleGetAccessRules() {
  try {
    var empData = getSheetValues("employee");
    var uniquePositions = [];
    if (empData && empData.length > 1) {
      var headers = empData[0];
      var posIdx = headers.findIndex(function(h) { return /position|jabatan/i.test(String(h).trim()); });
      var nameIdx = headers.findIndex(function(h) { return /nama|name|pic/i.test(String(h).trim()); });
      for (var i = 1; i < empData.length; i++) {
        var row = empData[i];
        if (nameIdx !== -1 && !row[nameIdx]) continue;
        var rawPos = posIdx !== -1 ? row[posIdx] : "";
        var normalized = normalizePosition(rawPos);
        if (normalized && !uniquePositions.includes(normalized)) {
          uniquePositions.push(normalized);
        }
      }
    }
    
    var defaults = ["Business Analyst", "Vegetables Sales Manager", "Area Sales Manager", "Sales Agronomist", "Business Solution"];
    defaults.forEach(function(d) {
      if (!uniquePositions.includes(d)) {
        uniquePositions.push(d);
      }
    });

    var data = getSheetValues("access");
    var rules = {};
    var existingPositions = [];

    if (data && data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var position = String(row[0]).trim();
        if (!position) continue;
        existingPositions.push(position);
        rules[position] = {
          home: row[1] === true || String(row[1]).toUpperCase() === "TRUE",
          partner: row[2] === true || String(row[2]).toUpperCase() === "TRUE",
          stock: row[3] === true || String(row[3]).toUpperCase() === "TRUE",
          pog: row[4] === true || String(row[4]).toUpperCase() === "TRUE",
          overview: row[5] === true || String(row[5]).toUpperCase() === "TRUE",
          temp: row[6] === true || String(row[6]).toUpperCase() === "TRUE",
          access: row[7] === true || String(row[7]).toUpperCase() === "TRUE"
        };
      }
    }

    var missingPositions = uniquePositions.filter(function(p) { return !existingPositions.includes(p); });
    if (missingPositions.length > 0) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("access");
      for (var k = 0; k < missingPositions.length; k++) {
        var p = missingPositions[k];
        var home = "TRUE";
        var partner = "TRUE";
        var stock = "TRUE";
        var pog = "TRUE";
        var overview = "FALSE";
        var temp = "FALSE";
        var access = "FALSE";

        if (p === "Business Analyst") {
          overview = "TRUE";
          temp = "TRUE";
          access = "TRUE";
        }

        if (sheet) {
          sheet.appendRow([p, home, partner, stock, pog, overview, temp, access]);
        }

        rules[p] = {
          home: home === "TRUE",
          partner: partner === "TRUE",
          stock: stock === "TRUE",
          pog: pog === "TRUE",
          overview: overview === "TRUE",
          temp: temp === "TRUE",
          access: access === "TRUE"
        };
      }
    }

    return { status: "success", data: rules };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

/**
 * Handler: Ambil semua data awal dalam satu request parallel (mocked/sequential di GAS)
 */
function handleGetInitialData(user) {
  try {
    var profileJson = handleGetUserProfile(user);
    var employeesJson = handleGetEmployees();
    var channelsJson = handleGetChannels(user);
    var workingDataJson = handleGetWorkingData(user);
    var drSalesDataJson = handleGetDrSalesData(user);
    var accessRulesJson = handleGetAccessRules();

    return {
      status: "success",
      data: {
        profile: profileJson.status === "success" ? profileJson.data : null,
        employees: employeesJson.status === "success" ? employeesJson.data : [],
        channels: channelsJson.status === "success" ? channelsJson.data : [],
        workingData: workingDataJson.status === "success" ? workingDataJson.data : [],
        drSalesData: drSalesDataJson.status === "success" ? drSalesDataJson.data : [],
        accessRules: accessRulesJson.status === "success" ? accessRulesJson.data : {}
      }
    };
  } catch (error) {
    return { status: "error", message: error.toString() };
  }
}

/**
 * Helper: Normalisasi Jabatan/Posisi
 */
function normalizePosition(pos) {
  if (!pos) return "Unknown";
  var clean = cleanForMatch(pos);
  if (clean === "businessanalyst" || clean === "analyst") return "Business Analyst";
  if (clean === "areasalesmanager" || clean === "asm") return "Area Sales Manager";
  if (clean === "vegetablessalesmanager" || clean === "vsm") return "Vegetables Sales Manager";
  if (clean === "salesmanager" || clean === "sm") return "Sales Manager";
  if (clean === "salesagronomist" || clean === "sa") return "Sales Agronomist";
  if (clean === "businesssolution" || clean === "bs") return "Business Solution";
  if (clean === "countryhead") return "Country Head";
  if (clean === "commerciallead") return "Commercial Lead";

  if (clean.includes("businessanalyst")) return "Business Analyst";
  if (clean.includes("areasalesmanager") || clean.includes("asm")) return "Area Sales Manager";
  if (clean.includes("vegetablessalesmanager")) return "Vegetables Sales Manager";
  return String(pos).trim();
}

/**
 * Helper: Formatter Tanggal DD/MMM/YY
 */
function formatMyDate(dateObj) {
  if (!dateObj || dateObj === "") return "N/A";
  var date = new Date(dateObj);
  if (isNaN(date.getTime())) return "N/A";
  var day = String(date.getDate()).padStart(2, "0");
  var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var year = String(date.getFullYear()).substring(2);
  return day + "/" + months[date.getMonth()] + "/" + year;
}

/**
 * Helper: Pencarian karyawan
 */
function findEmployeeRow(user, empData) {
  if (!user || !empData || empData.length <= 1) return null;
  var headers = empData[0];
  var emailIdx = headers.findIndex(function(h) { return /email/i.test(String(h).trim()); });
  var userIdx = headers.findIndex(function(h) { return /^user$|^username$|^user\s*name$/i.test(String(h).trim().toLowerCase()); });
  var nameIdx = headers.findIndex(function(h) { return /nama|name|pic/i.test(String(h).trim()); });

  var targetClean = cleanForMatch(user);

  for (var i = 1; i < empData.length; i++) {
    var row = empData[i];
    var rowName = nameIdx !== -1 ? cleanForMatch(row[nameIdx]) : "";
    var rowEmail = emailIdx !== -1 ? cleanForMatch(row[emailIdx]) : "";
    var rowUser = userIdx !== -1 ? cleanForMatch(row[userIdx]) : "";

    if (rowUser === targetClean || rowName === targetClean || rowEmail === targetClean) {
      return row;
    }
  }
  return null;
}

