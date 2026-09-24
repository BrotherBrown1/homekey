/**
 * PocketGrants → Google Sheets
 *
 * Receives leads and grant-check results from the PocketGrants website and
 * writes them into this spreadsheet. It creates and formats its own tabs
 * the first time data arrives:
 *
 *   Leads           one row per lead, newest first, sortable and filterable
 *   Summary         leads by state, income tier, priority, and source
 *   Daily           leads, callback requests, and hot leads per day
 *   Program Checks  every automatic check of a grant program's official page
 *
 * Setup: Extensions → Apps Script, replace everything with this file, Save,
 * then Deploy → New deployment → Web app (Execute as: Me; Who has access:
 * Anyone). Put the Web app URL in Vercel as GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * You can add your own columns to the right of "Lead ID" and use the
 * Status and Notes columns freely; this script never overwrites them.
 */

var SETUP_VERSION = "1";
var TIME_ZONE = "America/Detroit";

var LEAD_HEADERS = [
  "Received", "Priority", "Status", "Name", "Email", "Phone", "Wants callback",
  "Source", "State", "County", "City", "Household size", "Annual income",
  "Income band", "% of area median", "Income tier", "Target price",
  "Credit score", "Credit band", "First-time buyer", "Military", "Profession",
  "Grants matched", "Loans matched", "Biggest grant", "Top programs",
  "Notes", "Lead ID"
];

var CHECK_HEADERS = [
  "Checked", "Result", "Program", "Where", "What changed / notes",
  "Confidence", "Official page", "Program ID"
];

var STATUS_OPTIONS = ["New", "Contacted", "Working", "Under contract", "Closed", "Not a fit"];

// ---------------------------------------------------------------- Web app

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSetup_(ss);
    if (body.type === "lead" && body.lead) {
      var added = addLead_(ss, body.lead);
      return json_({ ok: true, added: added });
    }
    if (body.type === "program_checks" && body.checks) {
      addChecks_(ss, body.checks);
      return json_({ ok: true, added: body.checks.length });
    }
    return json_({ ok: false, error: "unknown payload type: " + body.type });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("PocketGrants is connected to this sheet.");
}

/** Optional: run from the editor to build the tabs before any data arrives. */
function setup() {
  setup_(SpreadsheetApp.getActiveSpreadsheet());
}

// ------------------------------------------------------------------ Leads

function addLead_(ss, l) {
  var sheet = ss.getSheetByName("Leads");
  var idCol = LEAD_HEADERS.indexOf("Lead ID") + 1;

  // Idempotent: a retried delivery of the same lead is ignored.
  if (l.leadId) {
    var found = sheet.getRange(2, idCol, Math.max(sheet.getMaxRows() - 1, 1), 1)
      .createTextFinder(String(l.leadId)).matchEntireCell(true).findNext();
    if (found) return false;
  }

  var values = [
    new Date(l.receivedAt),
    l.priority || "",
    "New",
    text_(l.name),
    text_(l.email),
    text_(l.phone),
    l.wantsCallback || "",
    text_(l.source),
    text_(l.state),
    text_(l.county),
    text_(l.city),
    l.householdSize === undefined ? "" : l.householdSize,
    l.annualIncome === undefined ? "" : l.annualIncome,
    l.incomeBand || "",
    l.amiPercent === undefined ? "" : l.amiPercent,
    l.amiTier || "",
    l.targetPrice === undefined ? "" : l.targetPrice,
    l.creditScore === undefined ? "" : l.creditScore,
    l.creditBand || "",
    l.firstTimeBuyer || "",
    text_(l.military),
    text_(l.profession),
    l.grantsMatched || 0,
    l.loansMatched || 0,
    l.biggestGrant || 0,
    text_(l.topPrograms),
    "",
    text_(l.leadId)
  ];

  sheet.insertRowsBefore(2, 1);
  var row = sheet.getRange(2, 1, 1, LEAD_HEADERS.length);
  row.setFontWeight("normal").setBackground(null).setFontColor(null);
  applyLeadFormats_(sheet, 2, 1);
  row.setValues([values]);
  sheet.getRange(2, col_(LEAD_HEADERS, "Status")).setDataValidation(statusRule_());
  return true;
}

function applyLeadFormats_(sheet, startRow, numRows) {
  var fmt = function (name, pattern) {
    sheet.getRange(startRow, col_(LEAD_HEADERS, name), numRows, 1).setNumberFormat(pattern);
  };
  fmt("Received", "yyyy-mm-dd h:mm am/pm");
  fmt("Phone", "@");
  fmt("Annual income", "$#,##0");
  fmt("% of area median", '0"%"');
  fmt("Target price", "$#,##0");
  fmt("Biggest grant", "$#,##0");
  fmt("Lead ID", "@");
}

// --------------------------------------------------------- Program checks

function addChecks_(ss, checks) {
  if (!checks.length) return;
  var sheet = ss.getSheetByName("Program Checks");
  var values = checks.map(function (c) {
    return [
      new Date(c.checkedAt),
      c.result || "",
      text_(c.program),
      text_(c.where),
      text_(c.details),
      c.confidence || "",
      text_(c.sourceUrl),
      text_(c.programId)
    ];
  });
  sheet.insertRowsBefore(2, values.length);
  var range = sheet.getRange(2, 1, values.length, CHECK_HEADERS.length);
  range.setFontWeight("normal").setBackground(null).setFontColor(null);
  sheet.getRange(2, 1, values.length, 1).setNumberFormat("yyyy-mm-dd h:mm am/pm");
  range.setValues(values);
}

// ------------------------------------------------------------------ Setup

function ensureSetup_(ss) {
  var props = PropertiesService.getDocumentProperties();
  if (props.getProperty("setupVersion") === SETUP_VERSION) return;
  setup_(ss);
  props.setProperty("setupVersion", SETUP_VERSION);
}

function setup_(ss) {
  ss.setSpreadsheetTimeZone(TIME_ZONE);

  // Reuse the blank default tab as "Leads" rather than leaving it behind.
  var leads = ss.getSheetByName("Leads");
  if (!leads) {
    var first = ss.getSheets()[0];
    if (first && first.getLastRow() === 0 && /^(Sheet1|Feuille 1|Hoja 1)$/.test(first.getName())) {
      first.setName("Leads");
      leads = first;
    } else {
      leads = ss.insertSheet("Leads");
    }
  }
  writeHeader_(leads, LEAD_HEADERS);
  leads.getRange(2, col_(LEAD_HEADERS, "Status"), leads.getMaxRows() - 1, 1).setDataValidation(statusRule_());
  applyLeadFormats_(leads, 2, leads.getMaxRows() - 1);
  if (!leads.getFilter()) leads.getRange(1, 1, leads.getMaxRows(), LEAD_HEADERS.length).createFilter();
  var widths = { "Received": 150, "Priority": 70, "Status": 110, "Name": 160, "Email": 210, "Phone": 120, "Source": 180, "Income tier": 170, "Top programs": 320, "Notes": 240 };
  Object.keys(widths).forEach(function (h) { leads.setColumnWidth(col_(LEAD_HEADERS, h), widths[h]); });
  highlight_(leads, col_(LEAD_HEADERS, "Priority"), { "Hot": "#fde2e1", "Warm": "#fef3c7", "Cold": "#f3f4f6" });

  var checks = ss.getSheetByName("Program Checks") || ss.insertSheet("Program Checks");
  writeHeader_(checks, CHECK_HEADERS);
  checks.setColumnWidth(col_(CHECK_HEADERS, "Program"), 260);
  checks.setColumnWidth(col_(CHECK_HEADERS, "What changed / notes"), 420);
  highlight_(checks, col_(CHECK_HEADERS, "Result"), {
    "OK": "#dcfce7", "Changed": "#fef3c7", "Unreachable": "#fde2e1",
    "Needs better link": "#dbeafe", "Error": "#fde2e1", "Skipped": "#f3f4f6"
  });

  buildSummary_(ss);
  buildDaily_(ss);

  // Tab order: Leads, Summary, Daily, Program Checks.
  ["Leads", "Summary", "Daily", "Program Checks"].forEach(function (name, i) {
    ss.setActiveSheet(ss.getSheetByName(name));
    ss.moveActiveSheet(i + 1);
  });
  ss.setActiveSheet(leads);
}

function buildSummary_(ss) {
  var sheet = ss.getSheetByName("Summary") || ss.insertSheet("Summary");
  sheet.clear();
  var L = function (h) { return letter_(col_(LEAD_HEADERS, h)); };
  var data = "Leads!A2:" + letter_(LEAD_HEADERS.length);
  var blocks = [
    ["Leads by state",
      "select " + L("State") + ", count(" + L("Received") + "), avg(" + L("Annual income") + "), avg(" + L("% of area median") + ") " +
      "where " + L("Received") + " is not null and " + L("State") + " <> '' group by " + L("State") +
      " order by count(" + L("Received") + ") desc label " + L("State") + " 'State', count(" + L("Received") + ") 'Leads', avg(" +
      L("Annual income") + ") 'Avg income', avg(" + L("% of area median") + ") 'Avg % of AMI'"],
    ["Callbacks by state",
      "select " + L("State") + ", count(" + L("Received") + ") where " + L("Wants callback") + " = 'Yes' and " + L("State") +
      " <> '' group by " + L("State") + " order by count(" + L("Received") + ") desc label " + L("State") + " 'State', count(" +
      L("Received") + ") 'Callbacks'"],
    ["By income tier",
      "select " + L("Income tier") + ", count(" + L("Received") + ") where " + L("Income tier") + " <> '' group by " +
      L("Income tier") + " order by count(" + L("Received") + ") desc label " + L("Income tier") + " 'Income tier', count(" +
      L("Received") + ") 'Leads'"],
    ["By priority",
      "select " + L("Priority") + ", count(" + L("Received") + ") where " + L("Priority") + " <> '' group by " +
      L("Priority") + " label " + L("Priority") + " 'Priority', count(" + L("Received") + ") 'Leads'"],
    ["By source",
      "select " + L("Source") + ", count(" + L("Received") + ") where " + L("Source") + " <> '' group by " +
      L("Source") + " order by count(" + L("Received") + ") desc label " + L("Source") + " 'Source', count(" +
      L("Received") + ") 'Leads'"],
    ["By status",
      "select " + L("Status") + ", count(" + L("Received") + ") where " + L("Status") + " <> '' group by " +
      L("Status") + " label " + L("Status") + " 'Status', count(" + L("Received") + ") 'Leads'"]
  ];
  var col = 1;
  blocks.forEach(function (b) {
    sheet.getRange(1, col).setValue(b[0]).setFontWeight("bold");
    sheet.getRange(2, col).setFormula('=IFERROR(QUERY(' + data + ', "' + b[1] + '", 0), "No leads yet")');
    col += (b[0] === "Leads by state") ? 5 : 3;
  });
  sheet.setFrozenRows(1);
}

function buildDaily_(ss) {
  var sheet = ss.getSheetByName("Daily") || ss.insertSheet("Daily");
  sheet.clear();
  var L = function (h) { return letter_(col_(LEAD_HEADERS, h)); };
  var data = "Leads!A2:" + letter_(LEAD_HEADERS.length);
  var R = L("Received");
  var blocks = [
    ["Leads per day", "", "Leads"],
    ["Callback requests per day", " and " + L("Wants callback") + " = 'Yes'", "Callbacks"],
    ["Hot leads per day", " and " + L("Priority") + " = 'Hot'", "Hot leads"]
  ];
  var col = 1;
  blocks.forEach(function (b) {
    var q = "select toDate(" + R + "), count(" + R + ") where " + R + " is not null" + b[1] +
      " group by toDate(" + R + ") order by toDate(" + R + ") desc label toDate(" + R + ") 'Date', count(" + R + ") '" + b[2] + "'";
    sheet.getRange(1, col).setValue(b[0]).setFontWeight("bold");
    sheet.getRange(2, col).setFormula('=IFERROR(QUERY(' + data + ', "' + q + '", 0), "None yet")');
    sheet.getRange(3, col, 400, 1).setNumberFormat("ddd, mmm d, yyyy");
    col += 3;
  });
  sheet.setFrozenRows(1);
}

// ---------------------------------------------------------------- Helpers

function writeHeader_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight("bold").setBackground("#111827").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

function highlight_(sheet, column, colors) {
  var range = sheet.getRange(2, column, sheet.getMaxRows() - 1, 1);
  var rules = sheet.getConditionalFormatRules().filter(function (r) {
    return !r.getRanges().some(function (x) { return x.getColumn() === column; });
  });
  Object.keys(colors).forEach(function (value) {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(value).setBackground(colors[value]).setRanges([range]).build());
  });
  sheet.setConditionalFormatRules(rules);
}

function statusRule_() {
  return SpreadsheetApp.newDataValidation().requireValueInList(STATUS_OPTIONS, true).setAllowInvalid(true).build();
}

/** 1-based column index of a header. Throws if the header is missing. */
function col_(headers, name) {
  var i = headers.indexOf(name);
  if (i < 0) throw new Error("Unknown column: " + name);
  return i + 1;
}

/** 1 → A, 27 → AA. */
function letter_(n) {
  var s = "";
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Store user-supplied text as text. A value starting with = + - or @ would
 * otherwise be interpreted by Sheets as a formula (formula injection).
 */
function text_(v) {
  if (v === undefined || v === null) return "";
  var s = String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
