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

## Decap CMS (self-hosted editor)

- The CMS lives at `/admin/` (see `static/admin/`). It’s completely static, so once you deploy the site you can visit `https://your-domain/admin/` to log in.
- Configuration is in `static/admin/config.yml`. Collections are already set up for Blog, Research, Events, and People and save directly into the existing Hugo folders with the correct front matter fields.
- Media uploads go into `static/uploads/` (see the placeholder `.gitkeep`). Decap automatically references them via `/uploads/...`.
- Authentication: For a self-hosted GitHub workflow you need a GitHub OAuth App plus a small proxy (for example, the [official Decap OAuth provider](https://github.com/DecapOrg/oauth-provider)). Steps:
  1. Create a GitHub OAuth App (GitHub → Settings → Developer settings → OAuth Apps). Set **Homepage URL** to your site and **Authorization callback URL** to your OAuth proxy (e.g., `https://cms.yoursite.com/callback`).
  2. Deploy the OAuth provider (can be on Netlify/Vercel/Render). Supply the GitHub client ID/secret and the repo (`alijqadir/sipeg-hugo`) via environment variables.
  3. Update `static/admin/config.yml` with your repo/branch and the OAuth endpoint (`backend.base_url` / `auth_endpoint`) if needed. The current file points to GitHub backend on `master`.
  4. After deploying, editors visit `/admin/`, authenticate via GitHub, and commit changes through Decap’s UI.
- If you prefer Netlify Identity instead of GitHub OAuth, switch the backend block in `config.yml` to `name: git-gateway` and enable Identity + Git Gateway on Netlify; no code changes are needed.
