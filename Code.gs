/**
 * Google Apps Script Web App Controller
 * Serves the Project Dashboard Web App and handles server-side database persistence using Google Sheets.
 */

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action === 'get') {
    var dbJson = getDatabaseJson();
    return ContentService.createTextOutput(dbJson)
                         .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Project Dashboard - IamGung')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  var action = e && e.parameter && e.parameter.action;
  var response = {};
  try {
    var payloadStr = e && e.postData && e.postData.contents;
    if (action === 'save' && payloadStr) {
      var dbJson = saveDatabase(payloadStr);
      return ContentService.createTextOutput(dbJson)
                           .setMimeType(ContentService.MimeType.JSON);
    } else {
      response = { status: 'error', message: 'Invalid action or empty payload' };
    }
  } catch (err) {
    response = { status: 'error', message: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(response))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper function to inline CSS/JS files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheet() {
  var ssId = '1i1xCILbxr0x3H8Mh0HOdCCJWvc1xQ-PdDXsvDaPaOH0';
  try {
    return SpreadsheetApp.openById(ssId);
  } catch (e) {
    Logger.log('Error opening spreadsheet by ID: ' + e.toString());
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}
  
  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('SPREADSHEET_ID');
  if (savedId) {
    try {
      return SpreadsheetApp.openById(savedId);
    } catch (e) {}
  }
  
  throw new Error('Could not open spreadsheet. Please check if the spreadsheet ID 1i1xCILbxr0x3H8Mh0HOdCCJWvc1xQ-PdDXsvDaPaOH0 exists and is accessible.');
}

/**
 * Helper: Convert a Spreadsheet Sheet to an array of objects
 */
function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var objects = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var obj = {};
    var hasData = false;
    for (var c = 0; c < headers.length; c++) {
      var val = row[c];
      if (val !== "" && val !== null && val !== undefined) {
        hasData = true;
      }
      var key = headers[c];
      if ((key === 'systems' || key === 'deliverables' || key === 'revisions') && typeof val === 'string' && val.trim() !== '') {
        try {
          obj[key] = JSON.parse(val);
        } catch (e) {
          obj[key] = val;
        }
      } else if (val instanceof Date) {
        // Format dates as YYYY-MM-DD for consistency
        obj[key] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        obj[key] = val;
      }
    }
    if (hasData) {
      objects.push(obj);
    }
  }
  return objects;
}

/**
 * Helper: Write an array of objects back to a Spreadsheet Sheet
 */
function objectsToSheet(sheet, objects, headers) {
  sheet.clear();
  sheet.appendRow(headers);
  
  try {
    sheet.setFrozenRows(1);
  } catch (e) {}

  if (objects.length === 0) return;
  
  var rows = [];
  for (var i = 0; i < objects.length; i++) {
    var obj = objects[i];
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = obj[key];
      if (val === undefined || val === null) {
        row.push("");
      } else if (typeof val === 'object') {
        row.push(JSON.stringify(val));
      } else {
        row.push(val);
      }
    }
    rows.push(row);
  }
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

/**
 * RPC: Retrieve database JSON from Google Sheets
 */
function getDatabaseJson() {
  try {
    var ss = getSpreadsheet();
    var db = {};
    
    var tabs = {
      projects: ['id', 'code', 'name', 'region', 'engineer', 'businessType', 'investor', 'client', 'systems', 'capacity', 'lat', 'lng', 'googleMapsLink', 'image', 'deliverables', 'notes', 'status', 'stage', 'deadline', 'constructionDate', 'codDate', 'prTest', 'pv', 'inverter', 'awardNote', 'revisions'],
      awardedProjects: ['id', 'code', 'name', 'region', 'engineer', 'businessType', 'investor', 'client', 'systems', 'capacity', 'lat', 'lng', 'googleMapsLink', 'image', 'deliverables', 'notes', 'status', 'stage', 'deadline', 'constructionDate', 'codDate', 'prTest', 'pv', 'inverter', 'awardNote', 'revisions'],
      members: ['id', 'name', 'role'],
      holidays: ['id', 'date', 'name'],
      manhours: ['id', 'memberId', 'date', 'hours', 'projectId', 'deliverableName'],
      calendarNotes: ['id', 'date', 'note']
    };
    
    for (var key in tabs) {
      var sheet = ss.getSheetByName(key);
      if (!sheet) {
        sheet = ss.insertSheet(key);
        var defaultData = getDefaultMockData(key);
        objectsToSheet(sheet, defaultData, tabs[key]);
        db[key] = defaultData;
      } else {
        db[key] = sheetToObjects(sheet);
      }
    }
    
    return JSON.stringify(db);
  } catch (err) {
    Logger.log('Error in getDatabaseJson: ' + err.toString());
    return "null";
  }
}

/**
 * RPC: Save database JSON to Google Sheets with script locking
 */
function saveDatabase(dbJson) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30 seconds
    
    var ss = getSpreadsheet();
    var db = JSON.parse(dbJson);
    
    var tabs = {
      projects: ['id', 'code', 'name', 'region', 'engineer', 'businessType', 'investor', 'client', 'systems', 'capacity', 'lat', 'lng', 'googleMapsLink', 'image', 'deliverables', 'notes', 'status', 'stage', 'deadline', 'constructionDate', 'codDate', 'prTest', 'pv', 'inverter', 'awardNote', 'revisions'],
      awardedProjects: ['id', 'code', 'name', 'region', 'engineer', 'businessType', 'investor', 'client', 'systems', 'capacity', 'lat', 'lng', 'googleMapsLink', 'image', 'deliverables', 'notes', 'status', 'stage', 'deadline', 'constructionDate', 'codDate', 'prTest', 'pv', 'inverter', 'awardNote', 'revisions'],
      members: ['id', 'name', 'role'],
      holidays: ['id', 'date', 'name'],
      manhours: ['id', 'memberId', 'date', 'hours', 'projectId', 'deliverableName'],
      calendarNotes: ['id', 'date', 'note']
    };
    
    for (var key in tabs) {
      var sheet = ss.getSheetByName(key);
      if (!sheet) {
        sheet = ss.insertSheet(key);
      }
      var objects = db[key] || [];
      objectsToSheet(sheet, objects, tabs[key]);
    }
    
    // Read written database back from sheet to get the exact saved state
    var savedDb = {};
    for (var key in tabs) {
      var sheet = ss.getSheetByName(key);
      savedDb[key] = sheetToObjects(sheet);
    }
    return JSON.stringify(savedDb);
  } catch (err) {
    Logger.log('Error in saveDatabase: ' + err.toString());
    throw err;
  } finally {
    lock.releaseLock();
  }
}

/**
 * RPC: Clear spreadsheet sheets and reinitialize default mock data
 */
function resetDatabase() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var ss = getSpreadsheet();
    var sheets = ss.getSheets();
    
    // Create a temporary dummy sheet to allow deletion of others
    var dummy = ss.insertSheet('temp_dummy');
    for (var i = 0; i < sheets.length; i++) {
      try {
        ss.deleteSheet(sheets[i]);
      } catch (e) {}
    }
    
    var tabs = {
      projects: ['id', 'code', 'name', 'region', 'engineer', 'businessType', 'investor', 'client', 'systems', 'capacity', 'lat', 'lng', 'googleMapsLink', 'image', 'deliverables', 'notes', 'status', 'stage', 'deadline', 'constructionDate', 'codDate', 'prTest', 'pv', 'inverter', 'awardNote', 'revisions'],
      awardedProjects: ['id', 'code', 'name', 'region', 'engineer', 'businessType', 'investor', 'client', 'systems', 'capacity', 'lat', 'lng', 'googleMapsLink', 'image', 'deliverables', 'notes', 'status', 'stage', 'deadline', 'constructionDate', 'codDate', 'prTest', 'pv', 'inverter', 'awardNote', 'revisions'],
      members: ['id', 'name', 'role'],
      holidays: ['id', 'date', 'name'],
      manhours: ['id', 'memberId', 'date', 'hours', 'projectId', 'deliverableName'],
      calendarNotes: ['id', 'date', 'note']
    };
    
    for (var key in tabs) {
      var sheet = ss.insertSheet(key);
      var defaultData = getDefaultMockData(key);
      objectsToSheet(sheet, defaultData, tabs[key]);
    }
    
    // Delete the temporary dummy sheet
    ss.deleteSheet(dummy);
    return true;
  } catch (err) {
    Logger.log('Error in resetDatabase: ' + err.toString());
    return false;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper: Default mock database data
 */
function getDefaultMockData(key) {
  return [];
}