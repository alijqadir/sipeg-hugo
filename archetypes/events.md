---
title: "{{ replace .Name "-" " " | title }}"
event_start: "{{ now.Format "2006-01-02T15:04" }}"
event_end: "{{ now.Format "2006-01-02T16:04" }}"
location: "Online"
summary: "One sentence preview of the discussion."
registration_url: "https://zoom.us/your-registration-link"
registration_endpoint: "/forms/event-handler.php"
gcal_calendar_id: "primary"
gcal_event_id: ""
zoom_meeting_id: ""
ics: "/events/example.ics"
--- 

Describe the key themes, speakers, and expected outcomes for this event.
