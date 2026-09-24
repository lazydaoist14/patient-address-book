/**
 * Patient Address Book - Google Sheets backend.
 * Bound to the private Google Sheet used as the patient database.
 */
const PATIENT_SHEET_NAME = "Patients";
const HEADERS = ["ID","Name","Phone","Display Phone","Country Code","Address","Created At","Updated At"];
const CACHE_KEY = "patient-address-book-v1";
const CACHE_SECONDS = 120;

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index").setTitle("Patient Address Book").addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Open the Google Sheet first, then run setup().");
  let sheet = ss.getSheetByName(PATIENT_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(PATIENT_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  else sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  if (sheet.getMaxRows() > 1) sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length).setNumberFormat("@");
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());
  CacheService.getScriptCache().remove(CACHE_KEY);
  return "Setup complete. " + ss.getName() + " / " + PATIENT_SHEET_NAME;
}

function getPatients() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY);
  if (cached) return JSON.parse(cached);
  const patients = getPatientsFresh_();
  cache.put(CACHE_KEY, JSON.stringify(patients), CACHE_SECONDS);
  return patients;
}

function savePatientRecord(patient) {
  if (!patient || !String(patient.name || "").trim() || !String(patient.phone || "").trim()) throw new Error("Name and contact number are required.");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getPatientSheet_();
    const existing = getPatientsFresh_();
    const now = new Date().toISOString();
    const id = patient.id || Utilities.getUuid();
    const record = { id:id, name:String(patient.name).trim(), phone:digitsOnly_(patient.phone), displayPhone:String(patient.displayPhone || patient.phone).trim(), countryCode:String(patient.countryCode || ""), address:String(patient.address || "").trim(), createdAt:(existing.find(p => p.id === id) || {}).createdAt || now, updatedAt:now };
    if (record.phone.length < 8) throw new Error("Please enter a valid contact number.");
    const row = [[record.id,record.name,record.phone,record.displayPhone,record.countryCode,record.address,record.createdAt,record.updatedAt]];
    const lastRow = sheet.getLastRow();
    let targetRow = -1;
    if (lastRow >= 2) {
      const ids = sheet.getRange(2,1,lastRow-1,1).getDisplayValues().flat();
      const index = ids.indexOf(id);
      if (index !== -1) targetRow = index + 2;
    }
    if (targetRow === -1) targetRow = sheet.getLastRow() + 1;
    sheet.getRange(targetRow,1,1,HEADERS.length).setNumberFormat("@");
    sheet.getRange(targetRow,1,1,HEADERS.length).setValues(row);
    CacheService.getScriptCache().remove(CACHE_KEY);
    return {ok:true, patients:getPatientsFresh_()};
  } finally { lock.releaseLock(); }
}

function deletePatientRecord(id) {
  if (!id) throw new Error("Patient ID is required.");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getPatientSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const ids = sheet.getRange(2,1,lastRow-1,1).getDisplayValues().flat();
      const index = ids.indexOf(id);
      if (index !== -1) sheet.deleteRow(index + 2);
    }
    CacheService.getScriptCache().remove(CACHE_KEY);
    return {ok:true, patients:getPatientsFresh_()};
  } finally { lock.releaseLock(); }
}

function getPatientSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Run setup() once from the Sheet Apps Script editor.");
  const sheet = SpreadsheetApp.openById(id).getSheetByName(PATIENT_SHEET_NAME);
  if (!sheet) throw new Error("Patients sheet not found. Run setup() again.");
  return sheet;
}

function getPatientsFresh_() {
  const sheet = getPatientSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2,1,lastRow-1,HEADERS.length).getDisplayValues().filter(r => r[0] && r[1] && r[2]).map(r => ({id:r[0],name:r[1],phone:r[2],displayPhone:r[3] || r[2],countryCode:r[4] || "",address:r[5] || "",createdAt:r[6] || "",updatedAt:r[7] || ""}));
}

function digitsOnly_(value) { return String(value || "").replace(/\\D/g, ""); }
