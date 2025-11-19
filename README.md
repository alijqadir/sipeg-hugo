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
- Events: create entries in `content/events/` with `datetime`, `zoom_url`, and `ics` fields.
- People: update bios in `content/people/`, adjusting `weight` to influence spotlight order.

Use front matter fields (`summary`, `featured_image`, `tags`) to populate cards and SEO metadata.

## Contact Form Endpoint

The contact form posts to a Google Apps Script URL defined in `config.toml` (`params.contact_endpoint`).

1. Create an Apps Script web app that accepts `POST` submissions and forwards them to your inbox.
2. Deploy the script, copy the live URL, and replace `REPLACE_WITH_YOUR_APPS_SCRIPT` in `config.toml`.
3. The site will automatically send form submissions to the new endpoint.

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
