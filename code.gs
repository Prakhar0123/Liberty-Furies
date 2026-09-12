const SHEET_NAME = "Jobs";

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const data = rows.slice(1);
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  
  let validData = [];
  let rowsToDelete = [];
  
  for (let i = 0; i < data.length; i++) {
    let row = data[i];
    let jobDate = new Date(row[1]);
    
    if (!isNaN(jobDate.getTime()) && jobDate < threeMonthsAgo) {
      rowsToDelete.push(i + 2);
    } else {
      validData.push({
        id: row[0],
        date: row[1],
        role: row[2],
        company: row[3],
        sector: row[4],
        experience: row[5],
        pay: row[6],
        description: row[7],
        link: row[8]
      });
    }
  }
  rowsToDelete.sort((a, b) => b - a);
  rowsToDelete.forEach(r => sheet.deleteRow(r));
  
  return ContentService.createTextOutput(JSON.stringify(validData))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents);
  
  const id = data.id || Utilities.getUuid();
  const timestamp = data.date || new Date().toISOString();
  const { role, company, sector, experience, pay, description, link } = data;
  
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == id) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, 9).setValues([[
      id, timestamp, role, company, sector, experience, pay, description, link
    ]]);
    return ContentService.createTextOutput(JSON.stringify({status: 'success', action: 'updated', id: id}))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    sheet.appendRow([
      id, timestamp, role, company, sector, experience, pay, description, link
    ]);
    return ContentService.createTextOutput(JSON.stringify({status: 'success', action: 'added', id: id}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
