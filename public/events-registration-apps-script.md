```javascript
/**
 * Google Apps Script Web App for SIPEG event registration.
 * Deploy as a Web App: Execute as your account (or service account),
 * Anyone with the link can access.
 *
 * Expect POST params:
 * - name, email
 * - event_title, event_start, event_end, event_location, event_url
 * - gcal_calendar_id (required), gcal_event_id (required)
 * - hp_field (honeypot; should be blank)
 *
 * Adds the attendee to the specified Google Calendar event and lets Google send
 * the official invite email.
 */
function doPost(e) {
  try {
    var params = e.parameter || {};
    // basic honeypot
    if (params.hp_field) return ContentService.createTextOutput('OK');

    var calendarId = params.gcal_calendar_id;
    var eventId = params.gcal_event_id;
    var name = params.name;
    var email = params.email;

    if (!calendarId || !eventId || !email) {
      return ContentService.createTextOutput('Missing required fields');
    }

    var calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      return ContentService.createTextOutput('Calendar not found');
    }

    var event = calendar.getEventById(eventId);
    if (!event) {
      return ContentService.createTextOutput('Event not found');
    }

    // Add guest; Calendar will send the official invite email.
    event.addGuest(email);
    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err);
  }
}
```
