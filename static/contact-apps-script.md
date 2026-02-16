```javascript
/**
 * Google Apps Script Web App for SIPEG contact form.
 * Deploy as Web App: Execute as me (or service account), Anyone can access.
 * Set the endpoint URL into config.toml -> params.contact_endpoint.
 *
 * Required form fields (POST):
 * - name, email, message
 * Optional: phone, organization
 * Honeypot: hp_field (must stay blank)
 */
const SHEET_ID = 'YOUR_SHEET_ID';
const TAB_NAME = 'Contact';

function doPost(e) {
  try {
    const p = e.parameter;
    if (p.hp_field) return respondOk(); // honeypot
    appendToSheet(buildRow(p));
    return respondOk();
  } catch (err) {
    Logger.log(err);
    return ContentService.createTextOutput('Error: ' + err);
  }
}

function buildRow(p) {
  return [
    new Date().toISOString(),
    p.name || '',
    p.email || '',
    p.phone || '',
    p.organization || '',
    (p.message || '').replace(/\r?\n/g, ' ').trim(),
  ];
}

function appendToSheet(row) {
  if (!SHEET_ID || !TAB_NAME) return;
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB_NAME);
  sheet.appendRow(row);
}

function respondOk() {
  return ContentService.createTextOutput('OK');
}
```
