```javascript
/**
 * Google Apps Script Web App for SIPEG newsletter subscriptions.
 * 1. Create a new Apps Script project.
 * 2. Paste this file into Code.gs and deploy as a Web App (execute as you, accessible by anyone).
 * 3. Put the deployed URL into config.toml -> params.newsletter_endpoint.
 *
 * Fields coming from the Hugo form:
 * - name (optional)
 * - email (required)
 * - hp_field (honeypot – must be empty)
 */

const NEWSLETTER_SHEET_ID = 'YOUR_SHEET_ID';
const NEWSLETTER_TAB_NAME = 'Newsletter';
const ADMIN_ALERT_EMAIL = 'info@sipeg.org';
const SEND_WELCOME = true; // flips the welcome email sent via GmailApp

// Optional: forward contacts to an external provider (Substack, Mailchimp, etc.)
const EXTERNAL_WEBHOOK_URL = ''; // e.g. https://usX.api.mailchimp.com/3.0/lists/{listId}/members
const EXTERNAL_WEBHOOK_HEADERS = {
  // 'Authorization': 'Basic base64EncodedKey',
  // 'Content-Type': 'application/json',
};

function doPost(e) {
  try {
    const p = e.parameter;
    if (p.hp_field) return respondOk(); // bot trap

    const name = (p.name || '').trim();
    const email = (p.email || '').trim().toLowerCase();
    if (!email) throw new Error('Missing email');

    logSubscriber(name, email);
    notifyTeam(name, email);
    forwardToProvider(name, email);
    if (SEND_WELCOME) {
      sendWelcome(name, email);
    }

    return respondOk();
  } catch (error) {
    Logger.log(error);
    return respondError(error.message);
  }
}

function logSubscriber(name, email) {
  const sheet = SpreadsheetApp.openById(NEWSLETTER_SHEET_ID).getSheetByName(NEWSLETTER_TAB_NAME);
  sheet.appendRow([new Date(), name, email]);
}

function notifyTeam(name, email) {
  if (!ADMIN_ALERT_EMAIL) return;
  const subject = `New SIPEG Dispatch subscriber: ${name || email}`;
  const body = `Name: ${name || '(none)'}\nEmail: ${email}\nTimestamp: ${new Date().toISOString()}`;
  GmailApp.sendEmail(ADMIN_ALERT_EMAIL, subject, body);
}

function forwardToProvider(name, email) {
  if (!EXTERNAL_WEBHOOK_URL) return;
  const payload = {
    name,
    email,
    origin: 'sipeg-hugo',
    subscribed_at: new Date().toISOString(),
  };

  const options = {
    method: 'post',
    payload: JSON.stringify(payload),
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: EXTERNAL_WEBHOOK_HEADERS,
  };
  UrlFetchApp.fetch(EXTERNAL_WEBHOOK_URL, options);
}

function sendWelcome(name, email) {
  const firstName = name ? name.split(' ')[0] : 'there';
  const subject = 'You’re on the SIPEG Dispatch list';
  const body = `Hi ${firstName},

Thank you for subscribing to SIPEG Dispatch. We’ll share new research, policy labs, and events directly with you. If this wasn’t you, simply ignore this email.

— Team SIPEG`;
  GmailApp.sendEmail(email, subject, body);
}

function respondOk() {
  return ContentService.createTextOutput('OK');
}

function respondError(message) {
  return ContentService.createTextOutput('Error: ' + message);
}
```
