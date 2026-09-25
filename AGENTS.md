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

**Definition of done** for any change: `npm test`, `npx astro check`, and, for anything touching color,
tokens, tones, or components, `npm run contrast`, all green. Add or update tests with the change.

## Layout

```
src/styles/        tokens.css (inputs + derived roles), themes/, tones.css, base.css, prose.css,
                   code.css, webawesome-theme.css, global.css (entry + Tailwind @theme), tokens.test.ts (CSS lint)
src/components/    Rivendell components; layout/ (Section, Container, Stack, SiteHeader, SiteFooter);
                   styleguide/ (styleguide-only helpers); types.ts
src/layouts/       Base, Page, Post, Project
src/pages/         routes; styleguide.astro; blog/, projects/, [slug].astro
src/content/       posts/, projects/, pages/ (Markdown/MDX); schema in src/content.config.ts
src/scripts/       theme-init.js (inlined, blocking theme/mode runtime → window.rvd), webawesome.ts
src/lib/           contrast, format (dates, reading time), content (drafts), schema (httpUrl)
scripts/           check-contrast.mjs, screenshots.mjs, lib/preview.mjs
docs/superpowers/  design spec and implementation plan (history; the spec explains the "why")
```

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

## Git and deploy

- Work on a branch; don't commit to `master` directly, and don't push unless asked.
- CI (`.github/workflows/site.yml`) runs tests, `astro check`, and the contrast check on every push/PR.
- Deploys are **manual only** (`workflow_dispatch` with `deploy: true`). The live site is still served from
  the `gh-pages` branch until the new homepage ships; switch Settings → Pages → Source to "GitHub Actions"
  before the first deploy.
