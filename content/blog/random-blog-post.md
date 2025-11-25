---
title: random blog post
date: 2025-11-25T09:44:07.428Z
image: /uploads/photo-1672755735857-9c24c4827c74.avif
draft: false
---
/\*\*

\* Google Apps Script Web App for SIPEG event RSVP automation.

\* Deploy as a Web App and drop the URL into each event's front matter (\`registration_endpoint\`).

\*

\* Expected POST fields from the Hugo form:

\* - name, email (required)

\* - hp_field (honeypot)

\* - event_title, event_url, event_start, event_end, event_location

\* - gcal_calendar_id (optional override)

\* - gcal_event_id (optional existing event UID)

\* - event_join_link (Zoom/Meet URL fallback)

\* - zoom_meeting_id (optional, used if Zoom automation is enabled)

\*/



const DEFAULT_CALENDAR_ID =

  "4fc3f8409df4f4e57af519baacc9de1765bcc4939d4f02c97d5dde1fb41ee628@group.calendar.google.com";

const RSVP_SHEET_ID = "1OSDyCDQqxCdoYYk-czAz3uPyO0R-GRdMWZCSSexEinQ";

const RSVP_TAB_NAME = "Event RSVPs";

const ADMIN_ALERT_EMAIL = "info@sipeg.org";



// Zoom Server-to-Server OAuth credentials (leave blank to skip Zoom automation)

const ZOOM_ACCOUNT_ID = "YNnbkpMWS52SYZgnvWJXzw";

const ZOOM_CLIENT_ID = "DL8HEtxVQkyyZtP1M1LMjw";

const ZOOM_CLIENT_SECRET = "Gn80ecWPINiOHefxtwvlgROAHR6wA1yc";







function doPost(e) {

  try {

\    const p = e.parameter;

\    if (p.hp_field) return ok(); // spam trap



\    const name = (p.name || "").trim();

\    const email = (p.email || "").trim().toLowerCase();

\    if (!name || !email) throw new Error("Name and email are required");



\    const eventTitle = p.event_title || "SIPEG Event";

\    const calendarId = p.gcal_calendar_id || DEFAULT_CALENDAR_ID;

\    const eventStart = parseDate(p.event_start);

\    const eventEnd =

\    parseDate(p.event_end) ||

\    (eventStart ? new Date(eventStart.getTime() + 60 \* 60 \* 1000) : null);

\    const location = p.event_location || "";

\    const pageUrl = p.event_url || "";

\    const eventKey = p.event_key || pageUrl || eventTitle; // stable key to reuse a single event

\    let joinLink = p.event_join_link || "";



\    const eventId =

\    calendarId && eventStart

\    ? upsertCalendarInvite({

\    calendarId,

\    eventId: p.gcal_event_id,

\    eventTitle,

\    eventStart,

\    eventEnd,

\    location,

\    pageUrl,

\    joinLink,

\    name,

\    email,

\    eventKey,

\    })

\    : "";



\    if (shouldUseZoom() && p.zoom_meeting_id) {

\    const zoomLink = registerZoomParticipant(p.zoom_meeting_id, name, email);

\    if (zoomLink) {

\    joinLink = zoomLink;

\    }

\    }



\    logRsvp({

\    name,

\    email,

\    eventTitle,

\    eventId,

\    joinLink,

\    calendarId,

\    });



\    notifyParticipant({

\    name,

\    email,

\    eventTitle,

\    eventStart,

\    eventEnd,

\    location,

\    joinLink,

\    pageUrl,

\    });



\    notifyTeam({ name, email, eventTitle, joinLink, pageUrl });



\    return ok();

  } catch (error) {

\    Logger.log(error);

\    return ContentService.createTextOutput("Error: " + error.message);

  }

}



function upsertCalendarInvite(payload) {

  const calendar = CalendarApp.getCalendarById(payload.calendarId);

  if (!calendar) throw new Error("Calendar not found: " + payload.calendarId);



  const props = PropertiesService.getScriptProperties();

  const key = payload.eventKey ? \`event_${payload.eventKey}\` : "";

  const normalizeId = (id) => (id || "").replace(/@google\\.com$/i, "");

  let savedId = payload.eventId || (key ? props.getProperty(key) : "");

  let savedIdStripped = normalizeId(savedId);



  // Try to reuse an existing event by ID (either provided or cached)

  let event = null;

  if (savedId) {

\    event = calendar.getEventById(savedId) || calendar.getEventById(savedIdStripped);

  }



  // If no event found, create once and cache the ID for subsequent RSVPs

  if (!event) {

\    const options = {

\    location: payload.location,

\    description: buildDescription(payload.pageUrl, payload.joinLink),

\    sendInvites: false, // we'll add guests after creation

\    };

\    event = calendar.createEvent(

\    payload.eventTitle,

\    payload.eventStart,

\    payload.eventEnd || payload.eventStart,

\    options

\    );

\    savedId = event.getId();

\    savedIdStripped = normalizeId(savedId);

\    if (key) {

\    props.setProperty(key, savedId);

\    props.setProperty(\`${key}_stripped\`, savedIdStripped);

\    }

  } else {

\    // Keep description/location up to date

\    event.setDescription(buildDescription(payload.pageUrl, payload.joinLink));

\    if (payload.location) event.setLocation(payload.location);

  }



  // Add guest (safely)

  try {

\    event.addGuest(payload.email);

  } catch (err) {

\    Logger.log("addGuest error for " + payload.email + ": " + err);

  }

  return savedId || event.getId();

}



function logRsvp({ name, email, eventTitle, eventId, joinLink, calendarId }) {

  if (!RSVP_SHEET_ID || !RSVP_TAB_NAME) return;

  const sheet =

\    SpreadsheetApp.openById(RSVP_SHEET_ID).getSheetByName(RSVP_TAB_NAME);

  sheet.appendRow([

\    new Date(),

\    eventTitle,

\    name,

\    email,

\    joinLink,

\    calendarId,

\    eventId,

  ]);

}



function notifyParticipant({

  name,

  email,

  eventTitle,

  eventStart,

  eventEnd,

  location,

  joinLink,

  pageUrl,

}) {

  const firstName = name.split(" ")\[0];

  const subject = \`You’re confirmed: ${eventTitle}\`;

  const dateLine = eventStart

\    ? `${Utilities.formatDate(

\    eventStart,

\    Session.getScriptTimeZone(),

\    "EEE, d MMM yyyy HH:mm"

\    )}`

\    : "TBC";

  const endLine = eventEnd

\    ? ` to ${Utilities.formatDate(

\    eventEnd,

\    Session.getScriptTimeZone(),

\    "HH:mm"

\    )}`

\    : "";

  const body = `Hi ${firstName},



You’re confirmed for "${eventTitle}".



Date & time: ${dateLine}${endLine} (${Session.getScriptTimeZone()})

Location: ${location || "Online"}

Join link: ${joinLink || "Will be shared separately"}



Event page: ${pageUrl}



Add the event to your calendar using the invite we just sent from Google Calendar. We look forward to seeing you there!



— Team SIPEG`;



  GmailApp.sendEmail(email, subject, body);

}



function notifyTeam({ name, email, eventTitle, joinLink, pageUrl }) {

  if (!ADMIN_ALERT_EMAIL) return;

  const subject = \`New RSVP for ${eventTitle}\`;

  const body = `Name: ${name}\nEmail: ${email}\nEvent: ${eventTitle}\nJoin link: ${

\    joinLink || "(not provided)"

  }\nURL: ${pageUrl}`;

  GmailApp.sendEmail(ADMIN_ALERT_EMAIL, subject, body);

}



function buildDescription(pageUrl, joinLink) {

  const parts = \[];

  if (joinLink) parts.push(\`Join link: ${joinLink}\`);

  if (pageUrl) parts.push(\`Details: ${pageUrl}\`);

  return parts.join("\n");

}



function shouldUseZoom() {

  return ZOOM_ACCOUNT_ID && ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET;

}



function registerZoomParticipant(meetingId, name, email) {

  try {

\    const token = fetchZoomToken();

\    const response = UrlFetchApp.fetch(

\    \`https://api.zoom.us/v2/meetings/${meetingId}/registrants\`,

\    {

\    method: "post",

\    contentType: "application/json",

\    payload: JSON.stringify({

\    email,

\    first_name: name || "Guest",

\    auto_approve: true,

\    }),

\    muteHttpExceptions: true,

\    headers: {

\    Authorization: \`Bearer ${token}\`,

\    },

\    }

\    );



\    if (response.getResponseCode() >= 300) {

\    Logger.log("Zoom API error: " + response.getContentText());

\    return null;

\    }



\    const data = JSON.parse(response.getContentText());

\    return data.join_url || null;

  } catch (error) {

\    Logger.log("Zoom registration failed: " + error);

\    return null;

  }

}



function fetchZoomToken() {

  const response = UrlFetchApp.fetch(

\    "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" +

\    encodeURIComponent(ZOOM_ACCOUNT_ID),

\    {

\    method: "post",

\    headers: {

\    Authorization:

\    "Basic " +

\    Utilities.base64Encode(ZOOM_CLIENT_ID + ":" + ZOOM_CLIENT_SECRET),

\    },

\    muteHttpExceptions: true,

\    }

  );



  if (response.getResponseCode() >= 300) {

\    throw new Error("Zoom auth failed: " + response.getContentText());

  }



  const data = JSON.parse(response.getContentText());

  return data.access_token;

}



function parseDate(value) {

  if (!value) return null;

  const date = new Date(value);

  return isNaN(date.getTime()) ? null : date;

}



function ok() {

  return ContentService.createTextOutput("OK");

}