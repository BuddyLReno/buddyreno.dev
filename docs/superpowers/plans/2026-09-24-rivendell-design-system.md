# Rivendell Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old buddyreno.dev site with an Astro 7 project containing the Rivendell design system (tokens, themes, section tones, components, layouts) and a living `/styleguide` page that renders all of it.

**Architecture:** All design decisions live in CSS custom properties prefixed `--rvd-`: raw inputs per mode/theme, then derived semantic roles that are re-declared on every `[data-rvd-tone]` section so they re-resolve inside colored bands. Tailwind v4 (`@theme inline`) and Web Awesome (`--wa-*` overrides) both read the semantic layer, so theme, mode and tone changes need one attribute change and zero JS recoloring. Astro components are thin, typed, and unit-tested with Astro's container API; the styleguide doubles as the contrast test fixture.

**Tech Stack:** Astro 7.3, Tailwind CSS 4.3 (`@tailwindcss/vite`), Web Awesome 3.14 (free, cherry-picked), MDX, Shiki `css-variables` theme, Fontsource, Vitest 5 + happy-dom, postcss (lint tests), culori (contrast math), Playwright (contrast check + screenshots), Node 24.

**Spec:** `docs/superpowers/specs/2026-09-24-design-system-design.md`

## Global Constraints

- Node 24 (`.node-version`), Astro `^7.3`, TypeScript `^6` (Astro 7 and `@astrojs/check` require <7), Tailwind `^4.3`, `@awesome.me/webawesome` `^3.14` free only.
- Every CSS custom property we define starts with `--rvd-`; HTML attributes `data-rvd-*`; global classes `.rvd-*`; localStorage keys `rvd-mode`, `rvd-theme`.
- Tailwind utility names are unprefixed and must resolve to `var(--rvd-*)`. Tailwind's default color palette is removed (`--color-*: initial`).
- Themes set only `--rvd-hue-1`, `--rvd-hue-2`, `--rvd-accent-c`, under `:root[data-rvd-theme='<name>']`. Theme names: `teal-amber` (default), `teal`, `cobalt-teal`, `violet-cobalt`.
- Any custom property whose value contains `var(--rvd-…)` must be declared in a rule whose selector includes `[data-rvd-tone` (the re-derivation rule, spec §6). `@theme`/`@utility` blocks are exempt.
- All `--wa-*` overrides live only in `src/styles/webawesome-theme.css`, inside `@layer wa-theme-overrides`.
- Do not import `webawesome.css` or `native.css` (they restyle native elements). Import only `@awesome.me/webawesome/dist/styles/themes/default.css`.
- Placeholder copy comes from A v3 (`../new-site-theme/Portfolio A v3.dc.html`). Site identity (wordmark) is "Buddy / Reno".
- `Section` elements are never nested inside other `Section`s.
- Work on branch `design-system`. Never push to `master`. The deploy workflow is manual-trigger only.
- Every shell command assumes Node 24 on `PATH`. If `node -v` fails, run `export PATH="$HOME/.local/share/mise/installs/node/24/bin:$PATH"` first (the machine uses mise without a global default).

## Review Focus

1. **Storage unavailable (private mode, blocked site data):** mode/theme toggles must still work for the session and the page must boot with defaults. Pinned in Task 3 (`storage throws` tests).
2. **Stale or renamed values in localStorage** (e.g. a theme later renamed to a LOTR name): unknown `rvd-theme`/`rvd-mode` values must fall back to `teal-amber`/`system`, never produce an unthemed page. Pinned in Task 3.
3. **Frontmatter dates shifting a day:** `date: 2026-09-24` parses as UTC midnight and would render as Sep 23 in US time zones. Dates must be formatted in UTC. Pinned in Task 9 (`formatDate` test).
4. **Empty collections:** production excludes the draft sample entries, so `/blog` must render an explicit empty state instead of an empty list. Pinned in Task 9 (`PostList` empty test) and Task 10 (build assertion).
5. **Web Awesome upgrade renames a token:** a `--wa-*` override that no longer exists silently does nothing. Pinned in Task 4 (unknown `--wa-*` test).

---

## File Structure

```
.node-version                         Node version for mise/nvm/CI
astro.config.mjs                      Astro + MDX + sitemap + Tailwind vite plugin + Shiki theme
vitest.config.ts                      Vitest via Astro's getViteConfig
tsconfig.json
package.json
public/CNAME
src/env.d.ts                          window.rvd + rvd:change typings
src/assets/images/me_bw*.jpg          kept from old site
src/styles/
  global.css                          entry: imports, Tailwind @theme inline, type utilities
  tokens.css                          inputs (per mode) + derived semantic tokens
  themes/<name>.css                   one theme per file, hue inputs only
  tones.css                           section tone overrides
  base.css                            element defaults (body, links, focus, selection, motion)
  code.css                            Shiki css-variables → tokens
  prose.css                           .rvd-prose long-form styles
  webawesome-theme.css                --wa-* → --rvd-* mapping
  tokens.test.ts                      CSS lint tests (token refs, re-derivation, themes, WA names)
src/scripts/
  theme-init.js                       blocking theme/mode runtime, exposes window.rvd
  theme-init.test.ts
  webawesome.ts                       cherry-picked WA component registration
  styleguide.ts                       styleguide swatches, readouts, contrast report hook
src/lib/
  contrast.ts (+ .test.ts)            contrast math, pairs, browser resolver, report
  format.ts (+ .test.ts)              formatDate (UTC), readingTime
src/test/render.ts                    Astro container render helper for tests
src/components/
  types.ts                            Tone, Space, Width, SocialLink, TONES
  ThemeScript.astro                   inlines theme-init.js
  layout/{Section,Container,Stack,SiteHeader,SiteFooter}.astro
  {Wordmark,ThemeToggle,Heading,LabelList,LabelRow,Quote,StatusDot,Tag,TagList,
   SocialLinks,LinkList,LinkCard,Avatar,Button,CopyEmail,Prose,PostMeta,PostList,
   ProjectHeader}.astro
  *.test.ts                           container render tests, grouped by task
  styleguide/{Toolbar,Swatch,Example}.astro, sample.ts
src/layouts/{Base,Page,Post,Project}.astro
src/content.config.ts
src/content/{posts,projects,pages}/…  one draft sample each
src/pages/index.astro, styleguide.astro, [slug].astro, blog/index.astro,
          blog/[...slug].astro, projects/[...slug].astro
scripts/lib/preview.mjs               start/stop `astro preview`
scripts/check-contrast.mjs            Playwright AA check across themes × modes × tones
scripts/screenshots.mjs               Playwright screenshots for visual review
.github/workflows/site.yml            verify on push/PR; manual deploy to Pages
DESIGN.md, CLAUDE.md, README.md       briefs for future sessions
```

---

### Task 1: Reset the repo and scaffold Astro

**Files:**
- Delete: `assets/`, `index.html`, `package.json`, `README.md`, `.gitignore`, `.DS_Store`
- Move: `CNAME` → `public/CNAME`; `assets/images/me_bw.jpg`, `me_bw_small.jpg` → `src/assets/images/`
- Create: `.node-version`, `.gitignore`, `package.json` (via npm), `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/pages/index.astro`, `src/test/render.ts`, `src/test/smoke.test.ts`

**Interfaces:**
- Produces: `render(Component, { props?, slots? }): Promise<string>` from `src/test/render.ts`, used by every component test. npm scripts `dev`, `build`, `preview`, `check`, `test`, `contrast`, `screenshots`.

- [ ] **Step 1: Confirm branch and Node**

Run: `git branch --show-current && node -v`
Expected: `design-system` and `v24.x`. If `node` is missing, `export PATH="$HOME/.local/share/mise/installs/node/24/bin:$PATH"` and re-run.

- [ ] **Step 2: Move keepers and delete the old site**

```bash
mkdir -p public src/assets/images
git mv CNAME public/CNAME
git mv assets/images/me_bw.jpg src/assets/images/me_bw.jpg
git mv assets/images/me_bw_small.jpg src/assets/images/me_bw_small.jpg
git rm -r -q assets index.html package.json README.md .gitignore .DS_Store
rm -rf assets
git status --short
```
Expected: renames for the three kept files, deletions for everything else, `docs/` untouched.

- [ ] **Step 3: Write `.node-version` and `.gitignore`**

`.node-version`:
```
24
```

`.gitignore`:
```
node_modules/
dist/
.astro/
screenshots/
.DS_Store
```

- [ ] **Step 4: Create `package.json` and install dependencies**

```bash
npm init -y >/dev/null
npm pkg set name=buddyreno.dev private=true type=module description="Personal site of Buddy Reno" \
  engines.node=">=22.12.0" \
  scripts.dev="astro dev" scripts.build="astro build" scripts.preview="astro preview" \
  scripts.check="astro check" scripts.test="vitest run" \
  scripts.contrast="astro build && node scripts/check-contrast.mjs" \
  scripts.screenshots="astro build && node scripts/screenshots.mjs"
npm pkg delete main keywords license author
npm i astro@^7.3 @astrojs/mdx @astrojs/sitemap @awesome.me/webawesome@^3.14 tailwindcss@^4.3 @tailwindcss/vite@^4.3 \
  @fontsource/big-shoulders-display @fontsource-variable/manrope @fontsource/space-mono culori
npm i -D @astrojs/check typescript@^6 vitest happy-dom postcss playwright @types/culori
npx playwright install chromium
```
Expected: installs complete with 0 vulnerabilities reported as errors.

- [ ] **Step 5: Write `astro.config.mjs`**

```js
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://buddyreno.dev',
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/styleguide') })],
  markdown: { shikiConfig: { theme: 'css-variables' } },
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 6: Write `tsconfig.json` and `vitest.config.ts`**

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

`vitest.config.ts`:
```ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: { include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 7: Write the render helper and a failing smoke test**

`src/test/render.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

type Renderable = Parameters<AstroContainer['renderToString']>[0];
interface RenderOptions {
  props?: Record<string, unknown>;
  slots?: Record<string, string>;
}

let container: AstroContainer | undefined;

export async function render(component: Renderable, options: RenderOptions = {}): Promise<string> {
  container ??= await AstroContainer.create();
  return container.renderToString(component, options);
}
```

`src/test/smoke.test.ts`:
```ts
import { expect, test } from 'vitest';
import Index from '../pages/index.astro';
import { render } from './render';

test('placeholder home page links to the styleguide', async () => {
  const html = await render(Index);
  expect(html).toContain('href="/styleguide/"');
});
```

- [ ] **Step 8: Run it to verify it fails**

Run: `npx vitest run src/test/smoke.test.ts`
Expected: FAIL, cannot resolve `../pages/index.astro`.

- [ ] **Step 9: Write the placeholder home page**

`src/pages/index.astro` (replaced by `Base` layout usage in Task 6; the real homepage is a later session):
```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Buddy Reno</title>
  </head>
  <body>
    <p>New site in progress. <a href="/styleguide/">Rivendell styleguide</a></p>
  </body>
</html>
```

- [ ] **Step 10: Verify tests, build, and check pass**

Run: `npx vitest run && npx astro build && ls dist && npx astro check`
Expected: 1 test passed; `dist/` contains `CNAME` and `index.html`; `astro check` reports `0 errors`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: replace old site with Astro 7 scaffold"
```

---

### Task 2: Tokens, themes, tones, base styles, Tailwind wiring

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/themes/{teal-amber,teal,cobalt-teal,violet-cobalt}.css`, `src/styles/tones.css`, `src/styles/base.css`, `src/styles/global.css`, `src/styles/tokens.test.ts`

**Interfaces:**
- Produces (CSS): every token in spec §4 with the `--rvd-` prefix, including `--rvd-canvas`, `--rvd-bg`, `--rvd-surface`, `--rvd-ink`, `--rvd-muted`, `--rvd-line`, `--rvd-accent`, `--rvd-accent-text`, `--rvd-accent-2`, `--rvd-accent-2-text`, `--rvd-on-accent`, `--rvd-deep`, `--rvd-on-deep`, `--rvd-band`, `--rvd-on-band`, `--rvd-tint-1`, `--rvd-tint-2`, `--rvd-hover`, `--rvd-font-{display,body,mono}`, `--rvd-text-{hero,xl,section,wordmark,body-lg,body,body-md,body-sm,ui,caption,label,label-sm}`, `--rvd-measure`, `--rvd-measure-wide`, `--rvd-gutter`, `--rvd-section-{sm,md,lg}`, `--rvd-radius-{sm,md,lg,full}`, `--rvd-dur-{fast,theme}`.
- Produces (Tailwind): colors `canvas bg surface ink muted line accent accent-text accent-2 accent-2-text on-accent deep on-deep band on-band tint-1 tint-2 hover`; fonts `display body mono`; radii `sm md lg`; utilities `type-display-hero type-display-xl type-display-section type-wordmark type-body-lg type-body type-body-md type-body-sm type-ui type-caption type-label type-label-sm`.
- Produces (tests): `src/styles/tokens.test.ts` exporting nothing; later tasks append `test(...)` blocks to it.

- [ ] **Step 1: Write the failing lint tests**

`src/styles/tokens.test.ts`:
```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import postcss, { type Rule } from 'postcss';
import { expect, test } from 'vitest';

const SRC = resolve('src');
const STYLES = join(SRC, 'styles');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const cssFiles = () => walk(STYLES).filter((file) => file.endsWith('.css'));
const sourceFiles = () =>
  walk(SRC).filter((file) => /\.(css|astro|ts|js|mjs)$/.test(file) && !file.endsWith('.test.ts'));
const parse = (file: string) => postcss.parse(readFileSync(file, 'utf8'), { from: file });

function declaredTokens(): Set<string> {
  const declared = new Set<string>();
  for (const file of cssFiles()) parse(file).walkDecls(/^--rvd-/, (decl) => void declared.add(decl.prop));
  return declared;
}

test('every referenced --rvd-* token is declared', () => {
  const declared = declaredTokens();
  const missing: string[] = [];
  const patterns = [/var\(\s*(--rvd-[a-z0-9-]+)/g, /['"`](--rvd-[a-z0-9-]+)['"`]/g];
  for (const file of sourceFiles()) {
    const text = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      for (const [, token] of text.matchAll(pattern)) {
        if (!declared.has(token)) missing.push(`${relative(SRC, file)}: ${token}`);
      }
    }
  }
  expect(missing).toEqual([]);
});

test('custom properties that reference --rvd-* tokens re-resolve inside tones', () => {
  const offenders: string[] = [];
  for (const file of cssFiles()) {
    parse(file).walkDecls(/^--/, (decl) => {
      if (!decl.value.includes('var(--rvd-')) return;
      if (decl.parent?.type !== 'rule') return; // @theme / @utility are compile-time
      const selector = (decl.parent as Rule).selector;
      if (!selector.includes('[data-rvd-tone')) {
        offenders.push(`${relative(SRC, file)}: ${selector} { ${decl.prop} }`);
      }
    });
  }
  expect(offenders).toEqual([]);
});

test('global.css imports every stylesheet, tokens before themes before tones', () => {
  const globalCss = readFileSync(join(STYLES, 'global.css'), 'utf8');
  const imports = [...globalCss.matchAll(/@import '\.\/([^']+)'/g)].map(([, path]) => path);
  const expected = cssFiles()
    .map((file) => relative(STYLES, file))
    .filter((path) => path !== 'global.css');
  expect([...imports].sort()).toEqual([...expected].sort());
  const firstTheme = imports.findIndex((path) => path.startsWith('themes/'));
  expect(imports.indexOf('tokens.css')).toBeLessThan(firstTheme);
  expect(firstTheme).toBeLessThan(imports.indexOf('tones.css'));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/styles/tokens.test.ts`
Expected: FAIL, `ENOENT` for `src/styles` / `global.css`.

- [ ] **Step 3: Write `src/styles/tokens.css`**

```css
/*
 * Rivendell tokens.
 * Inputs: raw values per mode (this file) and per theme (themes/*.css).
 * Derived: anything whose value uses var() lives in the `:root, [data-rvd-tone]`
 * block so it re-resolves inside every section tone (spec §6, re-derivation rule).
 */
:root {
  /* Theme inputs (defaults equal the teal-amber theme) */
  --rvd-hue-1: 200;
  --rvd-hue-2: 70;
  --rvd-accent-c: 0.1;

  /* Mode inputs: light */
  --rvd-accent-l: 0.53;
  --rvd-accent-text-l: 0.48;
  --rvd-band-l: 0.5;
  --rvd-band-c: 0.1;
  --rvd-canvas: oklch(0.98 0.004 260);
  --rvd-surface: oklch(0.955 0.006 260);
  --rvd-ink: oklch(0.21 0.02 265);
  --rvd-muted: oklch(0.45 0.018 265);
  --rvd-line: oklch(0.21 0.02 265 / 0.12);
  --rvd-on-accent: oklch(0.99 0.003 260);
  --rvd-deep: oklch(0.21 0.02 265);
  --rvd-on-deep: oklch(0.97 0.004 260);
  --rvd-on-band: oklch(0.99 0.003 260);
  color-scheme: light;

  /* Type */
  --rvd-font-display: 'Big Shoulders Display', 'Arial Narrow', sans-serif;
  --rvd-font-body: 'Manrope Variable', system-ui, sans-serif;
  --rvd-font-mono: 'Space Mono', ui-monospace, monospace;
  --rvd-text-hero: clamp(52px, 9vw, 76px);
  --rvd-text-xl: clamp(40px, 7vw, 56px);
  --rvd-text-section: 28px;
  --rvd-text-wordmark: 22px;
  --rvd-text-body-lg: 19px;
  --rvd-text-body: 18px;
  --rvd-text-body-md: 17px;
  --rvd-text-body-sm: 16px;
  --rvd-text-ui: 15px;
  --rvd-text-caption: 14px;
  --rvd-text-label: 12px;
  --rvd-text-label-sm: 11px;

  /* Layout */
  --rvd-measure: 720px;
  --rvd-measure-wide: 1040px;
  --rvd-gutter: clamp(20px, 5vw, 32px);
  --rvd-section-sm: 56px;
  --rvd-section-md: 64px;
  --rvd-section-lg: 72px;
  --rvd-radius-sm: 5px;
  --rvd-radius-md: 8px;
  --rvd-radius-lg: 10px;
  --rvd-radius-full: 9999px;

  /* Motion */
  --rvd-dur-fast: 0.15s;
  --rvd-dur-theme: 0.3s;
}

/* Mode inputs: dark */
:root[data-rvd-mode='dark'] {
  --rvd-accent-l: 0.74;
  --rvd-accent-text-l: 0.74;
  --rvd-band-l: 0.3;
  --rvd-band-c: 0.06;
  --rvd-canvas: oklch(0.17 0.015 268);
  --rvd-surface: oklch(0.215 0.018 268);
  --rvd-ink: oklch(0.95 0.006 260);
  --rvd-muted: oklch(0.74 0.016 265);
  --rvd-line: oklch(0.95 0.006 260 / 0.12);
  --rvd-on-accent: oklch(0.17 0.015 268);
  --rvd-deep: oklch(0.13 0.014 268);
  --rvd-on-deep: oklch(0.95 0.006 260);
  --rvd-on-band: oklch(0.95 0.006 260);
  color-scheme: dark;
}

/* Derived semantic tokens */
:root,
[data-rvd-tone] {
  --rvd-bg: var(--rvd-canvas);
  --rvd-accent: oklch(var(--rvd-accent-l) var(--rvd-accent-c) var(--rvd-hue-1));
  --rvd-accent-text: oklch(var(--rvd-accent-text-l) var(--rvd-accent-c) var(--rvd-hue-1));
  --rvd-accent-2: oklch(var(--rvd-accent-l) var(--rvd-accent-c) var(--rvd-hue-2));
  --rvd-accent-2-text: oklch(var(--rvd-accent-text-l) var(--rvd-accent-c) var(--rvd-hue-2));
  --rvd-band: oklch(var(--rvd-band-l) var(--rvd-band-c) var(--rvd-hue-1));
  --rvd-tint-1: color-mix(in oklab, var(--rvd-accent) 13%, var(--rvd-canvas));
  --rvd-tint-2: color-mix(in oklab, var(--rvd-accent-2) 16%, var(--rvd-canvas));
  --rvd-hover: color-mix(in oklab, var(--rvd-accent) 12%, var(--rvd-bg));
}
```

- [ ] **Step 4: Write the four theme files**

`src/styles/themes/teal-amber.css`:
```css
/* Theme: teal-amber (working name; default). Sets color inputs only. */
:root[data-rvd-theme='teal-amber'] {
  --rvd-hue-1: 200;
  --rvd-hue-2: 70;
}
```

`src/styles/themes/teal.css`:
```css
/* Theme: teal (working name). Sets color inputs only. */
:root[data-rvd-theme='teal'] {
  --rvd-hue-1: 200;
  --rvd-hue-2: 200;
}
```

`src/styles/themes/cobalt-teal.css`:
```css
/* Theme: cobalt-teal (working name). Sets color inputs only. */
:root[data-rvd-theme='cobalt-teal'] {
  --rvd-hue-1: 262;
  --rvd-hue-2: 200;
}
```

`src/styles/themes/violet-cobalt.css`:
```css
/* Theme: violet-cobalt (working name). Sets color inputs only. */
:root[data-rvd-theme='violet-cobalt'] {
  --rvd-hue-1: 300;
  --rvd-hue-2: 262;
}
```

- [ ] **Step 5: Write `src/styles/tones.css`**

```css
/*
 * Section tones. Must load after tokens.css: these override the derived block
 * on the same element. Sections never nest (see DESIGN.md).
 */
[data-rvd-tone] {
  background-color: var(--rvd-bg);
  color: var(--rvd-ink);
}

[data-rvd-tone='tint-1'] {
  --rvd-bg: var(--rvd-tint-1);
}

[data-rvd-tone='tint-2'] {
  --rvd-bg: var(--rvd-tint-2);
}

[data-rvd-tone='band'] {
  --rvd-bg: var(--rvd-band);
  --rvd-ink: var(--rvd-on-band);
  --rvd-muted: var(--rvd-on-band);
  --rvd-line: color-mix(in oklab, var(--rvd-on-band) 15%, transparent);
  --rvd-surface: color-mix(in oklab, var(--rvd-on-band) 12%, var(--rvd-band));
  --rvd-accent: var(--rvd-on-band);
  --rvd-accent-text: var(--rvd-on-band);
  --rvd-on-accent: var(--rvd-band);
}

/* Deep is always a dark surface, so it uses the dark-mode accent lightness. */
[data-rvd-tone='deep'] {
  --rvd-bg: var(--rvd-deep);
  --rvd-ink: var(--rvd-on-deep);
  --rvd-muted: color-mix(in oklab, var(--rvd-on-deep) 75%, var(--rvd-deep));
  --rvd-line: color-mix(in oklab, var(--rvd-on-deep) 12%, var(--rvd-deep));
  --rvd-surface: color-mix(in oklab, var(--rvd-on-deep) 8%, var(--rvd-deep));
  --rvd-accent-l: 0.74;
  --rvd-accent-text-l: 0.74;
  --rvd-on-accent: oklch(0.17 0.015 268);
  color-scheme: dark;
}
```

- [ ] **Step 6: Write `src/styles/base.css`**

```css
@layer base {
  body {
    margin: 0;
    background-color: var(--rvd-bg);
    color: var(--rvd-ink);
    font-family: var(--rvd-font-body);
    font-size: var(--rvd-text-body);
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition:
      background-color var(--rvd-dur-theme),
      color var(--rvd-dur-theme);
  }

  p {
    text-wrap: pretty;
  }

  a {
    color: inherit;
    text-decoration-line: underline;
    text-decoration-color: color-mix(in oklab, var(--rvd-accent) 60%, transparent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 3px;
    transition:
      color var(--rvd-dur-fast),
      text-decoration-color var(--rvd-dur-fast);
  }

  a:hover {
    color: var(--rvd-accent-text);
    text-decoration-color: var(--rvd-accent);
  }

  :focus-visible {
    outline: 2px solid var(--rvd-accent);
    outline-offset: 2px;
  }

  ::selection {
    background-color: var(--rvd-accent);
    color: var(--rvd-on-accent);
  }

  /* Hide web components until registered (avoids a flash of unstyled controls). */
  :not(:defined) {
    visibility: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 7: Write `src/styles/global.css`**

```css
@import 'tailwindcss';
@import './tokens.css';
@import './themes/teal-amber.css';
@import './themes/teal.css';
@import './themes/cobalt-teal.css';
@import './themes/violet-cobalt.css';
@import './tones.css';
@import './base.css';

/* Only Rivendell colors exist as utilities. */
@theme {
  --color-*: initial;
}

@theme inline {
  --color-canvas: var(--rvd-canvas);
  --color-bg: var(--rvd-bg);
  --color-surface: var(--rvd-surface);
  --color-ink: var(--rvd-ink);
  --color-muted: var(--rvd-muted);
  --color-line: var(--rvd-line);
  --color-accent: var(--rvd-accent);
  --color-accent-text: var(--rvd-accent-text);
  --color-accent-2: var(--rvd-accent-2);
  --color-accent-2-text: var(--rvd-accent-2-text);
  --color-on-accent: var(--rvd-on-accent);
  --color-deep: var(--rvd-deep);
  --color-on-deep: var(--rvd-on-deep);
  --color-band: var(--rvd-band);
  --color-on-band: var(--rvd-on-band);
  --color-tint-1: var(--rvd-tint-1);
  --color-tint-2: var(--rvd-tint-2);
  --color-hover: var(--rvd-hover);
  --font-display: var(--rvd-font-display);
  --font-body: var(--rvd-font-body);
  --font-mono: var(--rvd-font-mono);
  --radius-sm: var(--rvd-radius-sm);
  --radius-md: var(--rvd-radius-md);
  --radius-lg: var(--rvd-radius-lg);
}

@utility type-display-hero {
  font-family: var(--rvd-font-display);
  font-weight: 800;
  font-size: var(--rvd-text-hero);
  line-height: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.005em;
}

@utility type-display-xl {
  font-family: var(--rvd-font-display);
  font-weight: 800;
  font-size: var(--rvd-text-xl);
  line-height: 0.95;
  text-transform: uppercase;
  letter-spacing: 0.005em;
}

@utility type-display-section {
  font-family: var(--rvd-font-display);
  font-weight: 800;
  font-size: var(--rvd-text-section);
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

@utility type-wordmark {
  font-family: var(--rvd-font-display);
  font-weight: 800;
  font-size: var(--rvd-text-wordmark);
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

@utility type-body-lg {
  font-family: var(--rvd-font-body);
  font-weight: 500;
  font-size: var(--rvd-text-body-lg);
  line-height: 1.65;
}

@utility type-body {
  font-family: var(--rvd-font-body);
  font-weight: 400;
  font-size: var(--rvd-text-body);
  line-height: 1.65;
}

@utility type-body-md {
  font-family: var(--rvd-font-body);
  font-weight: 400;
  font-size: var(--rvd-text-body-md);
  line-height: 1.5;
}

@utility type-body-sm {
  font-family: var(--rvd-font-body);
  font-weight: 400;
  font-size: var(--rvd-text-body-sm);
  line-height: 1.5;
}

@utility type-ui {
  font-family: var(--rvd-font-body);
  font-weight: 600;
  font-size: var(--rvd-text-ui);
  line-height: 1.4;
}

@utility type-caption {
  font-family: var(--rvd-font-body);
  font-weight: 400;
  font-size: var(--rvd-text-caption);
  line-height: 1.4;
}

@utility type-label {
  font-family: var(--rvd-font-mono);
  font-weight: 400;
  font-size: var(--rvd-text-label);
  line-height: 1.3;
  text-transform: uppercase;
}

@utility type-label-sm {
  font-family: var(--rvd-font-mono);
  font-weight: 400;
  font-size: var(--rvd-text-label-sm);
  line-height: 1.3;
  text-transform: uppercase;
}
```

- [ ] **Step 8: Run lint tests to verify they pass**

Run: `npx vitest run src/styles/tokens.test.ts`
Expected: 3 passed.

- [ ] **Step 9: Prove the re-derivation test catches a real mistake**

Temporarily add to the end of `tokens.css`:
```css
:root { --rvd-oops: var(--rvd-ink); }
```
Run: `npx vitest run src/styles/tokens.test.ts`
Expected: FAIL on "re-resolve inside tones" listing `tokens.css: :root { --rvd-oops }`. Remove the line and re-run: 3 passed.

- [ ] **Step 10: Verify Tailwind emits token-backed utilities**

Temporarily add `import '../styles/global.css';` as the first frontmatter line of `src/pages/index.astro` and `class="bg-bg text-ink type-label"` to its `<p>`. Run: `npx astro build && grep -o '\.text-ink{[^}]*}' dist/_astro/*.css`
Expected: `.text-ink{color:var(--rvd-ink)}`. Revert `index.astro` (`git checkout src/pages/index.astro`).

- [ ] **Step 11: Commit**

```bash
git add src/styles
git commit -m "feat(rivendell): tokens, themes, tones, base styles, Tailwind theme"
```

---

### Task 3: Theme and mode runtime

**Files:**
- Create: `src/scripts/theme-init.js`, `src/scripts/theme-init.test.ts`, `src/components/ThemeScript.astro`, `src/env.d.ts`
- Modify: `src/styles/tokens.test.ts` (append theme tests)

**Interfaces:**
- Produces: `window.rvd: { THEMES: readonly string[]; MODES: readonly RvdMode[]; getMode(): RvdMode; getTheme(): string; getResolvedMode(): 'light' | 'dark'; setMode(mode: RvdMode): void; setTheme(theme: string): void }`.
- Produces: `document` event `rvd:change` with `detail: { mode: RvdMode; theme: string; resolvedMode: 'light' | 'dark' }`, fired on every set and on OS scheme change while in `system`.
- Produces: `<ThemeScript />` for `<head>`. Global types `RvdMode`, `RvdRuntime`.

- [ ] **Step 1: Write failing runtime tests**

`src/scripts/theme-init.test.ts`:
```ts
// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import source from './theme-init.js?raw';

const root = document.documentElement;
let systemDark = false;
let systemListeners: Array<() => void> = [];

function boot(stored: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value);
  new Function(source)();
}

function setSystemDark(dark: boolean) {
  systemDark = dark;
  for (const listener of systemListeners) listener();
}

beforeEach(() => {
  localStorage.clear();
  root.removeAttribute('data-rvd-mode');
  root.removeAttribute('data-rvd-theme');
  root.className = '';
  systemDark = false;
  systemListeners = [];
  window.matchMedia = ((media: string) => ({
    media,
    get matches() {
      return systemDark;
    },
    addEventListener: (_type: string, listener: () => void) => systemListeners.push(listener),
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => vi.restoreAllMocks());

test('defaults to system mode and the teal-amber theme', () => {
  boot();
  expect(root.dataset.rvdMode).toBe('light');
  expect(root.dataset.rvdTheme).toBe('teal-amber');
  expect(root.classList.contains('wa-light')).toBe(true);
  expect(window.rvd.getMode()).toBe('system');
});

test('system mode follows the OS preference, including live changes', () => {
  systemDark = true;
  boot();
  expect(root.dataset.rvdMode).toBe('dark');
  expect(root.classList.contains('wa-dark')).toBe(true);
  setSystemDark(false);
  expect(root.dataset.rvdMode).toBe('light');
  expect(root.classList.contains('wa-dark')).toBe(false);
});

test('a stored explicit mode wins over the OS and ignores OS changes', () => {
  systemDark = true;
  boot({ 'rvd-mode': 'light' });
  expect(root.dataset.rvdMode).toBe('light');
  setSystemDark(true);
  expect(root.dataset.rvdMode).toBe('light');
});

test('unknown stored values fall back to defaults', () => {
  boot({ 'rvd-mode': 'purple', 'rvd-theme': 'mordor' });
  expect(window.rvd.getMode()).toBe('system');
  expect(root.dataset.rvdTheme).toBe('teal-amber');
});

test('setMode and setTheme apply, persist, and announce', () => {
  boot();
  const onChange = vi.fn();
  document.addEventListener('rvd:change', onChange);
  window.rvd.setMode('dark');
  window.rvd.setTheme('cobalt-teal');
  expect(root.dataset.rvdMode).toBe('dark');
  expect(root.dataset.rvdTheme).toBe('cobalt-teal');
  expect(localStorage.getItem('rvd-mode')).toBe('dark');
  expect(localStorage.getItem('rvd-theme')).toBe('cobalt-teal');
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1][0].detail).toEqual({ mode: 'dark', theme: 'cobalt-teal', resolvedMode: 'dark' });
  document.removeEventListener('rvd:change', onChange);
});

test('invalid setMode/setTheme values are ignored', () => {
  boot();
  window.rvd.setMode('sepia' as RvdMode);
  window.rvd.setTheme('mordor');
  expect(window.rvd.getMode()).toBe('system');
  expect(window.rvd.getTheme()).toBe('teal-amber');
});

test('storage throws: boots with defaults and toggles still work for the session', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied');
  });
  boot();
  expect(root.dataset.rvdTheme).toBe('teal-amber');
  window.rvd.setMode('dark');
  expect(root.dataset.rvdMode).toBe('dark');
  window.rvd.setTheme('teal');
  expect(root.dataset.rvdTheme).toBe('teal');
});
```

Append to `src/styles/tokens.test.ts`:
```ts
import themeInit from '../scripts/theme-init.js?raw';

const THEME_INPUTS = new Set(['--rvd-hue-1', '--rvd-hue-2', '--rvd-accent-c']);
const runtimeThemes = (): string[] => {
  const match = themeInit.match(/const THEMES = (\[[^\]]*\])/);
  if (!match) throw new Error('THEMES list not found in theme-init.js');
  return JSON.parse(match[1].replace(/'/g, '"'));
};

test('theme files match the runtime THEMES list', () => {
  const files = readdirSync(join(STYLES, 'themes')).map((name) => name.replace(/\.css$/, ''));
  expect([...files].sort()).toEqual([...runtimeThemes()].sort());
});

test('themes set only color inputs, scoped to their own name', () => {
  for (const name of runtimeThemes()) {
    const props: string[] = [];
    parse(join(STYLES, 'themes', `${name}.css`)).walkRules((rule) => {
      expect(rule.selector).toBe(`:root[data-rvd-theme='${name}']`);
      rule.walkDecls((decl) => void props.push(decl.prop));
    });
    expect(props.filter((prop) => !THEME_INPUTS.has(prop))).toEqual([]);
    expect(props).toEqual(expect.arrayContaining(['--rvd-hue-1', '--rvd-hue-2']));
  }
});
```
(Put the new `import` line at the top of the file with the other imports.)

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/scripts src/styles`
Expected: FAIL, cannot resolve `./theme-init.js?raw`.

- [ ] **Step 3: Write `src/scripts/theme-init.js`**

```js
// Rivendell theme runtime. ThemeScript.astro inlines this file (blocking, in <head>)
// so data-rvd-mode and data-rvd-theme are set before first paint. Keep it dependency-free.
(() => {
  const THEMES = ['teal-amber', 'teal', 'cobalt-teal', 'violet-cobalt'];
  const MODES = ['light', 'dark', 'system'];
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');

  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable: the in-memory value still applies for this session.
    }
  };

  const storedMode = read('rvd-mode');
  const storedTheme = read('rvd-theme');
  let mode = MODES.includes(storedMode) ? storedMode : 'system';
  let theme = THEMES.includes(storedTheme) ? storedTheme : THEMES[0];

  const resolvedMode = () => (mode === 'system' ? (system.matches ? 'dark' : 'light') : mode);

  const apply = () => {
    const dark = resolvedMode() === 'dark';
    root.dataset.rvdMode = dark ? 'dark' : 'light';
    root.dataset.rvdTheme = theme;
    root.classList.toggle('wa-dark', dark);
    root.classList.toggle('wa-light', !dark);
  };

  const changed = () => {
    apply();
    document.dispatchEvent(
      new CustomEvent('rvd:change', { detail: { mode, theme, resolvedMode: resolvedMode() } }),
    );
  };

  system.addEventListener('change', () => {
    if (mode === 'system') changed();
  });
  apply();

  window.rvd = {
    THEMES,
    MODES,
    getMode: () => mode,
    getTheme: () => theme,
    getResolvedMode: resolvedMode,
    setMode(next) {
      if (!MODES.includes(next)) return;
      mode = next;
      write('rvd-mode', next);
      changed();
    },
    setTheme(next) {
      if (!THEMES.includes(next)) return;
      theme = next;
      write('rvd-theme', next);
      changed();
    },
  };
})();
```

- [ ] **Step 4: Write `src/env.d.ts` and `src/components/ThemeScript.astro`**

`src/env.d.ts`:
```ts
type RvdMode = 'light' | 'dark' | 'system';

interface RvdRuntime {
  readonly THEMES: readonly string[];
  readonly MODES: readonly RvdMode[];
  getMode(): RvdMode;
  getTheme(): string;
  getResolvedMode(): 'light' | 'dark';
  setMode(mode: RvdMode): void;
  setTheme(theme: string): void;
}

interface Window {
  rvd: RvdRuntime;
  rvdContrastReport?: () => unknown[];
}

interface DocumentEventMap {
  'rvd:change': CustomEvent<{ mode: RvdMode; theme: string; resolvedMode: 'light' | 'dark' }>;
}
```

`src/components/ThemeScript.astro`:
```astro
---
// Blocking on purpose: sets mode/theme before first paint. Place inside <head>.
import source from '../scripts/theme-init.js?raw';
---
<script is:inline set:html={source} />
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/scripts src/styles`
Expected: all theme-init tests and 5 token tests pass.

- [ ] **Step 6: Type check**

Run: `npx astro check`
Expected: `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add src/scripts src/components/ThemeScript.astro src/env.d.ts src/styles/tokens.test.ts
git commit -m "feat(rivendell): blocking theme/mode runtime with window.rvd"
```

---

### Task 4: Web Awesome integration and the Base layout

**Files:**
- Create: `src/styles/webawesome-theme.css`, `src/scripts/webawesome.ts`, `src/layouts/Base.astro`, `src/layouts/Base.test.ts`
- Modify: `src/styles/global.css` (import), `src/styles/tokens.test.ts` (append WA test), `src/pages/index.astro` (use Base)
- Delete: `src/test/smoke.test.ts` (superseded by `Base.test.ts`)

**Interfaces:**
- Consumes: `ThemeScript` (Task 3), `global.css` (Task 2).
- Produces: `Base` layout. Props: `{ title: string; description?: string; noindex?: boolean }`. Slots: default (inside `<main id="main">`), `header` (defaults to nothing until Task 6 adds `SiteHeader`), `footer` (same). Renders `<html lang="en" class="wa-theme-default wa-palette-default">`, `<ThemeScript />` in `<head>`, fonts, and registers WA components on the client.

- [ ] **Step 1: Write failing tests**

Append to `src/styles/tokens.test.ts`:
```ts
test('webawesome-theme.css only overrides tokens Web Awesome defines', () => {
  const waDefault = readFileSync(
    resolve('node_modules/@awesome.me/webawesome/dist/styles/themes/default.css'),
    'utf8',
  );
  const known = new Set([...waDefault.matchAll(/(--wa-[a-z0-9-]+)\s*:/g)].map(([, name]) => name));
  const unknown: string[] = [];
  parse(join(STYLES, 'webawesome-theme.css')).walkDecls(/^--wa-/, (decl) => {
    if (!known.has(decl.prop)) unknown.push(decl.prop);
  });
  expect(unknown).toEqual([]);
});
```

`src/layouts/Base.test.ts`:
```ts
import { expect, test } from 'vitest';
import { render } from '../test/render';
import Base from './Base.astro';

test('Base renders head essentials and themed html root', async () => {
  const html = await render(Base, {
    props: { title: 'Test page', description: 'About the test' },
    slots: { default: '<p>content</p>' },
  });
  expect(html).toContain('<html lang="en" class="wa-theme-default wa-palette-default"');
  expect(html).toContain('<title>Test page</title>');
  expect(html).toContain('<meta name="description" content="About the test">');
  expect(html).toContain('<main id="main"');
  expect(html).toContain('<p>content</p>');
  expect(html).toMatch(/<head>[\s\S]*window\.rvd[\s\S]*<\/head>/);
  expect(html).not.toContain('noindex');
});

test('Base can mark a page noindex', async () => {
  const html = await render(Base, { props: { title: 'Hidden', noindex: true } });
  expect(html).toContain('<meta name="robots" content="noindex">');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/layouts src/styles`
Expected: FAIL, missing `webawesome-theme.css` and `Base.astro`.

- [ ] **Step 3: Write `src/styles/webawesome-theme.css`**

```css
/*
 * Web Awesome → Rivendell. The only place --wa-* tokens are overridden.
 * Also declared on [data-rvd-tone] so WA components recolor inside section tones.
 */
@layer wa-theme-overrides {
  :where(:root),
  .wa-light,
  .wa-dark,
  .wa-invert,
  [data-rvd-tone] {
    --wa-font-family-body: var(--rvd-font-body);
    --wa-font-family-heading: var(--rvd-font-display);
    --wa-font-family-code: var(--rvd-font-mono);
    --wa-font-family-longform: var(--rvd-font-body);
    --wa-border-radius-s: var(--rvd-radius-sm);
    --wa-border-radius-m: var(--rvd-radius-md);
    --wa-border-radius-l: var(--rvd-radius-lg);
    --wa-transition-fast: var(--rvd-dur-fast);

    --wa-color-surface-default: var(--rvd-bg);
    --wa-color-surface-raised: var(--rvd-surface);
    --wa-color-surface-lowered: var(--rvd-surface);
    --wa-color-surface-border: var(--rvd-line);
    --wa-color-text-normal: var(--rvd-ink);
    --wa-color-text-quiet: var(--rvd-muted);
    --wa-color-text-link: var(--rvd-accent-text);
    --wa-color-focus: var(--rvd-accent);

    --wa-color-brand-fill-loud: var(--rvd-accent);
    --wa-color-brand-on-loud: var(--rvd-on-accent);
    --wa-color-brand-fill-normal: color-mix(in oklab, var(--rvd-accent) 22%, var(--rvd-bg));
    --wa-color-brand-on-normal: var(--rvd-ink);
    --wa-color-brand-fill-quiet: var(--rvd-hover);
    --wa-color-brand-on-quiet: var(--rvd-ink);
    --wa-color-brand-border-loud: var(--rvd-accent);
    --wa-color-brand-border-normal: color-mix(in oklab, var(--rvd-accent) 45%, var(--rvd-bg));
    --wa-color-brand-border-quiet: var(--rvd-line);

    --wa-color-neutral-fill-loud: var(--rvd-ink);
    --wa-color-neutral-on-loud: var(--rvd-bg);
    --wa-color-neutral-fill-normal: var(--rvd-surface);
    --wa-color-neutral-on-normal: var(--rvd-ink);
    --wa-color-neutral-fill-quiet: var(--rvd-surface);
    --wa-color-neutral-on-quiet: var(--rvd-ink);
    --wa-color-neutral-border-loud: var(--rvd-ink);
    --wa-color-neutral-border-normal: color-mix(in oklab, var(--rvd-ink) 30%, var(--rvd-bg));
    --wa-color-neutral-border-quiet: var(--rvd-line);

    --wa-form-control-activated-color: var(--rvd-accent);
    --wa-form-control-border-color: color-mix(in oklab, var(--rvd-ink) 30%, var(--rvd-bg));
    --wa-form-control-background-color: var(--rvd-bg);
    --wa-form-control-value-color: var(--rvd-ink);
    --wa-form-control-label-color: var(--rvd-ink);
    --wa-form-control-hint-color: var(--rvd-muted);
    --wa-tooltip-background-color: var(--rvd-ink);
    --wa-tooltip-content-color: var(--rvd-bg);
  }
}
```

Add to `src/styles/global.css` directly after `@import './base.css';`:
```css
@import './webawesome-theme.css';
```

- [ ] **Step 4: Write `src/scripts/webawesome.ts`**

```ts
// Cherry-picked Web Awesome components. Add an import here before using a new <wa-*>.
import '@awesome.me/webawesome/dist/components/avatar/avatar.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
```

- [ ] **Step 5: Write `src/layouts/Base.astro`**

```astro
---
import '@awesome.me/webawesome/dist/styles/themes/default.css';
import '@fontsource/big-shoulders-display/800.css';
import '@fontsource-variable/manrope/index.css';
import '@fontsource/space-mono/400.css';
import '../styles/global.css';
import ThemeScript from '../components/ThemeScript.astro';

interface Props {
  title: string;
  description?: string;
  noindex?: boolean;
}

const { title, description, noindex = false } = Astro.props;
const canonical = Astro.site ? new URL(Astro.url.pathname, Astro.site).href : undefined;
---
<!doctype html>
<html lang="en" class="wa-theme-default wa-palette-default">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {noindex && <meta name="robots" content="noindex" />}
    {canonical && <link rel="canonical" href={canonical} />}
    <ThemeScript />
  </head>
  <body>
    <a class="sr-only focus:not-sr-only" href="#main">Skip to content</a>
    <slot name="header" />
    <main id="main">
      <slot />
    </main>
    <slot name="footer" />
    <script>
      import '../scripts/webawesome.ts';
    </script>
  </body>
</html>
```

- [ ] **Step 6: Point the placeholder page at Base**

Replace `src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Buddy Reno" description="Personal site of Buddy Reno. New version in progress.">
  <p>New site in progress. <a href="/styleguide/">Rivendell styleguide</a></p>
</Base>
```

Delete the superseded smoke test: `git rm -q src/test/smoke.test.ts`

- [ ] **Step 7: Run tests, build, check**

Run: `npx vitest run && npx astro build && npx astro check`
Expected: all tests pass (6 token tests); build completes (a rolldown "directive" warning from a Web Awesome dependency is harmless); `0 errors`.

- [ ] **Step 8: Prove the WA name test catches a typo**

Temporarily change `--wa-color-text-quiet` to `--wa-color-text-quite` in `webawesome-theme.css`. Run `npx vitest run src/styles`. Expected: FAIL listing `--wa-color-text-quite`. Revert.

- [ ] **Step 9: Commit**

```bash
git add -A src
git commit -m "feat(rivendell): Web Awesome theme mapping and Base layout"
```

---

### Task 5: Layout primitives — Section, Container, Stack

**Files:**
- Create: `src/components/types.ts`, `src/components/layout/Container.astro`, `src/components/layout/Section.astro`, `src/components/layout/Stack.astro`, `src/components/layout/layout.test.ts`

**Interfaces:**
- Produces: `types.ts` exports `type Tone = 'base' | 'tint-1' | 'tint-2' | 'band' | 'deep'`, `const TONES: readonly Tone[]`, `type Space = 'sm' | 'md' | 'lg'`, `type Width = 'measure' | 'wide'`, `interface SocialLink { label: string; href: string }`.
- Produces: `<Container width?: Width class?>`; `<Section tone?: Tone space?: Space width?: Width id? label? class? ...restAttributes>` rendering `<section data-rvd-tone data-rvd-space class="rvd-section">` wrapping a `Container`; `<Stack gap?: number as?: 'div' | 'ul' | 'ol' class?>`.

- [ ] **Step 1: Write failing tests**

`src/components/layout/layout.test.ts`:
```ts
import { expect, test } from 'vitest';
import { render } from '../../test/render';
import Container from './Container.astro';
import Section from './Section.astro';
import Stack from './Stack.astro';

test('Section defaults to base tone, md space, measure width', async () => {
  const html = await render(Section, { slots: { default: 'hi' } });
  expect(html).toMatch(/<section[^>]*data-rvd-tone="base"/);
  expect(html).toMatch(/<section[^>]*data-rvd-space="md"/);
  expect(html).toContain('data-rvd-width="measure"');
  expect(html).toContain('hi');
});

test('Section passes tone, space, id, label, and extra attributes through', async () => {
  const html = await render(Section, {
    props: { tone: 'deep', space: 'lg', id: 'contact', label: 'Contact', 'data-rvd-contrast-scope': '' },
  });
  expect(html).toMatch(/<section[^>]*id="contact"/);
  expect(html).toMatch(/<section[^>]*aria-label="Contact"/);
  expect(html).toMatch(/<section[^>]*data-rvd-tone="deep"/);
  expect(html).toMatch(/<section[^>]*data-rvd-space="lg"/);
  expect(html).toContain('data-rvd-contrast-scope');
});

test('Container supports the wide measure', async () => {
  const html = await render(Container, { props: { width: 'wide' } });
  expect(html).toContain('data-rvd-width="wide"');
});

test('Stack renders the requested element and gap', async () => {
  const html = await render(Stack, { props: { as: 'ul', gap: 14 } });
  expect(html).toMatch(/<ul[^>]*class="rvd-stack/);
  expect(html).toContain('--rvd-stack-gap:14px');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/layout`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `src/components/types.ts`**

```ts
export type Tone = 'base' | 'tint-1' | 'tint-2' | 'band' | 'deep';
export const TONES: readonly Tone[] = ['base', 'tint-1', 'tint-2', 'band', 'deep'];
export type Space = 'sm' | 'md' | 'lg';
export type Width = 'measure' | 'wide';

export interface SocialLink {
  label: string;
  href: string;
}
```

- [ ] **Step 4: Write the three components**

`src/components/layout/Container.astro`:
```astro
---
import type { Width } from '../types';

interface Props {
  width?: Width;
  class?: string;
}

const { width = 'measure', class: className } = Astro.props;
---
<div class:list={['rvd-container', className]} data-rvd-width={width}><slot /></div>

<style>
  .rvd-container {
    max-width: var(--rvd-measure);
    margin-inline: auto;
    padding-inline: var(--rvd-gutter);
  }

  .rvd-container[data-rvd-width='wide'] {
    max-width: var(--rvd-measure-wide);
  }
</style>
```

`src/components/layout/Section.astro`:
```astro
---
import type { HTMLAttributes } from 'astro/types';
import type { Space, Tone, Width } from '../types';
import Container from './Container.astro';

interface Props extends Omit<HTMLAttributes<'section'>, 'class'> {
  tone?: Tone;
  space?: Space;
  width?: Width;
  label?: string;
  class?: string;
}

const { tone = 'base', space = 'md', width = 'measure', label, class: className, ...rest } = Astro.props;
---
<section
  {...rest}
  aria-label={label}
  class:list={['rvd-section', className]}
  data-rvd-tone={tone}
  data-rvd-space={space}
>
  <Container width={width}><slot /></Container>
</section>

<style>
  .rvd-section[data-rvd-space='sm'] {
    padding-block: var(--rvd-section-sm);
  }

  .rvd-section[data-rvd-space='md'] {
    padding-block: var(--rvd-section-md);
  }

  .rvd-section[data-rvd-space='lg'] {
    padding-block: var(--rvd-section-lg);
  }
</style>
```

`src/components/layout/Stack.astro`:
```astro
---
interface Props {
  as?: 'div' | 'ul' | 'ol';
  gap?: number;
  class?: string;
}

const { as: Tag = 'div', gap = 16, class: className } = Astro.props;
---
<Tag class:list={['rvd-stack', className]} style={`--rvd-stack-gap:${gap}px`}><slot /></Tag>

<style>
  .rvd-stack {
    display: flex;
    flex-direction: column;
    gap: var(--rvd-stack-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
```

Note: `--rvd-stack-gap` is a component-local custom property. The token lint requires every `var(--rvd-*)` to be declared in `src/styles`, so add this to the `:root` block in `tokens.css` under `/* Layout */`:
```css
  --rvd-stack-gap: 16px;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components src/styles/tokens.css
git commit -m "feat(rivendell): Section, Container, Stack layout primitives"
```

---

### Task 6: Site chrome — Wordmark, ThemeToggle, SiteHeader, SiteFooter

**Files:**
- Create: `src/components/Wordmark.astro`, `src/components/ThemeToggle.astro`, `src/components/layout/SiteHeader.astro`, `src/components/layout/SiteFooter.astro`, `src/components/chrome.test.ts`
- Modify: `src/layouts/Base.astro` (default header/footer), `src/layouts/Base.test.ts`

**Interfaces:**
- Consumes: `Container` (Task 5), `window.rvd` + `rvd:change` (Task 3).
- Produces: `<Wordmark first="Buddy" last="Reno" href="/">`; `<ThemeToggle label?="Color mode">` (a `wa-radio-group[data-rvd-theme-toggle]` with radios `light|dark|system`); `<SiteHeader>` (Wordmark + ThemeToggle); `<SiteFooter>` with named slots `start` and `end` (defaults `© {year} Buddy Reno` and `Nashville, TN`), rendered as `<footer data-rvd-tone="deep">`. `Base` now renders `SiteHeader`/`SiteFooter` unless the page fills the `header`/`footer` slots.

- [ ] **Step 1: Write failing tests**

`src/components/chrome.test.ts`:
```ts
import { expect, test } from 'vitest';
import { render } from '../test/render';
import SiteFooter from './layout/SiteFooter.astro';
import SiteHeader from './layout/SiteHeader.astro';
import ThemeToggle from './ThemeToggle.astro';
import Wordmark from './Wordmark.astro';

test('Wordmark renders first/last with an accent slash and links home', async () => {
  const html = await render(Wordmark, { props: { first: 'Buddy', last: 'Reno' } });
  expect(html).toMatch(/<a[^>]*href="\/"/);
  expect(html).toMatch(/Buddy<span[^>]*class="rvd-wordmark__slash"[^>]*>\/<\/span>Reno/);
});

test('ThemeToggle is a labelled radio group with light, dark, system', async () => {
  const html = await render(ThemeToggle);
  expect(html).toMatch(/<wa-radio-group[^>]*label="Color mode"/);
  expect(html).toContain('data-rvd-theme-toggle');
  for (const value of ['light', 'dark', 'system']) {
    expect(html).toMatch(new RegExp(`<wa-radio[^>]*appearance="button"[^>]*value="${value}"`));
  }
});

test('SiteHeader contains the wordmark and the toggle', async () => {
  const html = await render(SiteHeader);
  expect(html).toContain('rvd-wordmark');
  expect(html).toContain('data-rvd-theme-toggle');
});

test('SiteFooter is a deep band with default and overridable slots', async () => {
  const year = new Date().getFullYear();
  const fallback = await render(SiteFooter);
  expect(fallback).toMatch(/<footer[^>]*data-rvd-tone="deep"/);
  expect(fallback).toContain(`© ${year} Buddy Reno`);
  expect(fallback).toContain('Nashville, TN');
  const custom = await render(SiteFooter, { slots: { end: 'Somewhere else' } });
  expect(custom).toContain('Somewhere else');
  expect(custom).not.toContain('Nashville, TN');
});
```

Append to `src/layouts/Base.test.ts`:
```ts
test('Base renders the site header and footer by default', async () => {
  const html = await render(Base, { props: { title: 'Chrome' } });
  expect(html).toContain('rvd-site-header');
  expect(html).toContain('rvd-site-footer');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/chrome.test.ts src/layouts`
Expected: FAIL, modules not found / header missing.

- [ ] **Step 3: Write `Wordmark.astro` and `ThemeToggle.astro`**

`src/components/Wordmark.astro`:
```astro
---
interface Props {
  first: string;
  last: string;
  href?: string;
}

const { first, last, href = '/' } = Astro.props;
---
<a class="rvd-wordmark type-wordmark" href={href}>{first}<span class="rvd-wordmark__slash">/</span>{last}</a>

<style>
  .rvd-wordmark {
    text-decoration: none;
  }

  .rvd-wordmark__slash {
    color: var(--rvd-accent);
  }
</style>
```

`src/components/ThemeToggle.astro`:
```astro
---
interface Props {
  label?: string;
}

const { label = 'Color mode' } = Astro.props;
---
<wa-radio-group
  class="rvd-theme-toggle"
  label={label}
  orientation="horizontal"
  size="s"
  value="system"
  data-rvd-theme-toggle
>
  <wa-radio appearance="button" value="light">Light</wa-radio>
  <wa-radio appearance="button" value="dark">Dark</wa-radio>
  <wa-radio appearance="button" value="system">System</wa-radio>
</wa-radio-group>

<script>
  type RadioGroup = HTMLElement & { value: string | null };

  for (const group of document.querySelectorAll<RadioGroup>('[data-rvd-theme-toggle]')) {
    group.value = window.rvd.getMode();
    group.addEventListener('change', () => {
      if (group.value) window.rvd.setMode(group.value as RvdMode);
    });
    document.addEventListener('rvd:change', (event) => {
      group.value = event.detail.mode;
    });
  }
</script>

<style>
  .rvd-theme-toggle {
    --wa-form-control-height: 24px;
    --wa-form-control-padding-inline: 9px;
    --wa-form-control-border-color: transparent;
    --wa-form-control-activated-color: transparent;
    --wa-color-surface-default: transparent;
    --wa-color-brand-fill-quiet: var(--rvd-surface);
  }

  .rvd-theme-toggle::part(form-control-label) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .rvd-theme-toggle::part(form-control-input) {
    flex-wrap: nowrap;
    gap: 2px;
    padding: 3px;
    border: 1px solid var(--rvd-line);
    border-radius: var(--rvd-radius-md);
  }

  .rvd-theme-toggle wa-radio {
    margin: 0;
    border-radius: var(--rvd-radius-sm);
    color: var(--rvd-muted);
    font-family: var(--rvd-font-mono);
    font-size: var(--rvd-text-label-sm);
    text-transform: uppercase;
  }

  .rvd-theme-toggle wa-radio:state(checked) {
    color: var(--rvd-ink);
  }
</style>
```

- [ ] **Step 4: Write `SiteHeader.astro` and `SiteFooter.astro`**

`src/components/layout/SiteHeader.astro`:
```astro
---
import ThemeToggle from '../ThemeToggle.astro';
import Wordmark from '../Wordmark.astro';
import Container from './Container.astro';
---
<header class="rvd-site-header">
  <Container>
    <div class="rvd-site-header__row">
      <Wordmark first="Buddy" last="Reno" />
      <ThemeToggle />
    </div>
  </Container>
</header>

<style>
  .rvd-site-header__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-block: 28px;
  }
</style>
```

`src/components/layout/SiteFooter.astro`:
```astro
---
import Container from './Container.astro';

const year = new Date().getFullYear();
---
<footer class="rvd-site-footer type-caption" data-rvd-tone="deep">
  <Container>
    <div class="rvd-site-footer__row">
      <span><slot name="start">© {year} Buddy Reno</slot></span>
      <span><slot name="end">Nashville, TN</slot></span>
    </div>
  </Container>
</footer>

<style>
  .rvd-site-footer {
    border-top: 1px solid var(--rvd-line);
    color: var(--rvd-muted);
  }

  .rvd-site-footer__row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
    padding-block: 22px 36px;
  }
</style>
```

- [ ] **Step 5: Default the header/footer in `Base.astro`**

In `src/layouts/Base.astro` add imports to the frontmatter:
```ts
import SiteFooter from '../components/layout/SiteFooter.astro';
import SiteHeader from '../components/layout/SiteHeader.astro';
```
and replace the two slot lines:
```astro
    <slot name="header"><SiteHeader /></slot>
```
```astro
    <slot name="footer"><SiteFooter /></slot>
```

- [ ] **Step 6: Run tests and check**

Run: `npx vitest run && npx astro check`
Expected: all pass; `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add src/components src/layouts
git commit -m "feat(rivendell): wordmark, theme toggle, site header and footer"
```

---

### Task 7: Text components — Heading, LabelList/LabelRow, Quote, StatusDot, Tag/TagList, SocialLinks

**Files:**
- Create: `src/components/{Heading,LabelList,LabelRow,Quote,StatusDot,Tag,TagList,SocialLinks}.astro`, `src/components/text.test.ts`

**Interfaces:**
- Consumes: `SocialLink` type (Task 5).
- Produces:
  - `<Heading level?: 1|2|3|4 (default 2) size?: 'hero'|'xl'|'section' (default 'section') accent?: string id? class?>`, applying `type-display-{hero|xl|section}` and rendering the accent in `.rvd-heading__accent`.
  - `<LabelList closed?: boolean (default true)>` renders `<dl class="rvd-label-list">`; `<LabelRow label: string>` renders `<div><dt/><dd/></div>`.
  - `<Quote name: string role?: string>` (slot = quote text).
  - `<StatusDot pulse?: boolean>` (slot = text).
  - `<Tag>` (slot) and `<TagList tags: string[]>` (renders nothing when empty).
  - `<SocialLinks links: SocialLink[] label?: string (default 'Elsewhere')>`.

- [ ] **Step 1: Write failing tests**

`src/components/text.test.ts`:
```ts
import { expect, test } from 'vitest';
import { render } from '../test/render';
import Heading from './Heading.astro';
import LabelList from './LabelList.astro';
import LabelRow from './LabelRow.astro';
import Quote from './Quote.astro';
import SocialLinks from './SocialLinks.astro';
import StatusDot from './StatusDot.astro';
import TagList from './TagList.astro';

test('Heading maps level and size, and renders an accent character', async () => {
  const html = await render(Heading, {
    props: { level: 1, size: 'hero', accent: '.' },
    slots: { default: "Hi, I'm Alex" },
  });
  expect(html).toMatch(/<h1[^>]*class="[^"]*type-display-hero/);
  expect(html).toMatch(/Hi, I'm Alex<span[^>]*class="rvd-heading__accent"[^>]*>\.<\/span>/);
});

test('Heading defaults to an h2 section heading without accent', async () => {
  const html = await render(Heading, { slots: { default: 'Now' } });
  expect(html).toMatch(/<h2[^>]*class="[^"]*type-display-section/);
  expect(html).not.toContain('rvd-heading__accent');
});

test('LabelRow renders a dt/dd pair inside a LabelList dl', async () => {
  const row = await render(LabelRow, { props: { label: 'Reading' }, slots: { default: 'Book title' } });
  expect(row).toMatch(/<dt[^>]*>Reading<\/dt>/);
  expect(row).toMatch(/<dd[^>]*>Book title<\/dd>/);
  const list = await render(LabelList, { props: { closed: false } });
  expect(list).toMatch(/<dl[^>]*class="rvd-label-list"/);
  expect(list).toContain('data-rvd-closed="false"');
});

test('Quote renders figure, blockquote, and attribution', async () => {
  const html = await render(Quote, {
    props: { name: 'Teammate Name', role: 'Staff Engineer, Company' },
    slots: { default: 'Great to work with.' },
  });
  expect(html).toMatch(/<figure[\s\S]*<blockquote[\s\S]*Great to work with\.[\s\S]*<figcaption/);
  expect(html).toContain('Teammate Name');
  expect(html).toContain('Staff Engineer, Company');
});

test('StatusDot can pulse', async () => {
  const html = await render(StatusDot, { props: { pulse: true }, slots: { default: 'Open to new projects' } });
  expect(html).toContain('data-rvd-pulse');
  expect(html).toContain('Open to new projects');
});

test('TagList joins tags with a hidden separator and renders nothing when empty', async () => {
  const html = await render(TagList, { props: { tags: ['Rails', 'Hotwire'] } });
  expect(html).toMatch(/Rails[\s\S]*aria-hidden="true"[^>]*> · <[\s\S]*Hotwire/);
  const empty = await render(TagList, { props: { tags: [] } });
  expect(empty).not.toContain('rvd-tag-list');
});

test('SocialLinks renders a labelled list of links', async () => {
  const html = await render(SocialLinks, {
    props: { links: [{ label: 'GitHub', href: 'https://github.com/BuddyLReno' }] },
  });
  expect(html).toMatch(/<ul[^>]*aria-label="Elsewhere"/);
  expect(html).toContain('<a href="https://github.com/BuddyLReno"');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/text.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `Heading.astro`, `LabelList.astro`, `LabelRow.astro`**

`src/components/Heading.astro`:
```astro
---
interface Props {
  level?: 1 | 2 | 3 | 4;
  size?: 'hero' | 'xl' | 'section';
  accent?: string;
  id?: string;
  class?: string;
}

const { level = 2, size = 'section', accent, id, class: className } = Astro.props;
const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
---
<Tag id={id} class:list={['rvd-heading', `type-display-${size}`, className]}><slot />{accent && <span class="rvd-heading__accent">{accent}</span>}</Tag>

<style>
  .rvd-heading {
    margin: 0;
    min-width: 0;
  }

  .rvd-heading__accent {
    color: var(--rvd-accent);
  }
</style>
```

`src/components/LabelList.astro`:
```astro
---
interface Props {
  closed?: boolean;
}

const { closed = true } = Astro.props;
---
<dl class="rvd-label-list" data-rvd-closed={String(closed)}><slot /></dl>

<style>
  .rvd-label-list {
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  .rvd-label-list[data-rvd-closed='true'] {
    border-bottom: 1px solid var(--rvd-line);
  }
</style>
```

`src/components/LabelRow.astro`:
```astro
---
interface Props {
  label: string;
}

const { label } = Astro.props;
---
<div class="rvd-label-row">
  <dt class="rvd-label-row__label type-label">{label}</dt>
  <dd class="rvd-label-row__content type-body-md"><slot /></dd>
</div>

<style>
  .rvd-label-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 20px;
    padding-block: 12px;
    border-top: 1px solid var(--rvd-line);
  }

  .rvd-label-row__label {
    flex: 0 0 100px;
    color: var(--rvd-muted);
  }

  .rvd-label-row__content {
    flex: 1 1 300px;
    min-width: 0;
    margin: 0;
  }
</style>
```

- [ ] **Step 4: Write `Quote.astro`, `StatusDot.astro`**

`src/components/Quote.astro`:
```astro
---
interface Props {
  name: string;
  role?: string;
}

const { name, role } = Astro.props;
---
<figure class="rvd-quote">
  <blockquote class="rvd-quote__text">“<slot />”</blockquote>
  <figcaption class="rvd-quote__caption">
    <span class="rvd-quote__name">{name}</span>{role && <> · {role}</>}
  </figcaption>
</figure>

<style>
  .rvd-quote {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
  }

  .rvd-quote__text {
    margin: 0;
    font-size: var(--rvd-text-body);
    line-height: 1.6;
    text-wrap: pretty;
  }

  .rvd-quote__caption {
    color: var(--rvd-muted);
    font-size: var(--rvd-text-ui);
  }

  .rvd-quote__name {
    color: var(--rvd-ink);
    font-weight: 600;
  }
</style>
```

`src/components/StatusDot.astro`:
```astro
---
interface Props {
  pulse?: boolean;
}

const { pulse = false } = Astro.props;
---
<p class="rvd-status" data-rvd-pulse={pulse ? '' : undefined}>
  <span class="rvd-status__dot" aria-hidden="true"></span>
  <span><slot /></span>
</p>

<style>
  .rvd-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--rvd-muted);
    font-size: var(--rvd-text-ui);
  }

  .rvd-status__dot {
    width: 7px;
    height: 7px;
    border-radius: var(--rvd-radius-full);
    background: var(--rvd-accent);
  }

  .rvd-status[data-rvd-pulse] .rvd-status__dot {
    animation: rvd-pulse 2s ease-out infinite;
  }

  @keyframes rvd-pulse {
    from {
      box-shadow: 0 0 0 0 color-mix(in oklab, var(--rvd-accent) 80%, transparent);
    }
    to {
      box-shadow: 0 0 0 10px transparent;
    }
  }
</style>
```

- [ ] **Step 5: Write `Tag.astro`, `TagList.astro`, `SocialLinks.astro`**

`src/components/Tag.astro`:
```astro
<span class="rvd-tag type-label-sm"><slot /></span>

<style>
  .rvd-tag {
    color: var(--rvd-muted);
  }
</style>
```

`src/components/TagList.astro`:
```astro
---
import Tag from './Tag.astro';

interface Props {
  tags: string[];
}

const { tags } = Astro.props;
---
{
  tags.length > 0 && (
    <span class="rvd-tag-list">
      {tags.map((tag, index) => (
        <>
          {index > 0 && <span class="rvd-tag-list__sep type-label-sm" aria-hidden="true"> · </span>}
          <Tag>{tag}</Tag>
        </>
      ))}
    </span>
  )
}

<style>
  .rvd-tag-list__sep {
    color: var(--rvd-muted);
  }
</style>
```

`src/components/SocialLinks.astro`:
```astro
---
import type { SocialLink } from './types';

interface Props {
  links: SocialLink[];
  label?: string;
}

const { links, label = 'Elsewhere' } = Astro.props;
---
<ul class="rvd-social type-ui" aria-label={label}>
  {links.map((link) => <li><a href={link.href}>{link.label}</a></li>)}
</ul>

<style>
  .rvd-social {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 20px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
```

- [ ] **Step 6: Run tests and check**

Run: `npx vitest run && npx astro check`
Expected: all pass; `0 errors`. If the TagList separator regex fails because Astro collapses whitespace differently, print the HTML (`console.log(html)`) and adjust only the regex, not the component.

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -m "feat(rivendell): heading, label rows, quote, status dot, tags, social links"
```

---

### Task 8: Interactive components — LinkList/LinkCard, Avatar, Button, CopyEmail

**Files:**
- Create: `src/components/{LinkList,LinkCard,Avatar,Button,CopyEmail}.astro`, `src/components/interactive.test.ts`

**Interfaces:**
- Consumes: `TagList` (Task 7), WA `wa-avatar`, `wa-button`, `wa-copy-button` (registered in Task 4).
- Produces:
  - `<LinkList>` renders `<ul class="rvd-link-list">`; `<LinkCard href title tags?: string[] external?: boolean>` renders an `<li>` (slot = blurb).
  - `<Avatar src?: string label: string>`: `wa-avatar` with image when `src` is set, striped placeholder otherwise.
  - `<Button appearance?: 'primary' | 'quiet' href? type?: 'button' | 'submit'>` wrapping `wa-button`; named slot `sub` for the mono sub-label.
  - `<CopyEmail email: string>` wrapping `wa-copy-button` with a custom trigger; toggles "Copy" → "Copied" for 1.6s and announces via `aria-live`.

- [ ] **Step 1: Write failing tests**

`src/components/interactive.test.ts`:
```ts
import { expect, test } from 'vitest';
import { render } from '../test/render';
import Avatar from './Avatar.astro';
import Button from './Button.astro';
import CopyEmail from './CopyEmail.astro';
import LinkCard from './LinkCard.astro';
import LinkList from './LinkList.astro';

test('LinkCard renders title, blurb, tags, and an arrow only when external', async () => {
  const external = await render(LinkCard, {
    props: { href: 'https://example.com', title: 'Project name', tags: ['Rails'], external: true },
    slots: { default: 'One line on what it does.' },
  });
  expect(external).toMatch(/<li[\s\S]*<a[^>]*href="https:\/\/example.com"[^>]*rel="external"/);
  expect(external).toContain('Project name');
  expect(external).toContain('One line on what it does.');
  expect(external).toContain('Rails');
  expect(external).toContain('↗');
  const internal = await render(LinkCard, { props: { href: '/projects/x/', title: 'Internal' } });
  expect(internal).not.toContain('↗');
  expect(internal).not.toContain('rel="external"');
});

test('LinkList is a list', async () => {
  const html = await render(LinkList);
  expect(html).toMatch(/<ul[^>]*class="rvd-link-list"/);
});

test('Avatar uses wa-avatar with an image, placeholder otherwise', async () => {
  const withImage = await render(Avatar, { props: { src: '/me.jpg', label: 'Buddy Reno' } });
  expect(withImage).toMatch(/<wa-avatar[^>]*image="\/me.jpg"[^>]*label="Buddy Reno"/);
  const placeholder = await render(Avatar, { props: { label: 'Buddy Reno' } });
  expect(placeholder).toMatch(/role="img"[^>]*aria-label="Buddy Reno"/);
  expect(placeholder).not.toContain('<wa-avatar');
});

test('Button maps appearance to wa-button and renders the sub slot', async () => {
  const primary = await render(Button, { slots: { default: 'Say hi', sub: 'Copy' } });
  expect(primary).toMatch(/<wa-button[^>]*variant="brand"[^>]*appearance="accent"/);
  expect(primary).toMatch(/slot="end"[^>]*>[\s\S]*Copy/);
  const quiet = await render(Button, { props: { appearance: 'quiet', href: '/x/' } });
  expect(quiet).toMatch(/<wa-button[^>]*appearance="plain"/);
  expect(quiet).toContain('href="/x/"');
});

test('CopyEmail copies the address and has a live status region', async () => {
  const html = await render(CopyEmail, { props: { email: 'hello@example.com' } });
  expect(html).toMatch(/<wa-copy-button[^>]*value="hello@example.com"[^>]*tooltip="none"/);
  expect(html).toContain('data-rvd-copy-label');
  expect(html).toMatch(/aria-live="polite"[^>]*data-rvd-copy-status/);
  expect(html).toContain('hello@example.com');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/interactive.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `LinkList.astro` and `LinkCard.astro`**

`src/components/LinkList.astro`:
```astro
<ul class="rvd-link-list"><slot /></ul>

<style>
  .rvd-link-list {
    display: flex;
    flex-direction: column;
    margin: 0 -14px;
    padding: 0;
    list-style: none;
  }
</style>
```

`src/components/LinkCard.astro`:
```astro
---
import TagList from './TagList.astro';

interface Props {
  href: string;
  title: string;
  tags?: string[];
  external?: boolean;
}

const { href, title, tags = [], external = false } = Astro.props;
---
<li>
  <a class="rvd-link-card" href={href} rel={external ? 'external' : undefined}>
    <span class="rvd-link-card__body">
      <span class="rvd-link-card__title">{title}{external && <span class="rvd-link-card__arrow" aria-hidden="true"> ↗</span>}</span>
      {Astro.slots.has('default') && <span class="rvd-link-card__blurb type-body-sm"><slot /></span>}
    </span>
    <TagList tags={tags} />
  </a>
</li>

<style>
  .rvd-link-card {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 16px;
    padding: 14px;
    border-radius: var(--rvd-radius-lg);
    text-decoration: none;
    transition: background-color var(--rvd-dur-fast);
  }

  .rvd-link-card:hover {
    background-color: var(--rvd-hover);
    color: var(--rvd-ink);
  }

  .rvd-link-card__body {
    display: flex;
    flex: 1 1 320px;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .rvd-link-card__title {
    font-size: var(--rvd-text-body);
    font-weight: 700;
  }

  .rvd-link-card__arrow {
    color: var(--rvd-accent-text);
    font-weight: 600;
  }

  .rvd-link-card__blurb {
    color: var(--rvd-muted);
    text-wrap: pretty;
  }
</style>
```

- [ ] **Step 4: Write `Avatar.astro` and `Button.astro`**

`src/components/Avatar.astro`:
```astro
---
interface Props {
  src?: string;
  label: string;
}

const { src, label } = Astro.props;
---
{
  src ? (
    <wa-avatar class="rvd-avatar" image={src} label={label} />
  ) : (
    <div class="rvd-avatar rvd-avatar--placeholder type-label-sm" role="img" aria-label={label}>photo</div>
  )
}

<style>
  .rvd-avatar {
    --size: clamp(64px, 11vw, 84px);
    flex: 0 0 auto;
    width: var(--size);
    aspect-ratio: 1;
    border: 1px solid var(--rvd-line);
    border-radius: var(--rvd-radius-full);
  }

  .rvd-avatar--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: repeating-linear-gradient(135deg, var(--rvd-surface) 0 6px, var(--rvd-bg) 6px 12px);
    color: var(--rvd-muted);
  }
</style>
```

`src/components/Button.astro`:
```astro
---
interface Props {
  appearance?: 'primary' | 'quiet';
  href?: string;
  type?: 'button' | 'submit';
}

const { appearance = 'primary', href, type = 'button' } = Astro.props;
---
<wa-button
  class:list={['rvd-button', `rvd-button--${appearance}`]}
  variant="brand"
  appearance={appearance === 'primary' ? 'accent' : 'plain'}
  href={href}
  type={href ? undefined : type}
>
  <slot />
  {Astro.slots.has('sub') && <span slot="end" class="rvd-button__sub type-label-sm"><slot name="sub" /></span>}
</wa-button>

<style>
  .rvd-button::part(button) {
    gap: 12px;
    height: auto;
    padding: 12px 18px;
    border-radius: var(--rvd-radius-lg);
    font-family: var(--rvd-font-body);
    font-size: var(--rvd-text-body-sm);
    font-weight: 700;
    transition: opacity var(--rvd-dur-fast);
  }

  .rvd-button--primary:hover::part(button) {
    opacity: 0.9;
  }

  .rvd-button__sub {
    opacity: 0.85;
  }
</style>
```

- [ ] **Step 5: Write `CopyEmail.astro`**

```astro
---
import Button from './Button.astro';

interface Props {
  email: string;
}

const { email } = Astro.props;
---
<span class="rvd-copy-email" data-rvd-copy-email>
  <wa-copy-button value={email} tooltip="none" feedback-duration="1600">
    <Button>{email}<span slot="sub" data-rvd-copy-label>Copy</span></Button>
  </wa-copy-button>
  <span class="sr-only" aria-live="polite" data-rvd-copy-status></span>
</span>

<script>
  const RESET_MS = 1600;

  for (const root of document.querySelectorAll<HTMLElement>('[data-rvd-copy-email]')) {
    const label = root.querySelector<HTMLElement>('[data-rvd-copy-label]');
    const status = root.querySelector<HTMLElement>('[data-rvd-copy-status]');
    let timer: ReturnType<typeof setTimeout> | undefined;

    const show = (text: string, announcement: string) => {
      if (label) label.textContent = text;
      if (status) status.textContent = announcement;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (label) label.textContent = 'Copy';
        if (status) status.textContent = '';
      }, RESET_MS);
    };

    root.addEventListener('wa-copy', () => show('Copied', 'Email address copied'));
    root.addEventListener('wa-error', () => show('Select to copy', 'Could not copy the email address'));
  }
</script>
```

- [ ] **Step 6: Run tests and check**

Run: `npx vitest run && npx astro check`
Expected: all pass; `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -m "feat(rivendell): link cards, avatar, button, copy email"
```

---

### Task 9: Long-form — code colors, prose, formatting helpers, PostMeta, PostList, ProjectHeader

**Files:**
- Create: `src/styles/code.css`, `src/styles/prose.css`, `src/lib/format.ts`, `src/lib/format.test.ts`, `src/components/{Prose,PostMeta,PostList,ProjectHeader}.astro`, `src/components/longform.test.ts`
- Modify: `src/styles/global.css` (imports)

**Interfaces:**
- Consumes: `Heading`, `TagList`, `LabelList`, `LabelRow` (Task 7).
- Produces:
  - `formatDate(date: Date): string` returning e.g. `Sep 24, 2026`, always in UTC. `isoDate(date: Date): string` returning `2026-09-24`. `readingTime(text: string): number` (minutes, min 1, 230 wpm).
  - `<Prose>` wrapper (`.rvd-prose`).
  - `<PostMeta date: Date updated?: Date minutes?: number tags?: string[]>`.
  - `<PostList posts: PostSummary[] empty?: string>` where `interface PostSummary { href: string; title: string; date: Date; description?: string }` is exported from `src/lib/format.ts`.
  - `<ProjectHeader name blurb? tags?: string[] url? repo? cover?: ImageMetadata coverAlt?>`.

- [ ] **Step 1: Write failing tests**

`src/lib/format.test.ts`:
```ts
import { expect, test } from 'vitest';
import { formatDate, isoDate, readingTime } from './format';

test('formatDate formats in UTC so frontmatter dates never shift a day', () => {
  // Frontmatter `date: 2026-09-24` becomes UTC midnight.
  expect(formatDate(new Date('2026-09-24'))).toBe('Sep 24, 2026');
  expect(formatDate(new Date('2026-01-01T00:00:00Z'))).toBe('Jan 1, 2026');
});

test('isoDate returns the UTC calendar date', () => {
  expect(isoDate(new Date('2026-09-24'))).toBe('2026-09-24');
});

test('readingTime rounds up at 230 words per minute with a 1 minute floor', () => {
  expect(readingTime('')).toBe(1);
  expect(readingTime('word '.repeat(230))).toBe(1);
  expect(readingTime('word '.repeat(231))).toBe(2);
  expect(readingTime('  spaced\n\nout   words ')).toBe(1);
});
```

The UTC test only proves anything when the machine's zone is behind UTC. Add to `package.json`: `npm pkg set scripts.test="TZ=America/Chicago vitest run"`.

`src/components/longform.test.ts`:
```ts
import { expect, test } from 'vitest';
import { render } from '../test/render';
import PostList from './PostList.astro';
import PostMeta from './PostMeta.astro';
import ProjectHeader from './ProjectHeader.astro';
import Prose from './Prose.astro';

test('Prose wraps content in .rvd-prose', async () => {
  const html = await render(Prose, { slots: { default: '<p>Body</p>' } });
  expect(html).toMatch(/<div[^>]*class="rvd-prose"[^>]*><p>Body<\/p>/);
});

test('PostMeta renders a machine-readable date, reading time, and tags', async () => {
  const html = await render(PostMeta, {
    props: { date: new Date('2026-09-24'), minutes: 4, tags: ['CSS'] },
  });
  expect(html).toMatch(/<time[^>]*datetime="2026-09-24"[^>]*>Sep 24, 2026<\/time>/);
  expect(html).toContain('4 min read');
  expect(html).toContain('CSS');
});

test('PostList lists posts as label rows', async () => {
  const html = await render(PostList, {
    props: {
      posts: [{ href: '/blog/a/', title: 'Post A', date: new Date('2026-09-24'), description: 'About A' }],
    },
  });
  expect(html).toContain('<dl');
  expect(html).toMatch(/<dt[^>]*>Sep 24, 2026<\/dt>/);
  expect(html).toMatch(/<a href="\/blog\/a\/"[^>]*>Post A<\/a>/);
  expect(html).toContain('About A');
});

test('PostList shows an empty state instead of an empty list', async () => {
  const html = await render(PostList, { props: { posts: [] } });
  expect(html).not.toContain('<dl');
  expect(html).toContain('Nothing here yet.');
});

test('ProjectHeader renders name, blurb, tags, and links', async () => {
  const html = await render(ProjectHeader, {
    props: { name: 'Side project', blurb: 'Small and useful.', tags: ['Astro'], url: 'https://x.dev', repo: 'https://github.com/x' },
  });
  expect(html).toMatch(/<h1[^>]*type-display-hero[^>]*>Side project/);
  expect(html).toContain('Small and useful.');
  expect(html).toContain('Astro');
  expect(html).toContain('href="https://x.dev"');
  expect(html).toContain('href="https://github.com/x"');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib src/components/longform.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `src/lib/format.ts`**

```ts
export interface PostSummary {
  href: string;
  title: string;
  date: Date;
  description?: string;
}

const WORDS_PER_MINUTE = 230;
const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
```

- [ ] **Step 4: Write `src/styles/code.css` and `src/styles/prose.css`**

`src/styles/code.css`:
```css
/* Shiki `css-variables` theme → Rivendell tokens (markdown code blocks and <Code />). */
:root,
[data-rvd-tone] {
  --astro-code-foreground: var(--rvd-ink);
  --astro-code-background: var(--rvd-surface);
  --astro-code-token-constant: var(--rvd-accent-text);
  --astro-code-token-string: var(--rvd-accent-2-text);
  --astro-code-token-comment: var(--rvd-muted);
  --astro-code-token-keyword: var(--rvd-accent-text);
  --astro-code-token-parameter: var(--rvd-ink);
  --astro-code-token-function: var(--rvd-accent-2-text);
  --astro-code-token-string-expression: var(--rvd-accent-2-text);
  --astro-code-token-punctuation: var(--rvd-muted);
  --astro-code-token-link: var(--rvd-accent-text);
}

.astro-code {
  padding: 16px 18px;
  border-radius: var(--rvd-radius-lg);
  font-family: var(--rvd-font-mono);
  font-size: 14px;
  line-height: 1.6;
}
```

`src/styles/prose.css`:
```css
/* Long-form content (blog posts, project write-ups, simple pages). */
.rvd-prose {
  font-size: var(--rvd-text-body);
  line-height: 1.65;
}

.rvd-prose > * {
  margin-block: 0;
}

.rvd-prose > * + * {
  margin-block-start: 1em;
}

.rvd-prose h2 {
  margin-block-start: 2em;
  font-family: var(--rvd-font-display);
  font-weight: 800;
  font-size: var(--rvd-text-section);
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.rvd-prose h3 {
  margin-block-start: 1.6em;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

.rvd-prose h4 {
  margin-block-start: 1.4em;
  font-size: var(--rvd-text-body);
  font-weight: 700;
  line-height: 1.4;
}

.rvd-prose :is(h2, h3, h4) + * {
  margin-block-start: 0.6em;
}

.rvd-prose ul {
  padding-inline-start: 1.25em;
  list-style: disc;
}

.rvd-prose ol {
  padding-inline-start: 1.25em;
  list-style: decimal;
}

.rvd-prose li + li {
  margin-block-start: 0.35em;
}

.rvd-prose li::marker {
  color: var(--rvd-accent-text);
}

.rvd-prose :not(pre) > code {
  padding: 0.15em 0.35em;
  border-radius: var(--rvd-radius-sm);
  background: var(--rvd-surface);
  font-family: var(--rvd-font-mono);
  font-size: 0.85em;
}

.rvd-prose pre {
  overflow-x: auto;
}

.rvd-prose blockquote {
  padding-inline-start: 18px;
  border-inline-start: 3px solid var(--rvd-accent);
  font-size: var(--rvd-text-body);
  line-height: 1.6;
}

.rvd-prose img {
  max-width: 100%;
  height: auto;
  border-radius: var(--rvd-radius-lg);
}

.rvd-prose figcaption {
  margin-block-start: 8px;
  color: var(--rvd-muted);
  font-size: var(--rvd-text-caption);
}

.rvd-prose hr {
  margin-block: 2.5em;
  border: 0;
  border-top: 1px solid var(--rvd-line);
}

.rvd-prose table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--rvd-text-body-md);
}

.rvd-prose th {
  color: var(--rvd-muted);
  font-family: var(--rvd-font-mono);
  font-size: var(--rvd-text-label);
  font-weight: 400;
  text-align: start;
  text-transform: uppercase;
}

.rvd-prose :is(th, td) {
  padding: 10px 12px 10px 0;
  border-bottom: 1px solid var(--rvd-line);
}
```

Add to `src/styles/global.css` directly after `@import './base.css';`:
```css
@import './code.css';
@import './prose.css';
```

- [ ] **Step 5: Write `Prose.astro`, `PostMeta.astro`, `PostList.astro`, `ProjectHeader.astro`**

`src/components/Prose.astro`:
```astro
<div class="rvd-prose"><slot /></div>
```

`src/components/PostMeta.astro`:
```astro
---
import { formatDate, isoDate } from '../lib/format';

interface Props {
  date: Date;
  updated?: Date;
  minutes?: number;
  tags?: string[];
}

const { date, updated, minutes, tags = [] } = Astro.props;
---
<p class="rvd-post-meta type-label">
  <time datetime={isoDate(date)}>{formatDate(date)}</time>
  {updated && <> · Updated <time datetime={isoDate(updated)}>{formatDate(updated)}</time></>}
  {minutes && <> · {minutes} min read</>}
  {tags.length > 0 && <> · {tags.join(' · ')}</>}
</p>

<style>
  .rvd-post-meta {
    margin: 0;
    color: var(--rvd-muted);
  }
</style>
```

`src/components/PostList.astro`:
```astro
---
import { formatDate, type PostSummary } from '../lib/format';
import LabelList from './LabelList.astro';
import LabelRow from './LabelRow.astro';

interface Props {
  posts: PostSummary[];
  empty?: string;
}

const { posts, empty = 'Nothing here yet.' } = Astro.props;
---
{
  posts.length === 0 ? (
    <p class="rvd-post-list__empty">{empty}</p>
  ) : (
    <LabelList>
      {posts.map((post) => (
        <LabelRow label={formatDate(post.date)}>
          <a href={post.href}>{post.title}</a>
          {post.description && <span class="rvd-post-list__description"> · {post.description}</span>}
        </LabelRow>
      ))}
    </LabelList>
  )
}

<style>
  .rvd-post-list__empty,
  .rvd-post-list__description {
    color: var(--rvd-muted);
  }

  .rvd-post-list__empty {
    margin: 0;
  }
</style>
```

`src/components/ProjectHeader.astro`:
```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import Heading from './Heading.astro';
import TagList from './TagList.astro';

interface Props {
  name: string;
  blurb?: string;
  tags?: string[];
  url?: string;
  repo?: string;
  cover?: ImageMetadata;
  coverAlt?: string;
}

const { name, blurb, tags = [], url, repo, cover, coverAlt = '' } = Astro.props;
---
<header class="rvd-project-header">
  <Heading level={1} size="hero" accent=".">{name}</Heading>
  {blurb && <p class="rvd-project-header__blurb type-body-lg">{blurb}</p>}
  <TagList tags={tags} />
  {
    (url || repo) && (
      <p class="rvd-project-header__links type-ui">
        {url && <a href={url} rel="external">Live ↗</a>}
        {repo && <a href={repo} rel="external">Source ↗</a>}
      </p>
    )
  }
  {cover && <Image class="rvd-project-header__cover" src={cover} alt={coverAlt} />}
</header>

<style>
  .rvd-project-header {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .rvd-project-header__blurb {
    margin: 0;
    color: var(--rvd-muted);
  }

  .rvd-project-header__links {
    display: flex;
    gap: 20px;
    margin: 0;
  }

  .rvd-project-header__cover {
    width: 100%;
    height: auto;
    border-radius: var(--rvd-radius-lg);
  }
</style>
```

- [ ] **Step 6: Run tests and check**

Run: `npm test && npx astro check`
Expected: all pass (the `formatDate` test runs under `TZ=America/Chicago`); `0 errors`.

- [ ] **Step 7: Commit**

```bash
git add src package.json
git commit -m "feat(rivendell): prose, code colors, post meta/list, project header"
```

---

### Task 10: Content collections, page layouts, and routes

**Files:**
- Create: `src/content.config.ts`, `src/content/posts/sample-post.md`, `src/content/projects/sample-project.md`, `src/content/pages/now.md`, `src/layouts/{Page,Post,Project}.astro`, `src/pages/[slug].astro`, `src/pages/blog/index.astro`, `src/pages/blog/[...slug].astro`, `src/pages/projects/[...slug].astro`, `src/lib/content.ts`, `src/lib/content.test.ts`

**Interfaces:**
- Consumes: `Base` (Task 4), `Section` (Task 5), `Heading` (Task 7), `Prose`, `PostMeta`, `PostList`, `ProjectHeader`, `readingTime` (Task 9).
- Produces: collections `posts` (`title, description, date, updated?, tags[], draft`), `projects` (`name, blurb, tags[], url?, repo?, cover?, order, draft`), `pages` (`title, description, draft`). `isPublished(entry: { data: { draft: boolean } }, prod?: boolean): boolean` from `src/lib/content.ts`. Layouts `Page { title, description? }`, `Post { title, description, date, updated?, tags, minutes }`, `Project { name, blurb, tags, url?, repo?, cover? }`.

- [ ] **Step 1: Write the failing test**

`src/lib/content.test.ts`:
```ts
import { expect, test } from 'vitest';
import { isPublished } from './content';

test('drafts are hidden in production and visible in dev', () => {
  const draft = { data: { draft: true } };
  const live = { data: { draft: false } };
  expect(isPublished(draft, true)).toBe(false);
  expect(isPublished(live, true)).toBe(true);
  expect(isPublished(draft, false)).toBe(true);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/content.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/lib/content.ts` and `src/content.config.ts`**

`src/lib/content.ts`:
```ts
export function isPublished(entry: { data: { draft: boolean } }, prod: boolean = import.meta.env.PROD): boolean {
  return prod ? !entry.data.draft : true;
}
```

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      blurb: z.string(),
      tags: z.array(z.string()).default([]),
      url: z.string().url().optional(),
      repo: z.string().url().optional(),
      cover: image().optional(),
      order: z.number().default(0),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, projects, pages };
```

- [ ] **Step 4: Write the sample entries (all drafts, A v3-style placeholder copy)**

`src/content/posts/sample-post.md`:
````md
---
title: A placeholder post title that runs a little long
description: One sentence on what this post covers and who it's for.
date: 2026-09-24
tags: [CSS, Design systems]
draft: true
---

This is sample copy for the Rivendell prose styles. It exists so every long-form element can be checked in both modes and every theme. Links look [like this](#), and `inline code` sits on the surface color.

## A section heading

Paragraph rhythm matters more than any single style. Short paragraphs, generous line height, and a comfortable measure keep long reads easy.

### A smaller heading

- An unordered list item
- Another item with a bit more text so it wraps onto a second line on narrow screens
- A third item

1. An ordered step
2. A second step

> A blockquote for when someone else said it better. It uses the Quote typography with an accent rule.

```ts
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230)); // minutes
}
```

#### A fourth-level heading

| Token | Light | Dark |
| --- | --- | --- |
| `--rvd-accent` | 0.53 | 0.74 |
| `--rvd-accent-text` | 0.48 | 0.74 |

---

A closing paragraph after a rule.
````

`src/content/projects/sample-project.md`:
```md
---
name: Side project
blurb: Small, useful, and shipped. Link to the live thing or the repo.
tags: [Web Components, Astro]
url: https://example.com
repo: https://github.com/BuddyLReno
order: 1
draft: true
---

A short write-up: the problem, what was built, and a measurable outcome.

## What it does

One or two paragraphs of placeholder copy for the project layout.
```

`src/content/pages/now.md`:
```md
---
title: Now
description: What I'm focused on right now.
draft: true
---

A simple content page. **Building** a small, useful thing. **Reading** a book title by an author name. **Learning** something new.
```

- [ ] **Step 5: Write the three layouts**

`src/layouts/Page.astro`:
```astro
---
import Heading from '../components/Heading.astro';
import Section from '../components/layout/Section.astro';
import Prose from '../components/Prose.astro';
import Base from './Base.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---
<Base title={`${title} · Buddy Reno`} description={description}>
  <Section space="lg">
    <div class="rvd-page">
      <Heading level={1} size="hero" accent=".">{title}</Heading>
      <Prose><slot /></Prose>
    </div>
  </Section>
</Base>

<style>
  .rvd-page {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
</style>
```

`src/layouts/Post.astro`:
```astro
---
import Heading from '../components/Heading.astro';
import Section from '../components/layout/Section.astro';
import PostMeta from '../components/PostMeta.astro';
import Prose from '../components/Prose.astro';
import Base from './Base.astro';

interface Props {
  title: string;
  description: string;
  date: Date;
  updated?: Date;
  tags: string[];
  minutes: number;
}

const { title, description, date, updated, tags, minutes } = Astro.props;
---
<Base title={`${title} · Buddy Reno`} description={description}>
  <Section space="lg">
    <article class="rvd-post">
      <header class="rvd-post__header">
        <Heading level={1} size="xl" accent=".">{title}</Heading>
        <PostMeta date={date} updated={updated} minutes={minutes} tags={tags} />
      </header>
      <Prose><slot /></Prose>
    </article>
  </Section>
</Base>

<style>
  .rvd-post,
  .rvd-post__header {
    display: flex;
    flex-direction: column;
  }

  .rvd-post {
    gap: 32px;
  }

  .rvd-post__header {
    gap: 14px;
  }
</style>
```

`src/layouts/Project.astro`:
```astro
---
import type { ImageMetadata } from 'astro';
import Section from '../components/layout/Section.astro';
import ProjectHeader from '../components/ProjectHeader.astro';
import Prose from '../components/Prose.astro';
import Base from './Base.astro';

interface Props {
  name: string;
  blurb: string;
  tags: string[];
  url?: string;
  repo?: string;
  cover?: ImageMetadata;
}

const { name, blurb, tags, url, repo, cover } = Astro.props;
---
<Base title={`${name} · Buddy Reno`} description={blurb}>
  <Section space="lg">
    <article class="rvd-project">
      <ProjectHeader name={name} blurb={blurb} tags={tags} url={url} repo={repo} cover={cover} coverAlt={`${name} screenshot`} />
      <Prose><slot /></Prose>
    </article>
  </Section>
</Base>

<style>
  .rvd-project {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
</style>
```

- [ ] **Step 6: Write the routes**

`src/pages/blog/index.astro`:
```astro
---
import { getCollection } from 'astro:content';
import Heading from '../../components/Heading.astro';
import Section from '../../components/layout/Section.astro';
import PostList from '../../components/PostList.astro';
import Base from '../../layouts/Base.astro';
import { isPublished } from '../../lib/content';

const posts = (await getCollection('posts', isPublished))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  .map((post) => ({
    href: `/blog/${post.id}/`,
    title: post.data.title,
    date: post.data.date,
    description: post.data.description,
  }));
---
<Base title="Writing · Buddy Reno" description="Notes on frontend, design systems, and the web.">
  <Section space="lg">
    <div class="rvd-blog-index">
      <Heading level={1} size="hero" accent=".">Writing</Heading>
      <PostList posts={posts} />
    </div>
  </Section>
</Base>

<style>
  .rvd-blog-index {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
</style>
```

`src/pages/blog/[...slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import Post from '../../layouts/Post.astro';
import { isPublished } from '../../lib/content';
import { readingTime } from '../../lib/format';

export async function getStaticPaths() {
  const posts = await getCollection('posts', isPublished);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<Post {...post.data} minutes={readingTime(post.body ?? '')}>
  <Content />
</Post>
```

`src/pages/projects/[...slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import Project from '../../layouts/Project.astro';
import { isPublished } from '../../lib/content';

export async function getStaticPaths() {
  const projects = await getCollection('projects', isPublished);
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}

const { project } = Astro.props;
const { Content } = await render(project);
---
<Project {...project.data}>
  <Content />
</Project>
```

`src/pages/[slug].astro`:
```astro
---
import { getCollection, render } from 'astro:content';
import Page from '../layouts/Page.astro';
import { isPublished } from '../lib/content';

export async function getStaticPaths() {
  const pages = await getCollection('pages', isPublished);
  return pages.map((page) => ({ params: { slug: page.id }, props: { page } }));
}

const { page } = Astro.props;
const { Content } = await render(page);
---
<Page title={page.data.title} description={page.data.description}>
  <Content />
</Page>
```

- [ ] **Step 7: Run tests, check, and a production build**

Run: `npm test && npx astro check && npx astro build && ls dist dist/blog`
Expected: tests pass; `0 errors`; `dist/blog/index.html` exists; `dist/blog/sample-post`, `dist/projects`, and `dist/now` do **not** exist (drafts excluded).

Run: `grep -c 'Nothing here yet.' dist/blog/index.html`
Expected: `1`.

- [ ] **Step 8: Verify drafts render in dev**

Run: `npx astro dev --port 4321 &` then `sleep 4; curl -s localhost:4321/blog/sample-post/ | grep -c 'rvd-prose'; curl -s localhost:4321/projects/sample-project/ | grep -c 'rvd-project-header'; curl -s localhost:4321/now/ | grep -c 'rvd-prose'; kill %1`
Expected: each prints `1` or more.

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat(rivendell): content collections, page/post/project layouts, routes"
```

---

### Task 11: Contrast library and the /styleguide page

**Files:**
- Create: `src/lib/contrast.ts`, `src/lib/contrast.test.ts`, `src/components/styleguide/{Toolbar,Swatch,Example}.astro`, `src/components/styleguide/sample.ts`, `src/scripts/styleguide.ts`, `src/pages/styleguide.astro`, `src/pages/styleguide.test.ts`

**Interfaces:**
- Consumes: every component and layout from Tasks 4–10; `window.rvd`, `rvd:change` (Task 3); `TONES`, `Tone` (Task 5).
- Produces:
  - `contrastRatio(fg: string, bg: string): number` (throws on unparseable color).
  - `CONTRAST_PAIRS: ContrastPair[]`, `interface ContrastPair { fg: string; bg: string; min: number; use: string; tones?: Tone[] }`.
  - `pairsForTone(tone: Tone): ContrastPair[]`.
  - `evaluatePairs(resolve: (token: string) => string, pairs: ContrastPair[]): ContrastResult[]`, `interface ContrastResult extends ContrastPair { fgValue: string; bgValue: string; ratio: number; pass: boolean }`.
  - `resolveToken(scope: Element, token: string): string` (browser only).
  - `contrastReport(doc: Document): ToneContrastResult[]`, where `ToneContrastResult = ContrastResult & { theme: string; mode: 'light' | 'dark'; tone: Tone }`. It scans elements with `[data-rvd-contrast-scope][data-rvd-tone]`.
  - `/styleguide/` page exposing `window.rvdContrastReport()`.

- [ ] **Step 1: Write failing tests**

`src/lib/contrast.test.ts`:
```ts
import { expect, test } from 'vitest';
import { CONTRAST_PAIRS, contrastRatio, evaluatePairs, pairsForTone } from './contrast';

test('contrastRatio matches WCAG reference values', () => {
  expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
  expect(contrastRatio('#777', '#777')).toBeCloseTo(1, 5);
  expect(contrastRatio('oklch(0.21 0.02 265)', 'oklch(0.98 0.004 260)')).toBeGreaterThan(16);
  expect(contrastRatio('oklab(0.5 0 0)', 'rgb(255, 255, 255)')).toBeGreaterThan(4);
});

test('contrastRatio throws on colors it cannot parse', () => {
  expect(() => contrastRatio('color-mix(in oklab, red, blue)', '#fff')).toThrow(/Unparseable color/);
});

test('evaluatePairs marks pass/fail against each minimum', () => {
  const values: Record<string, string> = { '--a': '#000', '--b': '#fff', '--c': '#999' };
  const results = evaluatePairs((token) => values[token], [
    { fg: '--a', bg: '--b', min: 4.5, use: 'strong' },
    { fg: '--c', bg: '--b', min: 4.5, use: 'weak' },
  ]);
  expect(results.map((result) => result.pass)).toEqual([true, false]);
  expect(results[0].fgValue).toBe('#000');
});

test('pairs are scoped to tones where they apply', () => {
  expect(pairsForTone('base').length).toBe(CONTRAST_PAIRS.length);
  expect(pairsForTone('band').some((pair) => pair.bg === '--rvd-hover')).toBe(false);
  expect(pairsForTone('band').some((pair) => pair.fg === '--rvd-ink' && pair.bg === '--rvd-bg')).toBe(true);
});
```

`src/pages/styleguide.test.ts`:
```ts
import { expect, test } from 'vitest';
import { TONES } from '../components/types';
import { render } from '../test/render';
import Styleguide from './styleguide.astro';

test('styleguide is noindex and has one contrast scope per tone', async () => {
  const html = await render(Styleguide);
  expect(html).toContain('<meta name="robots" content="noindex">');
  for (const tone of TONES) {
    expect(html).toMatch(new RegExp(`data-rvd-contrast-scope[^>]*data-rvd-tone="${tone}"|data-rvd-tone="${tone}"[^>]*data-rvd-contrast-scope`));
  }
  for (const id of ['color', 'type', 'scale', 'tones', 'components', 'web-awesome', 'prose']) {
    expect(html).toContain(`id="${id}"`);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/contrast.test.ts src/pages/styleguide.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write `src/lib/contrast.ts`**

```ts
import { parse, wcagContrast } from 'culori';
import type { Tone } from '../components/types';

export interface ContrastPair {
  fg: string;
  bg: string;
  min: number;
  use: string;
  /** Tones this pair applies to. Omitted = every tone. */
  tones?: Tone[];
}

export interface ContrastResult extends ContrastPair {
  fgValue: string;
  bgValue: string;
  ratio: number;
  pass: boolean;
}

export type ToneContrastResult = ContrastResult & { theme: string; mode: 'light' | 'dark'; tone: Tone };

// Hover and surface pairs skip `band`: cards and code blocks don't go on the solid band (DESIGN.md).
const NOT_BAND: Tone[] = ['base', 'tint-1', 'tint-2', 'deep'];

export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: '--rvd-ink', bg: '--rvd-bg', min: 4.5, use: 'Body text' },
  { fg: '--rvd-muted', bg: '--rvd-bg', min: 4.5, use: 'Secondary text' },
  { fg: '--rvd-accent-text', bg: '--rvd-bg', min: 4.5, use: 'Link hover, ↗, inline accents' },
  { fg: '--rvd-accent', bg: '--rvd-bg', min: 3, use: 'Display accents, status dot' },
  { fg: '--rvd-on-accent', bg: '--rvd-accent', min: 4.5, use: 'Primary button label' },
  { fg: '--rvd-ink', bg: '--rvd-hover', min: 4.5, use: 'Card title on hover', tones: NOT_BAND },
  { fg: '--rvd-muted', bg: '--rvd-hover', min: 4.5, use: 'Card blurb on hover', tones: NOT_BAND },
  { fg: '--rvd-accent-text', bg: '--rvd-hover', min: 4.5, use: 'Card ↗ on hover', tones: ['base', 'deep'] },
  { fg: '--rvd-ink', bg: '--rvd-surface', min: 4.5, use: 'Selected toggle, code text', tones: NOT_BAND },
  { fg: '--rvd-muted', bg: '--rvd-surface', min: 4.5, use: 'Code comments', tones: NOT_BAND },
  { fg: '--rvd-accent-text', bg: '--rvd-surface', min: 4.5, use: 'Code keywords', tones: NOT_BAND },
  { fg: '--rvd-accent-2-text', bg: '--rvd-surface', min: 4.5, use: 'Code strings', tones: NOT_BAND },
];

export function contrastRatio(fg: string, bg: string): number {
  const a = parse(fg);
  const b = parse(bg);
  if (!a || !b) throw new Error(`Unparseable color: ${a ? bg : fg}`);
  return wcagContrast(a, b);
}

export function pairsForTone(tone: Tone): ContrastPair[] {
  return CONTRAST_PAIRS.filter((pair) => !pair.tones || pair.tones.includes(tone));
}

export function evaluatePairs(resolve: (token: string) => string, pairs: ContrastPair[]): ContrastResult[] {
  return pairs.map((pair) => {
    const fgValue = resolve(pair.fg);
    const bgValue = resolve(pair.bg);
    const ratio = contrastRatio(fgValue, bgValue);
    return { ...pair, fgValue, bgValue, ratio, pass: ratio >= pair.min };
  });
}

/** Resolves a token to a concrete color string, as the browser computes it inside `scope`. */
export function resolveToken(scope: Element, token: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  scope.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** Every pair × theme × mode × tone scope on the page. Restores the page's theme and mode. */
export function contrastReport(doc: Document): ToneContrastResult[] {
  const root = doc.documentElement;
  const saved = { theme: root.dataset.rvdTheme, mode: root.dataset.rvdMode };
  const scopes = [...doc.querySelectorAll<HTMLElement>('[data-rvd-contrast-scope][data-rvd-tone]')];
  const results: ToneContrastResult[] = [];
  for (const theme of window.rvd.THEMES) {
    for (const mode of ['light', 'dark'] as const) {
      root.dataset.rvdTheme = theme;
      root.dataset.rvdMode = mode;
      for (const scope of scopes) {
        const tone = scope.dataset.rvdTone as Tone;
        const pairs = evaluatePairs((token) => resolveToken(scope, token), pairsForTone(tone));
        results.push(...pairs.map((result) => ({ ...result, theme, mode, tone })));
      }
    }
  }
  root.dataset.rvdTheme = saved.theme;
  root.dataset.rvdMode = saved.mode;
  return results;
}
```

- [ ] **Step 4: Write styleguide helpers**

`src/components/styleguide/sample.ts`:
```ts
import type { SocialLink } from '../types';

// Placeholder copy from Portfolio A v3. Real content arrives with the homepage.
export const work = [
  { name: 'Project name', blurb: 'One line on what it does and why it mattered.', tags: ['Rails', 'Hotwire'] },
  { name: 'Side project', blurb: 'Small, useful, and shipped. Link to the live thing or the repo.', tags: ['Web Components'] },
  { name: 'Open source library', blurb: 'What it solves for other developers.', tags: ['TypeScript'] },
  { name: 'Client work', blurb: 'A measurable outcome: faster, cheaper, happier users.', tags: ['React', 'Stripe'] },
];

export const jobs = [
  { when: '2022 — Now', role: 'Senior Software Engineer', co: 'Company One' },
  { when: '2019 — 2022', role: 'Software Engineer', co: 'Company Two' },
  { when: '2017 — 2019', role: 'Frontend Developer', co: 'Company Three' },
  { when: '2015 — 2017', role: 'Junior Developer', co: 'Company Four' },
];

export const quotes = [
  {
    text: 'Alex turned a messy spec into something customers actually love using — and made the rest of us better along the way.',
    name: 'Teammate Name',
    role: 'Staff Engineer, Company',
  },
  {
    text: 'Rare combo: sweats the pixel details and the database indexes. Every PR taught me something.',
    name: 'Colleague Name',
    role: 'Product Designer, Company',
  },
];

export const social: SocialLink[] = [
  { label: 'GitHub', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'X', href: '#' },
  { label: 'Email', href: '#contact' },
];

export const email = 'hello@example.com';
```

`src/components/styleguide/Swatch.astro`:
```astro
---
interface Props {
  token: string;
  on?: string;
  note?: string;
}

const { token, on, note } = Astro.props;
---
<div class="rvd-swatch" data-rvd-swatch={token} data-rvd-swatch-on={on}>
  <span class="rvd-swatch__chip" style={`background: var(${token})`}></span>
  <span class="rvd-swatch__meta">
    <code class="type-label">{token}</code>
    <span class="type-label-sm rvd-swatch__muted" data-value>…</span>
    {on && <span class="type-label-sm" data-ratio></span>}
    {note && <span class="type-caption rvd-swatch__muted">{note}</span>}
  </span>
</div>

<style>
  .rvd-swatch {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .rvd-swatch__chip {
    flex: 0 0 48px;
    height: 48px;
    border: 1px solid var(--rvd-line);
    border-radius: var(--rvd-radius-md);
  }

  .rvd-swatch__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .rvd-swatch__muted {
    color: var(--rvd-muted);
  }
</style>
```

`src/components/styleguide/Example.astro`:
```astro
---
import { Code } from 'astro:components';

interface Props {
  title: string;
  props?: string;
  code: string;
}

const { title, props, code } = Astro.props;
---
<article class="rvd-example">
  <header class="rvd-example__header">
    <h3 class="type-label">{title}</h3>
    {props && <p class="type-caption rvd-example__props">{props}</p>}
  </header>
  <div class="rvd-example__demo"><slot /></div>
  <wa-details summary="Usage" class="rvd-example__code">
    <Code code={code} lang="astro" theme="css-variables" />
  </wa-details>
</article>

<style>
  .rvd-example {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-block: 28px;
    border-top: 1px solid var(--rvd-line);
  }

  .rvd-example__header h3,
  .rvd-example__props {
    margin: 0;
  }

  .rvd-example__props {
    color: var(--rvd-muted);
  }
</style>
```

`src/components/styleguide/Toolbar.astro`:
```astro
---
const links = [
  ['color', 'Color'],
  ['type', 'Type'],
  ['scale', 'Scale'],
  ['tones', 'Tones'],
  ['components', 'Components'],
  ['web-awesome', 'Web Awesome'],
  ['prose', 'Prose'],
];
const themes = ['teal-amber', 'teal', 'cobalt-teal', 'violet-cobalt'];
---
<nav class="rvd-sg-toolbar" aria-label="Styleguide">
  <ul class="rvd-sg-toolbar__links type-label-sm">
    {links.map(([id, label]) => <li><a href={`#${id}`}>{label}</a></li>)}
  </ul>
  <label class="rvd-sg-toolbar__theme type-label-sm">
    Theme
    <select data-rvd-theme-select>
      {themes.map((theme) => <option value={theme}>{theme}</option>)}
    </select>
  </label>
</nav>

<style>
  .rvd-sg-toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px 20px;
    padding: 10px var(--rvd-gutter);
    border-block: 1px solid var(--rvd-line);
    background: var(--rvd-bg);
  }

  .rvd-sg-toolbar__links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rvd-sg-toolbar__theme {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--rvd-muted);
  }

  .rvd-sg-toolbar__theme select {
    padding: 4px 8px;
    border: 1px solid var(--rvd-line);
    border-radius: var(--rvd-radius-sm);
    background: var(--rvd-surface);
    color: var(--rvd-ink);
    font: inherit;
  }
</style>
```

Note: the Toolbar's `themes` list duplicates `THEMES` in `theme-init.js`. Keep them in sync. The `theme files match the runtime THEMES list` test covers the CSS side, and the styleguide script re-syncs the `<select>` value on every `rvd:change`.

`src/scripts/styleguide.ts`:
```ts
import type { Tone } from '../components/types';
import { contrastRatio, contrastReport, evaluatePairs, pairsForTone, resolveToken } from '../lib/contrast';

function renderSwatches() {
  for (const swatch of document.querySelectorAll<HTMLElement>('[data-rvd-swatch]')) {
    const token = swatch.dataset.rvdSwatch!;
    const value = resolveToken(swatch, token);
    swatch.querySelector('[data-value]')!.textContent = value;
    const on = swatch.dataset.rvdSwatchOn;
    const ratio = swatch.querySelector('[data-ratio]');
    if (on && ratio) ratio.textContent = `${contrastRatio(value, resolveToken(swatch, on)).toFixed(2)}:1 on ${on}`;
  }
}

function renderToneReadouts() {
  for (const scope of document.querySelectorAll<HTMLElement>('[data-rvd-contrast-scope][data-rvd-tone]')) {
    const list = scope.querySelector('[data-rvd-contrast-readout]');
    if (!list) continue;
    const results = evaluatePairs((token) => resolveToken(scope, token), pairsForTone(scope.dataset.rvdTone as Tone));
    list.replaceChildren(
      ...results.map((result) => {
        const item = document.createElement('li');
        item.dataset.pass = String(result.pass);
        item.textContent = `${result.pass ? '✓' : '✗'} ${result.fg} on ${result.bg} — ${result.ratio.toFixed(2)} (min ${result.min}) · ${result.use}`;
        return item;
      }),
    );
  }
}

function renderAll() {
  renderSwatches();
  renderToneReadouts();
}

for (const select of document.querySelectorAll<HTMLSelectElement>('[data-rvd-theme-select]')) {
  select.value = window.rvd.getTheme();
  select.addEventListener('change', () => window.rvd.setTheme(select.value));
}

document.addEventListener('rvd:change', (event) => {
  for (const select of document.querySelectorAll<HTMLSelectElement>('[data-rvd-theme-select]')) {
    select.value = event.detail.theme;
  }
  renderAll();
});

renderAll();
window.rvdContrastReport = () => contrastReport(document);
```

- [ ] **Step 5: Write `src/pages/styleguide.astro`**

```astro
---
import { getEntry, render } from 'astro:content';
import Avatar from '../components/Avatar.astro';
import Button from '../components/Button.astro';
import CopyEmail from '../components/CopyEmail.astro';
import Heading from '../components/Heading.astro';
import LabelList from '../components/LabelList.astro';
import LabelRow from '../components/LabelRow.astro';
import Section from '../components/layout/Section.astro';
import Stack from '../components/layout/Stack.astro';
import LinkCard from '../components/LinkCard.astro';
import LinkList from '../components/LinkList.astro';
import PostList from '../components/PostList.astro';
import PostMeta from '../components/PostMeta.astro';
import ProjectHeader from '../components/ProjectHeader.astro';
import Prose from '../components/Prose.astro';
import Quote from '../components/Quote.astro';
import SocialLinks from '../components/SocialLinks.astro';
import StatusDot from '../components/StatusDot.astro';
import Example from '../components/styleguide/Example.astro';
import { email, jobs, quotes, social, work } from '../components/styleguide/sample';
import Swatch from '../components/styleguide/Swatch.astro';
import Toolbar from '../components/styleguide/Toolbar.astro';
import TagList from '../components/TagList.astro';
import ThemeToggle from '../components/ThemeToggle.astro';
import { TONES } from '../components/types';
import Base from '../layouts/Base.astro';

const samplePost = await getEntry('posts', 'sample-post');
const { Content: SamplePost } = samplePost ? await render(samplePost) : { Content: null };

const colorTokens = [
  { token: '--rvd-bg', note: 'Current surface background' },
  { token: '--rvd-surface', on: '--rvd-ink', note: 'Raised / selected' },
  { token: '--rvd-ink', on: '--rvd-bg', note: 'Primary text' },
  { token: '--rvd-muted', on: '--rvd-bg', note: 'Secondary text' },
  { token: '--rvd-line', note: 'Hairlines (12% ink)' },
  { token: '--rvd-accent', on: '--rvd-bg', note: 'Fills, underlines, display accents' },
  { token: '--rvd-accent-text', on: '--rvd-bg', note: 'Accent-colored body text' },
  { token: '--rvd-accent-2', note: 'Secondary accent' },
  { token: '--rvd-accent-2-text', on: '--rvd-surface', note: 'Secondary accent text (code)' },
  { token: '--rvd-on-accent', on: '--rvd-accent', note: 'Text on accent fill' },
  { token: '--rvd-tint-1', on: '--rvd-ink', note: '"Now" band' },
  { token: '--rvd-tint-2', on: '--rvd-ink', note: '"Kind words" band' },
  { token: '--rvd-band', on: '--rvd-on-band', note: 'Solid band' },
  { token: '--rvd-deep', on: '--rvd-on-deep', note: 'Contact / footer' },
  { token: '--rvd-hover', on: '--rvd-ink', note: 'Row / card hover' },
];

const typeRoles = [
  ['type-display-hero', "Hi, I'm Alex", 'Big Shoulders 800 · clamp(52, 9vw, 76) / 0.9 · uppercase'],
  ['type-display-xl', 'Say hello', 'Big Shoulders 800 · clamp(40, 7vw, 56) / 0.95 · uppercase'],
  ['type-display-section', "Things I've made", 'Big Shoulders 800 · 28 / 1 · uppercase · .02em'],
  ['type-wordmark', 'Buddy/Reno', 'Big Shoulders 800 · 22 / 1 · uppercase · .02em'],
  ['type-body-lg', 'Ruby on Rails, Hotwire, Stimulus, TypeScript, Web Components.', 'Manrope 500 · 19 / 1.65'],
  ['type-body', "I'm a full-stack developer near Nashville, Tennessee.", 'Manrope 400 · 18 / 1.65'],
  ['type-body-md', 'Senior Software Engineer · Company One', 'Manrope 400 · 17 / 1.5'],
  ['type-body-sm', 'One line on what it does and why it mattered.', 'Manrope 400 · 16 / 1.5'],
  ['type-ui', 'GitHub  LinkedIn  Email', 'Manrope 600 · 15 / 1.4'],
  ['type-caption', '© 2026 Buddy Reno', 'Manrope 400 · 14 / 1.4'],
  ['type-label', '2022 — Now', 'Space Mono 400 · 12 · uppercase'],
  ['type-label-sm', 'Rails · Hotwire', 'Space Mono 400 · 11 · uppercase'],
];

const spaces = [
  ['--rvd-section-sm', '56'],
  ['--rvd-section-md', '64'],
  ['--rvd-section-lg', '72'],
  ['--rvd-gutter', 'clamp(20, 5vw, 32)'],
];
const radii = ['--rvd-radius-sm', '--rvd-radius-md', '--rvd-radius-lg', '--rvd-radius-full'];
---
<Base title="Rivendell styleguide" description="The Rivendell design system for buddyreno.dev." noindex>
  <Toolbar />

  <Section space="md" id="intro">
    <Stack gap={14}>
      <Heading level={1} size="hero" accent=".">Rivendell</Heading>
      <p class="type-body-lg">The design system for buddyreno.dev. Switch mode in the header and theme in the toolbar; everything below re-renders live.</p>
    </Stack>
  </Section>

  <Section id="color" label="Color">
    <Stack gap={20}>
      <Heading>Color</Heading>
      <div class="rvd-sg-grid">
        {colorTokens.map((item) => <Swatch {...item} />)}
      </div>
    </Stack>
  </Section>

  <Section id="type" label="Type">
    <Stack gap={20}>
      <Heading>Type</Heading>
      {typeRoles.map(([role, sample, spec]) => (
        <div class="rvd-sg-type">
          <p class={role}>{sample}</p>
          <p class="type-label-sm rvd-sg-muted">{role} · {spec}</p>
        </div>
      ))}
    </Stack>
  </Section>

  <Section id="scale" label="Space, radius, motion">
    <Stack gap={20}>
      <Heading>Space, radius, motion</Heading>
      {spaces.map(([token, value]) => (
        <div class="rvd-sg-space">
          <span class="rvd-sg-space__bar" style={`width: var(${token})`}></span>
          <code class="type-label-sm">{token} · {value}</code>
        </div>
      ))}
      <div class="rvd-sg-radii">
        {radii.map((token) => (
          <div class="rvd-sg-radius" style={`border-radius: var(${token})`}><code class="type-label-sm">{token}</code></div>
        ))}
      </div>
      <p class="type-caption rvd-sg-muted">Motion: --rvd-dur-fast 0.15s (hover), --rvd-dur-theme 0.3s (mode change). Disabled under prefers-reduced-motion.</p>
    </Stack>
  </Section>

  <div id="tones">
    {TONES.map((tone) => (
      <Section tone={tone} label={`Tone: ${tone}`} data-rvd-contrast-scope>
        <Stack gap={16}>
          <p class="type-label">tone="{tone}"</p>
          <Heading accent=".">Section heading</Heading>
          <p>Body copy with <a href="#tones">a link</a> in it.</p>
          <p class="rvd-sg-muted-text">Muted secondary copy.</p>
          <LabelList>
            <LabelRow label="Building"><a href="#tones">Side project name</a> — a small, useful thing.</LabelRow>
          </LabelList>
          <div class="rvd-sg-row">
            <Button>Primary<span slot="sub">Sub</span></Button>
            <Button appearance="quiet">Quiet</Button>
            <StatusDot>Open to new projects</StatusDot>
          </div>
          <ul class="rvd-sg-readout type-label-sm" data-rvd-contrast-readout></ul>
        </Stack>
      </Section>
    ))}
  </div>

  <Section id="components" label="Components">
    <Stack gap={0}>
      <Heading>Components</Heading>

      <Example title="Heading" props="level 1–4 · size hero | xl | section · accent?" code={`<Heading level={1} size="hero" accent=".">Hi, I'm Alex</Heading>`}>
        <Stack gap={14}>
          <Heading level={1} size="hero" accent=".">Hi, I'm Alex</Heading>
          <Heading level={2} size="xl" accent=".">Say hello</Heading>
          <Heading>Things I've made</Heading>
        </Stack>
      </Example>

      <Example title="Avatar" props="src? · label" code={`<Avatar src={me.src} label="Buddy Reno" />`}>
        <div class="rvd-sg-row"><Avatar label="Placeholder photo" /></div>
      </Example>

      <Example title="StatusDot" props="pulse?" code={`<StatusDot pulse>Open to new projects</StatusDot>`}>
        <Stack gap={8}>
          <StatusDot>Open to new projects</StatusDot>
          <StatusDot pulse>Pulsing (respects reduced motion)</StatusDot>
        </Stack>
      </Example>

      <Example title="SocialLinks" props="links: { label, href }[] · label?" code={`<SocialLinks links={[{ label: 'GitHub', href: '…' }]} />`}>
        <SocialLinks links={social} />
      </Example>

      <Example title="LabelList + LabelRow" props="LabelList closed? · LabelRow label" code={`<LabelList>\n  <LabelRow label="2022 — Now"><strong>Senior Software Engineer</strong> · Company One</LabelRow>\n</LabelList>`}>
        <LabelList closed={false}>
          {jobs.map((job) => (
            <LabelRow label={job.when}><strong>{job.role}</strong> <span class="rvd-sg-muted-text">· {job.co}</span></LabelRow>
          ))}
        </LabelList>
      </Example>

      <Example title="LinkList + LinkCard" props="href · title · tags? · external? · slot = blurb" code={`<LinkList>\n  <LinkCard href="…" title="Project name" tags={['Rails', 'Hotwire']} external>One line on what it does.</LinkCard>\n</LinkList>`}>
        <LinkList>
          {work.map((item) => (
            <LinkCard href="#components" title={item.name} tags={item.tags} external>{item.blurb}</LinkCard>
          ))}
        </LinkList>
      </Example>

      <Example title="Quote" props="name · role? · slot = text" code={`<Quote name="Teammate Name" role="Staff Engineer, Company">…</Quote>`}>
        <Stack gap={28}>
          {quotes.map((quote) => <Quote name={quote.name} role={quote.role}>{quote.text}</Quote>)}
        </Stack>
      </Example>

      <Example title="TagList" props="tags: string[]" code={`<TagList tags={['Rails', 'Hotwire']} />`}>
        <TagList tags={['Rails', 'Hotwire', 'Web Components']} />
      </Example>

      <Example title="Button" props="appearance primary | quiet · href? · type? · slot sub" code={`<Button>Say hello<span slot="sub">Copy</span></Button>\n<Button appearance="quiet" href="/blog/">Read the blog</Button>`}>
        <div class="rvd-sg-row">
          <Button>Say hello<span slot="sub">Copy</span></Button>
          <Button appearance="quiet" href="#components">Quiet link</Button>
        </div>
      </Example>

      <Example title="CopyEmail" props="email" code={`<CopyEmail email="hello@example.com" />`}>
        <CopyEmail email={email} />
      </Example>

      <Example title="ThemeToggle" props="label?" code={`<ThemeToggle />`}>
        <ThemeToggle label="Color mode (styleguide copy)" />
      </Example>

      <Example title="PostMeta" props="date · updated? · minutes? · tags?" code={`<PostMeta date={post.data.date} minutes={4} tags={post.data.tags} />`}>
        <PostMeta date={new Date('2026-09-24')} minutes={4} tags={['CSS', 'Design systems']} />
      </Example>

      <Example title="PostList" props="posts: { href, title, date, description? }[] · empty?" code={`<PostList posts={posts} />`}>
        <Stack gap={20}>
          <PostList posts={[
            { href: '#components', title: 'A placeholder post title', date: new Date('2026-09-24'), description: 'One sentence summary.' },
            { href: '#components', title: 'An older post', date: new Date('2026-06-02') },
          ]} />
          <PostList posts={[]} />
        </Stack>
      </Example>

      <Example title="ProjectHeader" props="name · blurb? · tags? · url? · repo? · cover?" code={`<ProjectHeader name="Side project" blurb="…" tags={['Astro']} url="…" repo="…" />`}>
        <ProjectHeader name="Side project" blurb="Small, useful, and shipped." tags={['Web Components', 'Astro']} url="https://example.com" repo="https://github.com/BuddyLReno" />
      </Example>
    </Stack>
  </Section>

  <Section id="web-awesome" label="Web Awesome">
    <Stack gap={20}>
      <Heading>Web Awesome</Heading>
      <p class="rvd-sg-muted-text">Registered components, themed through webawesome-theme.css.</p>
      <div class="rvd-sg-row">
        <wa-button variant="brand">Brand</wa-button>
        <wa-button variant="brand" appearance="outlined">Outlined</wa-button>
        <wa-button variant="neutral" appearance="filled">Neutral</wa-button>
        <wa-button variant="brand" appearance="plain">Plain</wa-button>
        <wa-copy-button value="Copied from the styleguide"></wa-copy-button>
      </div>
      <div class="rvd-sg-row">
        <wa-tooltip for="rvd-sg-tip">Tooltip text</wa-tooltip>
        <wa-button id="rvd-sg-tip" appearance="outlined" variant="neutral">Hover for tooltip</wa-button>
        <wa-button appearance="outlined" variant="neutral" data-rvd-open-dialog>Open dialog</wa-button>
      </div>
      <wa-details summary="Details">Disclosure content uses surface, line, and ink tokens.</wa-details>
      <wa-dialog label="Dialog" data-rvd-sg-dialog>
        Dialog body copy.
        <wa-button slot="footer" variant="brand" data-dialog="close">Close</wa-button>
      </wa-dialog>
    </Stack>
  </Section>

  <Section id="prose" label="Prose">
    <Stack gap={20}>
      <Heading>Prose</Heading>
      <Prose>{SamplePost ? <SamplePost /> : <p>Sample post missing.</p>}</Prose>
    </Stack>
  </Section>
</Base>

<script>
  import '../scripts/styleguide.ts';

  document.querySelector('[data-rvd-open-dialog]')?.addEventListener('click', () => {
    const dialog = document.querySelector<HTMLElement & { open: boolean }>('[data-rvd-sg-dialog]');
    if (dialog) dialog.open = true;
  });
</script>

<style>
  .rvd-sg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 18px;
  }

  .rvd-sg-type p {
    margin: 0;
  }

  .rvd-sg-muted,
  .rvd-sg-muted-text {
    color: var(--rvd-muted);
  }

  .rvd-sg-muted-text {
    margin: 0;
  }

  .rvd-sg-space {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .rvd-sg-space__bar {
    height: 14px;
    border-radius: var(--rvd-radius-sm);
    background: var(--rvd-accent);
  }

  .rvd-sg-radii {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }

  .rvd-sg-radius {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 72px;
    border: 1px solid var(--rvd-line);
    background: var(--rvd-surface);
  }

  .rvd-sg-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 20px;
  }

  .rvd-sg-readout {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rvd-sg-readout :global(li[data-pass='false']) {
    font-weight: 700;
  }
</style>
```

- [ ] **Step 6: Run tests, check, build**

Run: `npm test && npx astro check && npx astro build && ls dist/styleguide`
Expected: all pass; `0 errors`; `dist/styleguide/index.html` exists. `grep -c sitemap dist/sitemap-0.xml` works and `grep -c styleguide dist/sitemap-0.xml` prints `0`.

If the styleguide render test fails because `getEntry` is unavailable in the container renderer, change that test to run against the built HTML instead: read `dist/styleguide/index.html` (run after `astro build`) and keep the same assertions. Note the change in the commit message.

- [ ] **Step 7: Look at it**

Run `npm run dev`, open `http://localhost:4321/styleguide/`, and check:
- The mode toggle in the header switches Light / Dark / System. The theme `<select>` switches all four themes. Swatch values and contrast readouts update on each change.
- Every tone band recolors its heading accent, link, muted text, both buttons and the status dot.
- The Web Awesome buttons, tooltip, dialog and details match the tokens in every tone and mode.

Fix anything broken before continuing.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(rivendell): contrast library and living /styleguide"
```

---

### Task 12: Automated contrast check, screenshots, and visual fidelity pass

**Files:**
- Create: `scripts/lib/preview.mjs`, `scripts/check-contrast.mjs`, `scripts/screenshots.mjs`
- Modify (only if the check fails): `src/styles/tokens.css`, `src/styles/tones.css`

**Interfaces:**
- Consumes: `/styleguide/` and `window.rvdContrastReport()` (Task 11); `npm run contrast`, `npm run screenshots` scripts (Task 1).
- Produces: `withPreview(fn, { port? })` helper; a contrast check that exits non-zero on any failing pair; `screenshots/*.png` (gitignored).

- [ ] **Step 1: Write `scripts/lib/preview.mjs`**

```js
import { spawn } from 'node:child_process';

async function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`astro preview did not start at ${url}`);
}

/** Runs `fn(baseUrl)` against `astro preview` of the current dist/, then stops the server. */
export async function withPreview(fn, { port = 4329 } = {}) {
  const server = spawn('npx', ['astro', 'preview', '--port', String(port)], { stdio: 'ignore' });
  const base = `http://localhost:${port}`;
  try {
    await waitForServer(`${base}/`);
    return await fn(base);
  } finally {
    server.kill();
  }
}
```

- [ ] **Step 2: Write `scripts/check-contrast.mjs`**

```js
import { chromium } from 'playwright';
import { withPreview } from './lib/preview.mjs';

const failures = await withPreview(async (base) => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/styleguide/`);
    await page.waitForFunction(() => typeof window.rvdContrastReport === 'function');
    const results = await page.evaluate(() => window.rvdContrastReport());
    console.log(`Checked ${results.length} pairs.`);
    return results.filter((result) => !result.pass);
  } finally {
    await browser.close();
  }
});

if (failures.length > 0) {
  console.error(`\n${failures.length} contrast failures:`);
  for (const f of failures) {
    console.error(
      `  ${f.theme} · ${f.mode} · ${f.tone}: ${f.fg} on ${f.bg} = ${f.ratio.toFixed(2)} (min ${f.min}) — ${f.use}`,
    );
  }
  process.exit(1);
}
console.log('All contrast pairs pass WCAG AA.');
```

- [ ] **Step 3: Run the contrast check**

Run: `npm run contrast`
Expected: `Checked 408 pairs.` (4 themes × 2 modes × pairs per tone: base 12, tint-1 11, tint-2 11, band 5, deep 12 = 51 per theme/mode), then `All contrast pairs pass WCAG AA.`

If any pair fails, fix the **input** token, never the pair minimum:
- `--rvd-accent-text` pairs → lower `--rvd-accent-text-l` in `tokens.css` (light) by 0.02 steps.
- `--rvd-on-accent` on `--rvd-accent` → lower `--rvd-accent-l` (light) by 0.01 steps.
- band pairs → lower `--rvd-band-l` (light) by 0.02 steps.
- deep pairs → adjust the `[data-rvd-tone='deep']` values in `tones.css`.

Re-run until green, and record each changed value and its reason in the commit message.

- [ ] **Step 4: Write `scripts/screenshots.mjs`**

```js
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { withPreview } from './lib/preview.mjs';

const WIDTHS = [375, 1280];
mkdirSync('screenshots', { recursive: true });

await withPreview(async (base) => {
  const browser = await chromium.launch();
  try {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.goto(`${base}/styleguide/`);
      await page.waitForFunction(() => customElements.get('wa-button') !== undefined);
      const themes = await page.evaluate(() => [...window.rvd.THEMES]);
      for (const theme of themes) {
        for (const mode of ['light', 'dark']) {
          await page.evaluate(([t, m]) => {
            window.rvd.setTheme(t);
            window.rvd.setMode(m);
          }, [theme, mode]);
          const file = `screenshots/styleguide-${theme}-${mode}-${width}.png`;
          await page.screenshot({ path: file, fullPage: true });
          console.log(file);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
```

- [ ] **Step 5: Capture and review screenshots**

Run: `npm run screenshots`
Expected: 16 files under `screenshots/`.

Open each file (the Read tool displays images) and check:
- At 375px nothing scrolls horizontally, the header toggle wraps under the wordmark cleanly, and LabelRows stack the label above the content.
- In every theme and mode, each tone band's contrast readout shows only ✓.
- Dark mode has no light-mode leftovers (Web Awesome controls, code blocks, the toggle).

- [ ] **Step 6: Fidelity pass against A v3**

Open `../new-site-theme/Portfolio A v3.dc.html` in Chrome (it loads `support.js` locally) next to `/styleguide/` in light mode with the teal-amber theme. Compare:
- the header
- the hero heading with its accent period
- the "Now" label rows
- "Things I've made" cards, including hover
- Experience rows
- the quotes
- the contact heading and button
- the footer

Allowed differences are the documented contrast deviations (spec §6). Fix any other spacing, size or weight mismatches in the relevant component and re-run `npm test`.

- [ ] **Step 7: Verify no theme flash on reload**

Run: `grep -o '<head>.*</head>' dist/styleguide/index.html | grep -c 'window.rvd'`
Expected: `1`. The runtime is inline in `<head>`, before `<body>`.

In Chrome, switch to Dark, reload `/styleguide/` with cache disabled, and confirm no light frame appears.

- [ ] **Step 8: Commit**

```bash
git add scripts src
git commit -m "test(rivendell): automated AA contrast check and screenshot tooling"
```

---

### Task 13: CI/deploy workflow and design briefs

**Files:**
- Create: `.github/workflows/site.yml`, `DESIGN.md`, `CLAUDE.md`, `README.md`

**Interfaces:**
- Consumes: npm scripts (Task 1), everything else as documentation subjects.
- Produces: CI that runs `npm test`, `astro check`, and `npm run contrast` on pushes/PRs; a manual (`workflow_dispatch`) Pages deploy; `DESIGN.md` as the design brief future sessions read first.

- [ ] **Step 1: Write `.github/workflows/site.yml`**

```yaml
name: Site

on:
  push:
  pull_request:
  # Deploys are manual until the real homepage ships. Pages currently serves the
  # gh-pages branch; switch Settings → Pages → Source to "GitHub Actions" before the first deploy.
  workflow_dispatch:
    inputs:
      deploy:
        description: Deploy to GitHub Pages
        type: boolean
        default: false

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .node-version
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npx astro check
      - run: npx playwright install --with-deps chromium
      - run: npm run contrast

  build:
    if: github.event_name == 'workflow_dispatch' && inputs.deploy
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Write `DESIGN.md`**

````markdown
# Design system: Rivendell

Rivendell is the design system for buddyreno.dev. **Read this before building any page or component.**
The full rationale is in `docs/superpowers/specs/2026-09-24-design-system-design.md`. You can see
every piece live at `/styleguide/` (`npm run dev`).

## Foundation

- Astro 7 + Tailwind CSS v4 + Web Awesome 3 (free, npm, cherry-picked in `src/scripts/webawesome.ts`).
- **Prefix:** CSS variables `--rvd-*`, attributes `data-rvd-*`, classes `.rvd-*`, storage `rvd-*`.
- **Themes** are named color palettes (`data-rvd-theme` on `<html>`, one file each in `src/styles/themes/`).
  They set only `--rvd-hue-1`, `--rvd-hue-2` and `--rvd-accent-c`. Current names are working names until LOTR
  names are picked. To add or rename a theme, change the file and `THEMES` in `src/scripts/theme-init.js`
  (plus the Toolbar list); a test fails if they disagree.
- **Mode** (`data-rvd-mode="light|dark"`) is set before first paint by the inlined `theme-init.js`.
  Use `window.rvd.setMode()` / `setTheme()` and listen for `rvd:change`.

## Where things live

| Decision | File |
| --- | --- |
| Token values (inputs + derived roles) | `src/styles/tokens.css` |
| Section tone overrides | `src/styles/tones.css` |
| Every `--wa-*` override | `src/styles/webawesome-theme.css` (nowhere else) |
| Tailwind colors, fonts, radii, `type-*` utilities | `src/styles/global.css` |
| Long-form styles | `src/styles/prose.css`, code colors in `src/styles/code.css` |

**Re-derivation rule:** a custom property whose value uses `var(--rvd-…)` must be declared on
`:root, [data-rvd-tone]` (or a tone-specific rule), or it won't recolor inside bands. A test enforces this.

## Vocabulary. Reuse these before building anything new.

| Component | Use for |
| --- | --- |
| `layout/Section` (`tone`, `space`, `width`) | Every full-bleed band. Tones: `base`, `tint-1`, `tint-2`, `band`, `deep`. |
| `layout/Container`, `layout/Stack` | Measure + gutter; vertical rhythm. |
| `Heading` (`level`, `size`, `accent`) | All headings; `accent="."` gives the colored period. |
| `LabelList` + `LabelRow` | Mono label + content rows (Now, Experience, post index). |
| `LinkList` + `LinkCard` | Hover-tinted link rows (projects, featured posts). |
| `Quote` | Testimonials. |
| `Button` (`primary`, `quiet`, `sub` slot), `CopyEmail` | Actions. |
| `StatusDot`, `SocialLinks`, `TagList`, `Avatar`, `Wordmark`, `ThemeToggle` | As named. |
| `Prose`, `PostMeta`, `PostList`, `ProjectHeader` | Long-form. |
| Layouts `Base`, `Page`, `Post`, `Project` | Pages. Content lives in `src/content/{posts,projects,pages}`. |

## Conventions

- Style with Tailwind utilities backed by tokens (`bg-surface`, `text-muted`, `type-label`) or scoped
  `<style>` using `var(--rvd-*)`. No hex, rgb, or raw `oklch()` outside `tokens.css`/`tones.css`.
- Accent-colored **text** uses `--rvd-accent-text`. `--rvd-accent` is for fills, underlines, and display-size accents.
- Content sets `draft: true` to hide from production; drafts still render in `astro dev`.
- Dates: always `formatDate()` / `isoDate()` from `src/lib/format.ts` (UTC).

## Don't

- Don't nest a `Section` inside another `Section`. Tones reset surface tokens, not ink.
- Don't put `LinkCard`s or code blocks on `tone="band"`. Those pairs aren't contrast-checked there.
- Don't import `webawesome.css` or `native.css`; only the default theme CSS is loaded.
- Don't use a `<wa-*>` component without adding its import to `src/scripts/webawesome.ts`.

## Verify

`npm test` · `npx astro check` · `npm run contrast` (AA across every theme × mode × tone) · `npm run screenshots`
````

- [ ] **Step 3: Write `CLAUDE.md` and `README.md`**

`CLAUDE.md`:
```markdown
# buddyreno.dev

Personal site built with Astro 7 and the Rivendell design system.

- Read `DESIGN.md` before any UI work; reuse its components and tokens.
- Commands: `npm run dev`, `npm test`, `npx astro check`, `npm run contrast`, `npm run screenshots`.
- Node 24 via mise. If `node` is missing: `export PATH="$HOME/.local/share/mise/installs/node/24/bin:$PATH"`.
- Deploys are manual (`workflow_dispatch` with `deploy: true`) until the homepage ships.
```

`README.md`:
```markdown
# buddyreno.dev

Source for [buddyreno.dev](https://buddyreno.dev), built with [Astro](https://astro.build),
Tailwind CSS, and [Web Awesome](https://webawesome.com) on the Rivendell design system (see `DESIGN.md`).

    npm install
    npm run dev        # http://localhost:4321, styleguide at /styleguide/
    npm test
```

- [ ] **Step 4: Run the full verification**

Run: `npm test && npx astro check && npm run contrast`
Expected: tests pass, `0 errors`, `All contrast pairs pass WCAG AA.` (GitHub validates the workflow YAML on push.)

- [ ] **Step 5: Commit**

```bash
git add .github DESIGN.md CLAUDE.md README.md
git commit -m "docs(rivendell): design brief, CI, and manual Pages deploy"
```
