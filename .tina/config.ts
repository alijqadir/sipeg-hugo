import { defineConfig } from "tinacms";

const branch =
  process.env.TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",
  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },
  schema: {
    collections: [
      {
        name: "blog",
        label: "Blog",
        path: "content/blog",
        format: "md",
        match: {
          exclude: "_index",
        },
        ui: {
          defaultItem: {
            draft: false,
            date: new Date().toISOString(),
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Publish Date",
            required: true,
          },
          {
            type: "string",
            name: "summary",
            label: "Summary",
          },
          {
            type: "string",
            name: "abstract",
            label: "Abstract",
          },
          {
            type: "string",
            name: "description",
            label: "SEO Description",
          },
          {
            type: "string",
            list: true,
            name: "author",
            label: "Authors",
          },
          {
            type: "string",
            list: true,
            name: "topics",
            label: "Topics",
          },
          {
            type: "string",
            list: true,
            name: "categories",
            label: "Categories",
          },
          {
            type: "string",
            name: "image",
            label: "Featured Image",
            ui: { component: "image" },
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
            ui: { defaultValue: false },
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
      {
        name: "research",
        label: "Research",
        path: "content/research",
        format: "md",
        match: {
          exclude: "_index",
        },
        ui: {
          defaultItem: {
            draft: false,
            date: new Date().toISOString(),
          },
        },
        fields: [
          { type: "string", name: "title", label: "Title", required: true },
          { type: "datetime", name: "date", label: "Publish Date" },
          { type: "string", name: "summary", label: "Summary" },
          {
            type: "string",
            name: "author",
            label: "Authors",
            list: true,
          },
          {
            type: "string",
            name: "topics",
            label: "Topics/Tags",
            list: true,
          },
          {
            type: "string",
            name: "featured_image",
            label: "Featured Image",
            ui: { component: "image" },
          },
          { type: "boolean", name: "draft", label: "Draft" },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
      {
        name: "events",
        label: "Events",
        path: "content/events",
        format: "md",
        match: {
          exclude: "_index",
        },
        ui: {
          defaultItem: {
            draft: false,
          },
        },
        fields: [
          { type: "string", name: "title", label: "Title", required: true },
          {
            type: "datetime",
            name: "date",
            label: "Publish Date",
          },
          {
            type: "datetime",
            name: "event_start",
            label: "Event Start",
            required: true,
          },
          {
            type: "datetime",
            name: "event_end",
            label: "Event End",
          },
          { type: "string", name: "location", label: "Location" },
          { type: "string", name: "summary", label: "Summary" },
          {
            type: "string",
            list: true,
            name: "tags",
            label: "Tags",
          },
          {
            type: "string",
            name: "registration_url",
            label: "Registration URL",
          },
          {
            type: "string",
            name: "registration_endpoint",
            label: "Registration Endpoint Override",
          },
          {
            type: "string",
            name: "gcal_calendar_id",
            label: "Google Calendar ID Override",
          },
          {
            type: "string",
            name: "gcal_event_id",
            label: "Existing Google Event ID",
          },
          {
            type: "string",
            name: "zoom_meeting_id",
            label: "Zoom Meeting ID",
          },
          {
            type: "string",
            name: "image",
            label: "Hero Image",
            ui: {
              component: "image",
            },
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
            ui: { defaultValue: false },
          },
          {
            type: "rich-text",
            name: "body",
            label: "Event Details",
            isBody: true,
          },
        ],
      },
      {
        name: "people",
        label: "People",
        path: "content/people",
        format: "md",
        match: {
          exclude: "_index",
        },
        ui: {
          defaultItem: {
            weight: 10,
          },
        },
        fields: [
          { type: "string", name: "title", label: "Name", required: true },
          { type: "string", name: "role", label: "Role" },
          { type: "string", name: "affiliation", label: "Affiliation" },
          { type: "string", name: "email", label: "Email" },
          {
            type: "string",
            name: "image",
            label: "Image",
            ui: { component: "image" },
          },
          { type: "string", name: "summary", label: "Summary" },
          {
            type: "number",
            name: "weight",
            label: "Weight",
            ui: { step: 1 },
          },
          {
            type: "rich-text",
            name: "body",
            label: "Bio",
            isBody: true,
          },
        ],
      },
    ],
  },
});
