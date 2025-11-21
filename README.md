# SIPEG — Hugo Static Site

Production-ready Hugo site for the Shafqat Institute for Pakistan & Emerging Geopolitics (SIPEG). The project ships with curated layouts, sample content, Pagefind search, and a deploy script optimized for Hostinger.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local server with drafts enabled:
   ```bash
   npm run dev
   ```
   Visit http://localhost:1313 to browse the site.
3. Build the production bundle (includes Pagefind index):
   ```bash
   npm run build
   ```
   The generated site lives in `public/`.

## Project Structure

- `archetypes/` – Content blueprints for research, programs, events, and people.
- `assets/` – Source CSS/JS processed with Hugo Pipes.
- `layouts/` – Templates and partials (homepage, sections, shortcodes).
- `static/` – Images, favicon, and downloadable `.ics` sample.
- `content/` – Example pages to demonstrate the full experience.
- `build.sh` – Convenience script mirroring `npm run build`.

## Editing Content

- Research: add Markdown files under `content/research/` using the `research` archetype.
- Programs: manage focus areas in `content/programs/`; weights control ordering.
- Events: create entries in `content/events/` with `event_start`, `event_end`, `registration_url`, `registration_endpoint`, `gcal_calendar_id`, and `.ics` files (or use the shortcode).
- People: update bios in `content/people/`, adjusting `weight` to influence spotlight order.

Use front matter fields (`summary`, `featured_image`, `tags`) to populate cards and SEO metadata.

## Contact Form Pipeline

- The frontend posts to `/forms/contact-handler.php` (see `static/forms/contact-handler.php`). That PHP script writes each submission to `/forms/data/contact-submissions.csv` on your server **before** forwarding the payload to Google.
- Update the `GOOGLE_WEBHOOK` constant inside the PHP file with your deployed Apps Script URL and make sure `/forms/data` is writable (e.g., `chmod 775 forms/data` on Hostinger). Leave the constant empty if you want to skip Google syncing entirely.
- The Apps Script template that receives forwarded requests lives in `static/contact-apps-script.md`; deploy it as a Web App connected to the Google Sheet you want to archive submissions in.

## Newsletter + Event Automation

- **Newsletter form** – The homepage partial now submits to `/forms/newsletter-handler.php` (see `static/forms/newsletter-handler.php`). That PHP file mirrors the contact flow: it saves every subscriber to `/forms/data/newsletter-subscribers.csv`, immediately returns `OK`, then forwards the payload to the Google Apps Script plus optional Mailchimp/Substack webhooks (`MAILCHIMP_API_URL`, `MAILCHIMP_API_KEY`, `SUBSTACK_WEBHOOK`). Update those constants and ensure `/forms/data` is writable before deploying.
- **Google + welcome email** – If you want Google Sheets logging or automated welcomes, deploy the Apps Script from `static/newsletter-apps-script.md` and drop the `/exec` URL into `GOOGLE_WEBHOOK` inside the PHP handler. The script can continue to send welcome emails or forward to additional providers.
- **Event RSVP / invites** – By default, every event posts to `/forms/event-handler.php` (see `config.toml -> params.event_registration_endpoint`). That PHP handler writes RSVPs to `/forms/data/event-rsvps.csv`, returns `OK`, then forwards to the Apps Script defined in `static/event-invite-apps-script.md` which handles Google Calendar guests, Sheet logging, confirmation email, and optional Zoom auto-registration. If a specific event needs a different endpoint, override `registration_endpoint` in its front matter.
- **Metadata requirements** – Make sure each event includes `event_start`, `event_end`, `location`, `registration_url`, and optional overrides for `gcal_calendar_id`, `gcal_event_id`, and `zoom_meeting_id`. If you leave `gcal_calendar_id` blank the Apps Script will use its `DEFAULT_CALENDAR_ID` setting.
- **Config requirements** – Update `config.toml` with the paths to your local handlers (`/forms/contact-handler.php`, `/forms/newsletter-handler.php`, `/forms/event-handler.php`) plus any provider webhook URLs. Keep secrets (Mailchimp API keys, Substack tokens, Zoom OAuth details, Google Sheet IDs) outside the repo and only reference them inside the PHP or Apps Script environments.

## Search (Pagefind)

- `npm run build` (or `./build.sh`) runs Hugo and then generates `public/pagefind/`.
- The `/search` page loads the default Pagefind UI module and provides instant results across the site.

## Deployment to Hostinger

1. Run `npm run build` (or `./build.sh`).
2. Upload the contents of `public/` to your Hostinger `public_html/` directory (or desired subdirectory).
3. Verify:
   - `/events/` and `/events/example.ics` download correctly.
   - `/search/` returns results after Pagefind assets are uploaded.

## Performance & Accessibility

- CSS/JS optimized via Hugo Pipes (minify + fingerprint).
- Semantic HTML, accessible navigation, high-contrast palette, and WCAG-compliant components.
- Designed to achieve ≥95 scores on Lighthouse Performance and Accessibility (desktop).

## TinaCMS (Git-backed editor)

- Tina’s schema lives in `.tina/config.ts`. It exposes collections for Blog, Events, People, and Research so editors can update all Markdown content (front matter + body) via the Tina UI.
- Install Node (v18+) locally, run `npm install`, then start Tina alongside Hugo with:
  ```bash
  npm run tina:dev
  ```
  This launches `hugo server -D` and the Tina Studio UI. Log in with your Tina Cloud credentials (free tier: 3 collaborators / 5k API requests per month) and edits are committed straight to Git.
- Set the required env vars before running Tina commands or deploying the admin bundle:
  - `TINA_CLIENT_ID` and `TINA_TOKEN` – generated from https://app.tina.io when you create a project.
  - `TINA_BRANCH` – defaults to `main` but can be overridden (useful on preview builds).
- To publish the Tina admin UI as part of the site (e.g., served from `/admin/`), run:
  ```bash
  npm run tina:build
  ```
  This writes the static assets to `/admin`; upload that folder along with the rest of the site. Protect the URL using Basic Auth or Tina’s cloud auth so only editors can log in.
- Media uploads go to `static/` by default (see the `media` config). Adjust `mediaRoot` / `publicFolder` in `.tina/config.ts` if you want a dedicated directory such as `static/uploads`. Image fields (blog hero, research feature, event hero, people portrait) use Tina’s `image` component so editors can upload/select assets directly.
