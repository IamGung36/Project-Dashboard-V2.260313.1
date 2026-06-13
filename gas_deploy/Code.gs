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

/**
 * Helper: Retrieve or create database Google Spreadsheet
 */
function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}
  
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID');
  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {
      props.deleteProperty('SPREADSHEET_ID'); // If spreadsheet was deleted, reset ID
    }
  }
  
  // Create a new spreadsheet and save its ID
  var ss = SpreadsheetApp.create('Project Dashboard DB');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
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
  var defaultDeliverables = [
    { name: 'Survey Reports', hours: 4, checked: false },
    { name: 'PV Layout', hours: 4, checked: false },
    { name: 'Single Line Diagram', hours: 4, checked: false },
    { name: 'PVSyst Simulation', hours: 4, checked: false },
    { name: 'Bill of Quantities (BOQ)', hours: 4, checked: false },
    { name: 'Load Profile Analysis', hours: 4, checked: false }
  ];

  if (key === 'members') {
    return [
      { id: 'M-001', name: 'Somchai Yodwitsawakon', role: 'Senior BD Engineer' },
      { id: 'M-002', name: 'เธเธธเธ“เนเธเนเธ (Gung)', role: 'BD Engineer' },
      { id: 'M-003', name: 'Piyapong Ngedee', role: 'Project BD Manager' },
      { id: 'M-004', name: 'Wannapa Wongkantra', role: 'Business Development' }
    ];
  }
  if (key === 'holidays') {
    return [
      { id: 'H-001', date: '2026-01-01', name: "New Year's Day" },
      { id: 'H-002', date: '2026-04-13', name: 'Songkran Festival' },
      { id: 'H-003', date: '2026-04-14', name: 'Songkran Festival' },
      { id: 'H-004', date: '2026-04-15', name: 'Songkran Festival' },
      { id: 'H-005', date: '2026-05-01', name: 'National Labour Day' },
      { id: 'H-006', date: '2026-06-03', name: "H.M. Queen Suthida's Birthday" },
      { id: 'H-007', date: '2026-07-28', name: "H.M. King Maha Vajiralongkorn's Birthday" },
      { id: 'H-008', date: '2026-10-13', name: 'King Bhumibol Adulyadej Memorial Day' },
      { id: 'H-009', date: '2026-12-05', name: "King Bhumibol's Birthday (Father's Day)" },
      { id: 'H-010', date: '2026-12-31', name: "New Year's Eve" }
    ];
  }
  if (key === 'manhours') {
    return [
      { id: 'MH-001', memberId: 'M-001', date: '2026-06-01', hours: 8, projectId: 'P-001' },
      { id: 'MH-002', memberId: 'M-001', date: '2026-06-02', hours: 7, projectId: 'P-001' },
      { id: 'MH-003', memberId: 'M-001', date: '2026-06-03', hours: 8, projectId: 'P-005' },
      { id: 'MH-004', memberId: 'M-001', date: '2026-06-04', hours: 8, projectId: 'P-005' },
      { id: 'MH-005', memberId: 'M-001', date: '2026-06-05', hours: 8, projectId: 'P-001' },
      { id: 'MH-006', memberId: 'M-002', date: '2026-06-01', hours: 8, projectId: 'P-002' },
      { id: 'MH-007', memberId: 'M-002', date: '2026-06-02', hours: 8, projectId: 'P-002' },
      { id: 'MH-008', memberId: 'M-002', date: '2026-06-03', hours: 6, projectId: 'P-007' },
      { id: 'MH-009', memberId: 'M-002', date: '2026-06-04', hours: 8, projectId: 'P-007' },
      { id: 'MH-010', memberId: 'M-002', date: '2026-06-05', hours: 9, projectId: 'P-002' },
      { id: 'MH-011', memberId: 'M-003', date: '2026-06-01', hours: 6, projectId: 'P-003' },
      { id: 'MH-012', memberId: 'M-003', date: '2026-06-02', hours: 8, projectId: 'P-003' },
      { id: 'MH-013', memberId: 'M-003', date: '2026-06-03', hours: 8, projectId: 'P-006' },
      { id: 'MH-014', memberId: 'M-003', date: '2026-06-04', hours: 7, projectId: 'P-006' },
      { id: 'MH-015', memberId: 'M-003', date: '2026-06-05', hours: 8, projectId: 'P-003' },
      { id: 'MH-016', memberId: 'M-004', date: '2026-06-01', hours: 8, projectId: 'P-004' },
      { id: 'MH-017', memberId: 'M-004', date: '2026-06-02', hours: 8, projectId: 'P-004' },
      { id: 'MH-018', memberId: 'M-004', date: '2026-06-03', hours: 8, projectId: 'P-008' },
      { id: 'MH-019', memberId: 'M-004', date: '2026-06-04', hours: 8, projectId: 'P-008' },
      { id: 'MH-020', memberId: 'M-004', date: '2026-06-05', hours: 8, projectId: 'P-004' }
    ];
  }
  if (key === 'projects') {
    return [
      {
        id: 'P-004',
        code: 'G26-004',
        name: 'Solar Carpark Fashion Island',
        region: 'Central',
        engineer: 'M-004',
        businessType: 'EPC',
        investor: 'GC',
        client: 'Land and Houses',
        systems: { Carpark: 1.8 },
        capacity: 1.8,
        lat: 13.8248,
        lng: 100.6782,
        googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1224',
        image: 'https://images.unsplash.com/photo-1594818379496-da1e345b06a9?w=600&auto=format&fit=crop&q=60',
        deliverables: defaultDeliverables,
        notes: 'เธเธฒเธฃเธ•เธดเธ”เธ•เธฑเนเธเธซเธฅเธฑเธเธเธฒเธฅเธฒเธเธเธญเธ”เธฃเธ–เธเธฅเธฑเธเธเธฒเธเนเธชเธเธญเธฒเธ—เธดเธ•เธขเนเธเธฃเธดเน€เธงเธ“เธซเนเธฒเธเธชเธฃเธฃเธเธชเธดเธเธเนเธฒเนเธเธเธฑเนเธเนเธญเธชเนเนเธฅเธเธ”เน เธเนเธงเธขเธเธฑเธเนเธ”เธ”เนเธฅเธฐเธเธฅเธดเธ•เนเธเธเนเธฒเนเธเนเธ เธฒเธขเนเธเธจเธนเธเธขเนเธเธฒเธฃเธเนเธฒ',
        status: 'In Progress',
        stage: 'Underdevelop',
        deadline: '2026-10-30'
      },
      {
        id: 'P-005',
        code: 'G26-005',
        name: 'BESS Microgrid Koh Samui',
        region: 'South',
        engineer: 'M-001',
        businessType: 'EPC',
        investor: 'Other',
        client: 'Samui Resort Association',
        systems: { BESS: 5.0 },
        capacity: 5.0,
        lat: 9.5120,
        lng: 100.0136,
        googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1225',
        image: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=600&auto=format&fit=crop&q=60',
        deliverables: defaultDeliverables,
        notes: 'เธฃเธฐเธเธเธเธฑเธเน€เธเนเธเธเธฅเธฑเธเธเธฒเธเนเธเธ•เน€เธ•เธญเธฃเธตเน (BESS) เธเธเธฒเธ” 5 MWh เธฃเนเธงเธกเธเธฑเธเนเธเธฃเธเธเนเธฒเธขเนเธเธเนเธฒเธขเนเธญเธข เน€เธเธทเนเธญเน€เธเธดเนเธกเธเธงเธฒเธกเน€เธชเธ–เธตเธขเธฃเนเธเธเธฒเธฃเธเนเธฒเธขเธเธฃเธฐเนเธชเนเธเธเนเธฒเธเธเน€เธเธฒเธฐเธชเธกเธธเธข',
        status: 'Standby',
        stage: 'Underdevelop',
        deadline: '2026-11-15'
      },
      {
        id: 'P-007',
        code: 'G26-007',
        name: 'Solar Farm Chiang Mai Agri',
        region: 'North',
        engineer: 'M-002',
        businessType: 'PPA',
        investor: 'GPSC',
        client: 'Northern Agriculture Ltd',
        systems: { Farm: 8.5 },
        capacity: 8.5,
        lat: 18.7883,
        lng: 98.9853,
        googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1227',
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=60',
        deliverables: defaultDeliverables,
        notes: 'เธเธฒเธฃเนเธกเนเธชเธเธญเธฒเธ—เธดเธ•เธขเนเธเธเธฒเธ” 8.5 MWp เนเธเน€เธเธตเธขเธเนเธซเธกเน เธชเธเธฑเธเธชเธเธธเธเธเธฅเธธเนเธกเธเธฒเธฃเน€เธเธฉเธ•เธฃเนเธเธเธทเนเธเธ—เธตเนเธ”เนเธงเธขเธเธฒเธฃเนเธเนเธเธเธฑเธเธเธทเนเธเธ—เธตเนเธ•เธดเธ”เธ•เธฑเนเธเนเธเธฅเธฒเธฃเนเนเธฅเธฐเธ—เธณเธเธฒเธฃเน€เธเธฉเธ•เธฃเธเธงเธเธเธนเนเธเธฑเธ',
        status: 'In Progress',
        stage: 'Underdevelop',
        deadline: '2027-02-15'
      },
      {
        id: 'P-008',
        code: 'G26-008',
        name: 'Hybrid Floating & Carpark Rayong',
        region: 'East',
        engineer: 'M-004',
        businessType: 'PPA',
        investor: 'PTT',
        client: 'Amata City Rayong',
        systems: { Floating: 15.0, Carpark: 2.5 },
        capacity: 17.5,
        lat: 13.0125,
        lng: 101.1963,
        googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1228',
        image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=60',
        deliverables: defaultDeliverables,
        notes: 'เธฃเธฐเธเธเธเธฅเธฑเธเธเธฒเธเนเธชเธเธญเธฒเธ—เธดเธ•เธขเนเนเธเธเธเธชเธกเธเธชเธฒเธ (Hybrid) เนเธ”เธขเธฃเธงเธกเน€เธ—เธเนเธเนเธฅเธขเธตเธ—เธธเนเธเธฅเธญเธขเธเนเธณ 15 MWp เนเธฅเธฐเธซเธฅเธฑเธเธเธฒเธฅเธฒเธเธเธญเธ”เธฃเธ–เธเธญเธเธเธดเธเธกเธญเธธเธ•เธชเธฒเธซเธเธฃเธฃเธกเธญเธกเธ•เธฐเธฃเธฐเธขเธญเธ 2.5 MWp',
        status: 'Standby',
        stage: 'Underdevelop',
        deadline: '2026-09-01'
      }
    ];
  }
  if (key === 'awardedProjects') {
    return [
      {
        id: 'P-001',
        code: 'G26-001',
        name: 'Solar Rooftop Siam Cement (Rayong)',
        region: 'East',
        engineer: 'M-001',
        businessType: 'PPA',
        investor: 'OR',
        client: 'Siam Cement Group',
        systems: { Rooftop: 3.5 },
        capacity: 3.5,
        lat: 12.6828,
        lng: 101.2813,
        googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1221',
        image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop&q=60',
        deliverables: defaultDeliverables,
        notes: 'เนเธเธฃเธเธเธฒเธฃเธ•เธดเธ”เธ•เธฑเนเธเธเธฅเธฑเธเธเธฒเธเนเธชเธเธญเธฒเธ—เธดเธ•เธขเนเธเธเธซเธฅเธฑเธเธเธฒเธเธทเนเธเธ—เธตเนเนเธฃเธเธเธฒเธเธฃเธฐเธขเธญเธ เธกเธตเธเธทเนเธเธ—เธตเนเธซเธฅเธฑเธเธเธฒเธเธฃเธฐเธกเธฒเธ“ 15,000 เธ•เธฒเธฃเธฒเธเน€เธกเธ•เธฃ',
        status: 'Complete',
        stage: 'Award',
        deadline: '2026-08-15',
        constructionDate: '2026-06-15',
        codDate: '2026-08-15',
        prTest: 'PR 82%',
        pv: 'Jinko 580W',
        inverter: 'Huawei 110kW',
        awardNote: 'First awarded project of the year.'
      },
      {
        id: 'P-002',
        code: 'G26-002',
        name: 'Solar Farm Korat Clean Energy',
        region: 'Northeast',
        engineer: 'M-002',
        businessType: 'EPC',
        investor: 'GPSC',
        client: 'Korat Energy Corp',
        systems: { Farm: 12.0 },
        capacity: 12.0,
        lat: 14.9799,
        lng: 102.0979,
        googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1222',
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=60',
        deliverables: defaultDeliverables,
        notes: 'เธเธฒเธฃเนเธกเนเธเธฅเธฒเธฃเนเน€เธเธฅเธฅเนเธเธเธฒเธ”เนเธซเธเนเนเธเธเธฑเธเธซเธงเธฑเธ”เธเธเธฃเธฃเธฒเธเธชเธตเธกเธฒ เธเธณเธฅเธฑเธเธเธฒเธฃเธเธฅเธดเธ•เธฃเธงเธก 12 MWp เธเนเธฒเธขเนเธเน€เธเนเธฒเธฃเธฐเธเธเธเธฒเธฃเนเธเธเนเธฒเธชเนเธงเธเธ เธนเธกเธดเธ เธฒเธ',
        status: 'In Progress',
        stage: 'Award',
        deadline: '2026-12-20',
        constructionDate: '2026-07-01',
        codDate: '2026-12-20',
        prTest: 'PR 83%',
        pv: 'Longi 585W',
        inverter: 'Sungrow 125kW',
        awardNote: 'EPC Solar Farm project.'
      },
      {
        id: 'P-003',
        code: 'G26-003',
        name: 'Floating Solar Sirindhorn Reservoir',
        region: 'Northeast',
        engineer: 'M-003',
        businessType: 'PPA',
        investor: 'PTT',
        client: 'EGAT',
        systems: { Floating: 45.0 },
        capacity: 45.0,
        lat: 15.2089,
        lng: 105.4194,
        googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1223',
        image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=60',
        deliverables: defaultDeliverables,
        notes: 'เนเธเธฃเธเธเธฒเธฃเนเธเธฅเธฒเธฃเนเธฅเธญเธขเธเนเธณเน€เธเธทเนเธญเธเธชเธดเธฃเธดเธเธเธฃ เน€เธเนเธเธเธฒเธฃเธเธชเธฒเธเธเธฅเธฑเธเธเธฒเธเนเธฎเธเธฃเธดเธ”เธฃเนเธงเธกเธเธฑเธเนเธฃเธเนเธเธเนเธฒเธเธฅเธฑเธเธเนเธณเน€เธเธทเนเธญเธเธชเธดเธฃเธดเธเธเธฃ',
        status: 'Complete',
        stage: 'Award',
        deadline: '2026-05-10',
        constructionDate: '2026-01-15',
        codDate: '2026-05-10',
        prTest: 'PR 84%',
        pv: 'Trina 590W',
        inverter: 'Solis 110kW',
        awardNote: 'Largest floating hybrid project.'
      },
      {
        id: 'P-006',
        code: 'G26-006',
        name: 'Solar Rooftop Factory Gateway',
        region: 'East',
        engineer: 'M-003',
        businessType: 'Treading',
        investor: 'OR',
        client: 'Gateway Industrial Estate',
        systems: { Rooftop: 0.95 },
        capacity: 0.95,
        lat: 13.5936,
        lng: 101.3857,
        googleMapsLink: 'https://maps.app.goo.gl/tBwGjQyFf46d1226',
        image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop&q=60',
        deliverables: defaultDeliverables,
        notes: 'เนเธเธฃเธเธเธฒเธฃเนเธเธฅเธฒเธฃเนเธฃเธนเธเธ—เนเธญเธเธเธเธฒเธ” 950 kWp เธชเธณเธซเธฃเธฑเธเนเธฃเธเธเธฒเธเธญเธธเธ•เธชเธฒเธซเธเธฃเธฃเธกเนเธเธเธดเธเธกเน€เธเธ•เน€เธงเธขเนเธเธดเธ•เธตเน เธเธฅเธดเธ•เธเธฃเธฐเนเธชเนเธเธเนเธฒเน€เธเธทเนเธญเนเธเนเนเธเธชเธฒเธขเธเธฒเธฃเธเธฅเธดเธ•เน€เธงเธฅเธฒเธเธฅเธฒเธเธงเธฑเธ',
        status: 'Complete',
        stage: 'Award',
        deadline: '2026-03-25',
        constructionDate: '2026-02-01',
        codDate: '2026-03-25',
        prTest: 'PR 81%',
        pv: 'JA Solar 575W',
        inverter: 'SMA 100kW',
        awardNote: 'Factory rooftop trading contract.'
      }
    ];
  }
  return [];
}