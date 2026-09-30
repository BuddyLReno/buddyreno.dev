# AGENTS.md

Instructions for AI coding agents (and humans) working on buddyreno.dev, a personal site built with
Astro 7, Tailwind CSS v4, and Web Awesome 3 on the **Rivendell** design system.

**Before any UI work, read [`DESIGN.md`](DESIGN.md).** It is the design brief: tokens, themes, tones, the
component vocabulary, and the do/don't list. Reuse what it lists before building anything new. Browse every
piece live at `/styleguide/`.

## Setup

- Node 24 (`.node-version`), managed by mise. If `node`/`npm` is missing in a non-interactive shell, run
  `export PATH="$HOME/.local/share/mise/installs/node/24/bin:$PATH"` first. In an interactive terminal,
  a freshly opened shell picks it up automatically.
- `npm install`

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:4321 (styleguide at `/styleguide/`) |
| `npm test` | Vitest, pinned to `TZ=America/Chicago` so date tests catch UTC shifts |
| `npx astro check` | Type check. Must report 0 errors, 0 warnings, 0 hints |
| `npm run build` | Static build to `dist/` |
| `npm run contrast` | Builds, then checks WCAG AA for every theme × mode × tone in Chromium (Playwright) |
| `npm run screenshots` | Builds, then writes styleguide screenshots to `screenshots/` (gitignored) |
| `npm run worker:dev` | Contact form Worker locally (reads `worker/.dev.vars`, gitignored; use Turnstile test keys) |
| `npm run worker:deploy` | Deploys the contact Worker to Cloudflare (route `buddyreno.dev/api/contact`) |

**Definition of done** for any change: `npm test`, `npx astro check`, and, for anything touching color,
tokens, tones, or components, `npm run contrast`, all green. Add or update tests with the change.

## Layout

```
src/styles/        tokens.css (inputs + derived roles), themes/, tones.css, base.css, prose.css,
                   code.css, webawesome-theme.css, global.css (entry + Tailwind @theme), tokens.test.ts (CSS lint)
src/components/    Rivendell components; layout/ (Section, Container, Stack, SiteHeader, SiteFooter);
                   styleguide/ (styleguide-only helpers); types.ts
src/layouts/       Base, Page, Post, Project
src/pages/         routes; index.astro (homepage), contact/ (form + thanks), styleguide.astro; blog/, projects/, [slug].astro
src/data/          home.ts and contact.ts: all homepage and contact copy (see Content below)
src/content/       posts/, projects/, pages/ (Markdown/MDX); schema in src/content.config.ts
src/scripts/       theme-init.js (inlined, blocking theme/mode runtime → window.rvd), webawesome.ts
src/lib/           contrast, format (dates, reading time), content (drafts), schema (httpUrl), lastfm (Recent Listens)
public/            CNAME, favicon.svg, apple-touch-icon.png, og.png (share card)
scripts/           check-contrast.mjs, screenshots.mjs, lib/preview.mjs
worker/            Cloudflare Worker for /api/contact (Turnstile + Email Routing); shares src/data/contact.ts
docs/superpowers/  design spec and implementation plan (history; the spec explains the "why")
```

## Content

Copy lives in data files, not markup. Change the data; the pages follow.

- **`src/data/home.ts`**: bio, social links, Now rows, projects, tools, experience, testimonials, Favorite
  Reads, Last.fm settings.
  - A Now row whose `text` is an array shows one entry at random on each load (Reading does this). The
    first entry is the no-JS fallback.
  - `showProjects` hides or shows "Things I've made" (off until work projects are written up).
  - An empty `intro.availability` hides the status line.
  - `testimonials` are excerpts from LinkedIn recommendations; keep their exact wording and mark cuts with "…".
- **`src/data/contact.ts`**: contact page copy, reason options, error messages, the Turnstile site key.
  The Worker imports `reasons` and `messageMinLength` from here, so both sides stay in sync.
- **Band order** on the homepage alternates colored and plain tones so two colors never touch
  (`_home.test.ts` pins the order). Re-check that when adding, hiding, or moving a section.
- **Share card** `public/og.png` is a 1200×630 screenshot of the homepage intro. It doesn't update itself:
  re-render it (Playwright, intro only, light mode) when the photo or bio changes.
- **Photo** is `src/assets/images/profile.jpg`.


## Rules that tests enforce

These fail the suite if broken; don't weaken the tests to get green.

- Every `var(--rvd-*)` or quoted `'--rvd-*'` token must be declared in `src/styles/`.
- A custom property whose value uses `var(--rvd-…)` must be declared on `:root, [data-rvd-tone]` (or a
  tone rule), never `:root` alone, or it won't recolor inside section tones.
- The same applies to Web Awesome composites that reference a `--wa-*` we override (e.g. `--wa-focus-ring`).
- Every `--wa-*` override lives in `src/styles/webawesome-theme.css` and must exist in the installed Web Awesome.
- Theme files in `src/styles/themes/` must match `THEMES` in `src/scripts/theme-init.js` and be imported
  in `global.css`. Themes set only `--rvd-hue-1`, `--rvd-hue-2`, `--rvd-accent-c`.
- Every component `<style>` block starts with `@layer components` (so Tailwind utilities passed via `class`
  win), and custom properties in `src/styles/` stay outside `@layer components` (tone overrides must beat
  the unlayered token block).
- The CSS layer order is declared inline in `Base.astro` before any stylesheet.
- No email address may appear on the homepage or contact pages, and none belongs in the repo (use the
  contact form). `_contact.test.ts` fails on anything that looks like an address.

## Gotchas (learned the hard way)

- **Tests under `src/pages/` must start with `_`** (e.g. `_styleguide.test.ts`). Astro treats any other
  `.ts` there as an endpoint and the build crashes.
- **Tailwind's preflight zeroes padding/border on every element**, and page CSS beats Web Awesome's
  `:host` styles. If a `<wa-*>` component styles its own host (e.g. `wa-radio appearance="button"`),
  set padding/border in the component's `<style>`.
- **`astro preview` auto-backgrounds under AI agents** (Astro 7). Scripts pass `--ignore-lock` to keep it in
  the foreground. If you start one yourself, stop it: `npx astro preview stop`, then confirm with
  `npx astro preview status`.
- **The dev server can serve stale component `<style>` after edits.** If a CSS change doesn't show up,
  restart `npm run dev`, or verify against `npx astro build` + `npx astro preview --ignore-lock`.
- **Frontmatter dates are UTC midnight.** Always format with `formatDate()` / `isoDate()` from `src/lib/format.ts`.
- **Drafts** (`draft: true`) render in dev and are excluded from production. The sample entries are drafts.
- Never nest a `Section` inside another `Section`.
- **Astro HTML-escapes apostrophes** (`'` → `&#39;`) in rendered output; account for it in string assertions.
- **The contact form won't submit on localhost**: the real Turnstile site key only works on buddyreno.dev.
  To test locally, temporarily use Cloudflare's always-pass test key `1x00000000000000000000AA` in
  `src/data/contact.ts` (don't commit it), with `worker/.dev.vars` holding the test secret.
- **Turnstile blocks automated browsers**, so Playwright can't complete the live form. Check the live Worker
  with `curl -X POST https://buddyreno.dev/api/contact` (expect a 303 to `?error=invalid`, no email sent) and
  have Buddy send a real message.
- **`ChoicePills` puts an invisible native radio over each pill**, so Playwright must click the `input`,
  not the label text.
- **Recent Listens ships `hidden`** and only appears after Last.fm answers. Without JS or on error it stays
  hidden, by design.

## Git and deploy

- Work on a branch; don't commit to `master` directly, and don't push unless asked.
- CI (`.github/workflows/site.yml`) runs tests, `astro check`, and the contrast check on every push/PR.
- **Site deploys are manual**: Actions → Site → Run workflow with "deploy" checked, or
  `gh workflow run site.yml --ref master -f deploy=true`. Pages builds from GitHub Actions.
- **The Worker deploys separately** with `npm run worker:deploy` (needs `npx wrangler login`). Redeploy it
  after changing `worker/` or the `reasons`/`messageMinLength` it imports from `src/data/contact.ts`.

## Hosting

```
visitor → Cloudflare (DNS + proxy, TLS) ─┬─ /api/contact → Worker "buddyreno-contact" → Email Routing → Buddy's inbox
                                         └─ everything else → GitHub Pages (this repo's dist/)
```

- **Domain**: registered at Squarespace; DNS on Cloudflare (free plan).
- **Records**: apex A/AAAA to GitHub Pages' four addresses and `www` CNAME to `buddylreno.github.io`,
  all **Proxied** (orange cloud). The proxy is what lets the Worker route work. SSL/TLS mode is
  **Full (strict)**. GitHub's Pages settings show "DNS check unsuccessful" while proxied; ignore it.
- **Other records in the zone belong to other projects.** Never change or delete them (e.g. the
  `plex-mcp` tunnel).
- **Contact Worker** (`worker/`): validates input, drops honeypot hits, verifies Turnstile, and sends through
  Email Routing's `send_email` binding. That's free because it only sends to a verified destination address.
  Mail comes from `contact@buddyreno.dev` with Reply-To set to the visitor.
  - Secrets (Wrangler, never in git): `CONTACT_TO` (the verified destination) and `TURNSTILE_SECRET`.
    Change them with `npx wrangler secret put <NAME> -c worker/wrangler.jsonc`.
  - Errors come back to the page as `/contact/?error=invalid|verify|send`, each with a message in
    `contact.errors`.
- **Turnstile** widget: Cloudflare dashboard → Turnstile, Invisible mode, hostname `buddyreno.dev`.
- **Last.fm**: the API key in `src/data/home.ts` is public and read-only by design. The shared secret is
  not used and must never be committed.
- **Email Routing**: the Worker needs no routing rules. Leave catch-all off; it invites spam to guessed addresses.
