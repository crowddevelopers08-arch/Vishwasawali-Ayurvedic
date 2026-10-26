/* ============================================================
   Google Apps Script (Client Feedback)

   Writes private feedback from the review funnel into one tab:

   "Client Feedback"  <- app/api/feedback/route.ts  (1-3 star ratings from /)
        { type: 'feedback', timestamp, name, email, phone, rating, suggestions, source }

   Rows are written by header name instead of fixed column position so the
   tab can tolerate extra manual columns without breaking submissions.

   DEPLOY / UPDATE
     1. Paste this file into Extensions > Apps Script, replacing Code.gs.
     2. Run `setupSheets` once (approve the permissions prompt).
     3. Deploy > Manage deployments > edit the existing web app >
        Version: "New version" > Deploy.
        Editing the existing deployment keeps the same /exec URL, so
        GOOGLE_SHEETS_WEBHOOK_URL does not change.
     4. Optional: run `testFeedback` to check the tab.
   ============================================================ */

var FEEDBACK_TAB = 'Client Feedback';
var FEEDBACK_HEADER_COLOR = '#4E5426';
var FEEDBACK_HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Rating', 'Suggestions', 'Source', 'Status'];
var FEEDBACK_WIDTHS = [170, 170, 220, 130, 90, 380, 260, 120];

/**
 * Comma-separated addresses that get an email for every new feedback entry,
 * e.g. 'manager@example.com, owner@gmail.com'. Leave empty to turn
 * the email off. Mail goes out from the Google account that deploys the script.
 */
var FEEDBACK_NOTIFY_EMAILS = '';

/* ============================================================
   WEB APP ENTRY POINTS
   ============================================================ */

function doGet() {
  return _json({ status: 'Feedback API is live' });
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return _json({ error: 'Empty request body' });
  }

  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return _json({ error: 'Invalid JSON body' });
  }

  if (data.type !== 'feedback') {
    return _json({ error: 'Unsupported submission type' });
  }

  // Two submissions landing together would otherwise compute the same
  // "next row" and style each other's rows.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return _json({ error: 'Server busy, please retry' });
  }

  var ts = data.timestamp || _nowIST();
  var row;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    row = appendFeedbackRow(getOrCreateFeedbackSheet(ss), data, ts);
    SpreadsheetApp.flush();
  } catch (err) {
    return _json({ error: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }

  _notifyFeedback(data, ts);
  return _json({ success: true, tab: FEEDBACK_TAB, row: row });
}

/* ============================================================
   ONE-TIME SETUP / MANUAL TESTS  (run from the editor)
   ============================================================ */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log((ss.getSheetByName(FEEDBACK_TAB) ? 'OK: ' : 'Created: ') + FEEDBACK_TAB);
  getOrCreateFeedbackSheet(ss);
  Logger.log('setupSheets complete.');
}

function testFeedback() {
  var res = doPost({ postData: { contents: JSON.stringify({
    type: 'feedback',
    name: 'Test Patient',
    email: 'test@example.com',
    phone: '9876543210',
    rating: '2/5',
    suggestions: 'TEST ROW - safe to delete. Waiting time was longer than expected.',
    source: 'Apps Script testFeedback()'
  }) } });
  Logger.log(res.getContent());
}

/* ============================================================
   CLIENT FEEDBACK
   ============================================================ */

function getOrCreateFeedbackSheet(ss) {
  var sheet = ss.getSheetByName(FEEDBACK_TAB);
  if (sheet) return sheet;

  sheet = ss.insertSheet(FEEDBACK_TAB);
  _initSheet(sheet, FEEDBACK_HEADERS, FEEDBACK_WIDTHS, FEEDBACK_HEADER_COLOR);

  // Status column: a dropdown the team updates as they follow up.
  var statusCol = FEEDBACK_HEADERS.indexOf('Status') + 1;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['New', 'Contacted', 'Resolved'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1).setDataValidation(rule);

  return sheet;
}

function appendFeedbackRow(sheet, data, ts) {
  var result = _appendByHeaders(sheet, {
    'Timestamp': ts,
    'Name': data.name,
    'Email': data.email,
    'Phone': data.phone,
    'Rating': data.rating,
    'Suggestions': data.suggestions,
    'Source': data.source,
    'Status': 'New'
  }, FEEDBACK_HEADERS, FEEDBACK_HEADER_COLOR, { textColumns: ['Phone', 'Rating'] });

  // Suggestions can run long: wrap and let the row grow.
  _styleRow(sheet, result.row, result.headers.length);
  _centerColumns(sheet, result.headers, result.row, ['Phone', 'Rating', 'Status']);
  var idx = result.headers.indexOf('Suggestions');
  if (idx !== -1) {
    sheet.getRange(result.row, idx + 1).setWrap(true).setVerticalAlignment('top');
  }
  return result.row;
}

function _notifyFeedback(data, ts) {
  var to = String(FEEDBACK_NOTIFY_EMAILS || '').trim();
  if (!to) return;

  try {
    var body = [
      'New client feedback from the review page.',
      '',
      'Rating:      ' + (data.rating || 'Not given'),
      'Name:        ' + (data.name || ''),
      'Phone:       ' + (data.phone || ''),
      'Email:       ' + (data.email || ''),
      'Received:    ' + ts,
      '',
      'Suggestions:',
      String(data.suggestions || ''),
      '',
      'Sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    ].join('\n');

    MailApp.sendEmail({
      to: to,
      subject: 'Client feedback (' + (data.rating || 'no rating') + ') - ' + (data.name || 'Client'),
      body: body,
      replyTo: data.email || undefined
    });
  } catch (err) {
    // The row is already saved; a mail failure must not fail the submission.
    Logger.log('Feedback email failed: ' + err);
  }
}

/* ============================================================
   SHARED HELPERS
   ============================================================ */

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _nowIST() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd/MM/yyyy, hh:mm:ss a');
}

/**
 * Free text from a public form must never be read as a formula: a value
 * starting with = + - or @ is stored as plain text.
 */
function _safe(value) {
  if (value === null || value === undefined) return '';
  var s = String(value).trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function _initSheet(sheet, headers, widths, color) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  _styleHeader(sheet, headers.length, color);
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.setFrozenRows(1);
  try {
    if (!sheet.getFilter()) sheet.getRange(1, 1, 1, headers.length).createFilter();
  } catch (err) {
    Logger.log('Filter skipped on ' + sheet.getName() + ': ' + err);
  }
}

function _styleHeader(sheet, colCount, bgColor) {
  sheet.getRange(1, 1, 1, colCount)
    .setBackground(bgColor)
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 42);
}

function _styleRow(sheet, rowIndex, colCount) {
  sheet.getRange(rowIndex, 1, 1, colCount)
    .setBackground(rowIndex % 2 === 0 ? '#f8f6f2' : '#ffffff')
    .setFontColor('#1a1c1b')
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('left')
    .setBorder(false, false, true, false, false, false, '#e5dfd6', SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Write one row, matching values to the tab's current header row.
 * `opts.textColumns` are formatted as plain text first so phone numbers
 * and ratings like "2/5" are not turned into numbers or dates.
 */
function _appendByHeaders(sheet, valueMap, defaultHeaders, headerColor, opts) {
  if (sheet.getLastRow() === 0) {
    _initSheet(sheet, defaultHeaders, [], headerColor);
  }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h).trim();
  });

  // Columns added to the defaults after the tab was created get appended.
  defaultHeaders.forEach(function (h) {
    if (headers.indexOf(h) === -1) {
      headers.push(h);
      sheet.getRange(1, headers.length).setValue(h);
      _styleHeader(sheet, headers.length, headerColor);
    }
  });

  var row = headers.map(function (h) {
    return Object.prototype.hasOwnProperty.call(valueMap, h) ? _safe(valueMap[h]) : '';
  });

  var nextRow = sheet.getLastRow() + 1;
  var textColumns = (opts && opts.textColumns) || [];
  textColumns.forEach(function (name) {
    var idx = headers.indexOf(name);
    if (idx !== -1) sheet.getRange(nextRow, idx + 1).setNumberFormat('@');
  });
  sheet.getRange(nextRow, 1, 1, headers.length).setValues([row]);

  return { row: nextRow, headers: headers };
}

function _centerColumns(sheet, headers, rowIndex, names) {
  names.forEach(function (name) {
    var idx = headers.indexOf(name);
    if (idx !== -1) sheet.getRange(rowIndex, idx + 1).setHorizontalAlignment('center');
  });
}
