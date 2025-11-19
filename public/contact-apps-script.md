```javascript
/**
 * Google Apps Script Web App for SIPEG contact form.
 * Deploy as Web App: Execute as me (or service account), Anyone can access.
 * Set the endpoint URL into config.toml -> params.contact_endpoint.
 *
 * Required query params (POST):
 * - name, email, message
 * Optional: organization
 * Honeypot: address (should be blank)
 *
 * Stores to a Google Sheet: provide SHEET_ID and TAB_NAME below.
 * Returns a plain "OK" on success so the site JS can show a confirmation.
 */
const SHEET_ID = 'YOUR_SHEET_ID';
const TAB_NAME = 'Contact';

function doPost(e) {
  try {
    const p = e.parameter;
    if (p.address) return ContentService.createTextOutput('OK'); // honeypot
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB_NAME);
    sheet.appendRow([
      new Date(),
      p.name || '',
      p.email || '',
      p.organization || '',
      p.message || ''
    ]);
    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err);
  }
}
```
