# Rivendell — buddyreno.dev Design System Spec

**Date:** 2026-09-24
**Status:** Draft for review
**Source design:** `../new-site-theme/Portfolio A v3.dc.html` (canonical). Earlier variants (v1, A, A v2, B) are superseded and used only as history.

## 1. Goal

Build a design system for the new buddyreno.dev, extracted from Portfolio A v3, that the site and all future pages are built with. The deliverable for this phase is the system itself plus a living `/styleguide` page that renders every token and component. The real homepage and content are built in a later session.

**Success criteria**

- Every visual pattern in A v3 exists as a token or component; no page needs inline one-off styles to reproduce the design.
- Theme and light/dark mode are switchable at runtime by changing one attribute each on `<html>`; all components (ours and Web Awesome's) respond with no JS recoloring.
- `/styleguide` shows every token, type role, section tone, component, themed Web Awesome component, and a full prose sample, with a live mode toggle and theme switcher.
- All text tokens meet WCAG AA against every surface/band they are used on, in every theme × mode.
- `astro check` and `astro build` pass.

**Out of scope (this phase)**

- The real homepage and real content (bio, jobs, links, posts). The styleguide uses A v3's placeholder copy.
- A public-facing theme switcher (the system supports one; only the styleguide exposes it).
- Real blog posts / projects / pages beyond one sample entry each.

## 1.1 Naming

- **Rivendell** is the design system: HTML structures, components, layouts, typography, spacing, radii, motion, the semantic color roles, and the light/dark mode math.
- **Themes** are swappable color palettes, each given a LOTR name chosen to match its feel (names chosen later; working slugs used until then). A theme sets only color inputs, never fonts or spacing, so every theme works with every component.
- **Mode** (light/dark) is independent of theme; every theme × mode combination is valid.

**Prefix rules** (to avoid collisions with Web Awesome, Tailwind, and third-party CSS):

| Thing | Convention | Example |
|---|---|---|
| CSS custom properties | `--rvd-*` | `--rvd-bg`, `--rvd-accent`, `--rvd-gutter` |
| HTML attributes | `data-rvd-*` | `data-rvd-theme="teal-amber"`, `data-rvd-mode="dark"` |
| Global classes | `.rvd-*` | `.rvd-prose` |
| localStorage keys | `rvd-*` | `rvd-mode`, `rvd-theme` |
| Tailwind utilities | unprefixed, backed by `--rvd-*` | `bg-surface` → `var(--rvd-surface)` |
| Astro components | unprefixed (module-scoped) | `Section.astro` |

`@theme inline` emits no variables of its own, so Tailwind utilities add no global names.

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Astro (latest), static output |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, tokens as CSS custom properties exposed through `@theme inline` |
| Components | Astro components; Web Awesome (free) web components, cherry-picked imports |
| Content | Astro content collections, Markdown/MDX (`posts`, `projects`, `pages`) |
| Code highlighting | Shiki with a custom theme built from our tokens (CSS-variable based so it follows mode) |
| Fonts | Self-hosted via Fontsource: Big Shoulders Display (700, 800), Manrope (400–700), Space Mono (400, 700) |
| Deploy | GitHub Pages via GitHub Actions; `CNAME` moves to `public/` |

## 3. Repo reset

Work happens on branch `design-system`. The existing site is removed except:

- `.git`
- `CNAME` → `public/CNAME`
- `assets/images/me_bw.jpg`, `me_bw_small.jpg` → `src/assets/images/` (avatar candidates)
- `docs/` (this spec and plans)

## 4. Token architecture

Three layers, all in CSS. Consumers never reference primitives directly.

### 4.1 Primitives (`src/styles/tokens.css`)

```css
:root {
  --rvd-hue-1: 200;          /* primary accent hue */
  --rvd-hue-2: 70;           /* secondary accent hue */
  --rvd-accent-l: 0.53;      /* accent fill lightness; 0.74 in dark (v3: 0.55, lowered for AA) */
  --rvd-accent-text-l: 0.48; /* accent-as-text lightness; 0.74 in dark */
  --rvd-accent-c: 0.1;       /* accent chroma */
}
```

**Themes** are named presets that set only color inputs (the hue pair, optionally chroma/lightness). Slugs below are working names until LOTR names are chosen; renaming a theme is a one-line change.

| `data-rvd-theme` | `--rvd-hue-1` | `--rvd-hue-2` |
|---|---|---|
| `teal-amber` (default; also applies when attribute absent) | 200 | 70 |
| `teal` | 200 | 200 |
| `cobalt-teal` | 262 | 200 |
| `violet-cobalt` | 300 | 262 |

Themes live in `src/styles/themes/<name>.css`, one file per theme. Adding a theme = adding one file with one selector.

### 4.2 Semantic tokens

Values taken from A v3. Light is the `:root` default; dark applies under `[data-rvd-mode="dark"]`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--rvd-bg` | `var(--rvd-canvas)` | same | background of the current surface; tones override it |
| `--rvd-surface` | `oklch(0.955 0.006 260)` | `oklch(0.215 0.018 268)` | raised/selected surfaces |
| `--rvd-ink` | `oklch(0.21 0.02 265)` | `oklch(0.95 0.006 260)` | primary text |
| `--rvd-muted` | `oklch(0.45 0.018 265)` | `oklch(0.74 0.016 265)` | secondary text |
| `--rvd-line` | `oklch(0.21 0.02 265 / .12)` | `oklch(0.95 0.006 260 / .12)` | hairlines, borders |
| `--rvd-accent` | `oklch(var(--rvd-accent-l) var(--rvd-accent-c) var(--rvd-hue-1))` | same formula, `--rvd-accent-l: 0.74` | links, highlights, primary button |
| `--rvd-accent-text` | `oklch(var(--rvd-accent-text-l) var(--rvd-accent-c) var(--rvd-hue-1))` | same formula, `0.74` | accent-colored *text* at body sizes: link hover, `↗`, inline highlights |
| `--rvd-accent-2` | same formula with `--rvd-hue-2` | same | secondary tint |
| `--rvd-accent-2-text` | `oklch(var(--rvd-accent-text-l) var(--rvd-accent-c) var(--rvd-hue-2))` | same | secondary accent as text (code syntax colors) |
| `--rvd-on-accent` | `oklch(0.99 0.003 260)` | `oklch(0.17 0.015 268)` | text on accent fill |
| `--rvd-deep` | `oklch(0.21 0.02 265)` | `oklch(0.13 0.014 268)` | contact/footer band |
| `--rvd-on-deep` | `oklch(0.97 0.004 260)` | `oklch(0.95 0.006 260)` | text on deep |
| `--rvd-band` | `oklch(0.5 var(--rvd-accent-c) var(--rvd-hue-1))` | `oklch(0.3 0.06 var(--rvd-hue-1))` | solid accent band (was JS-only in v3) |
| `--rvd-on-band` | `oklch(0.99 0.003 260)` | `oklch(0.95 0.006 260)` | text on band |
| `--rvd-canvas` | `oklch(0.98 0.004 260)` | `oklch(0.17 0.015 268)` | page background per mode; never overridden by tones (tints derive from it) |
| `--rvd-tint-1` | `color-mix(in oklab, var(--rvd-accent) 13%, var(--rvd-canvas))` | same | "Now" band |
| `--rvd-tint-2` | `color-mix(in oklab, var(--rvd-accent-2) 16%, var(--rvd-canvas))` | same | "Kind words" band |
| `--rvd-hover` | `color-mix(in oklab, var(--rvd-accent) 12%, var(--rvd-bg))` | same | row/card hover |

`color-scheme` is set to match each mode.

### 4.3 Typography tokens

| Role | Family | Weight | Size | Line height | Other |
|---|---|---|---|---|---|
| `display-hero` | Big Shoulders Display | 800 | `clamp(52px, 9vw, 76px)` | 0.9 | uppercase, `letter-spacing: .005em` |
| `display-xl` (contact) | Big Shoulders Display | 800 | `clamp(40px, 7vw, 56px)` | 0.95 | uppercase, `.005em` |
| `display-section` | Big Shoulders Display | 800 | 28px | 1 | uppercase, `.02em` |
| `wordmark` | Big Shoulders Display | 800 | 22px | 1 | uppercase, `.02em` |
| `body-lg` | Manrope | 400/500 | 19px | 1.65 | |
| `body` | Manrope | 400 | 18px | 1.65 | default paragraph |
| `body-md` | Manrope | 400 | 17px | 1.5 | list rows |
| `body-sm` | Manrope | 400 | 16px | 1.5 | card blurbs |
| `ui` | Manrope | 600 | 15px | 1.4 | links clusters, meta |
| `caption` | Manrope | 400 | 14px | 1.4 | footer |
| `label` | Space Mono | 400 | 12px | 1.3 | uppercase; row labels, dates |
| `label-sm` | Space Mono | 400 | 11px | 1.3 | uppercase; tags, toggle, button sub-label |

Paragraphs use `text-wrap: pretty`. Font stacks fall back to `system-ui, sans-serif` / `ui-monospace, monospace`.

### 4.4 Space, layout, radius, motion

- `--rvd-measure: 720px`; `--rvd-measure-wide: 1040px` (reserved for project galleries)
- `--rvd-gutter: clamp(20px, 5vw, 32px)`
- Section padding: `--rvd-section-sm: 56px`, `--rvd-section-md: 64px`, `--rvd-section-lg: 72px`
- Gap scale (from the design's rhythm): 4, 6, 8, 12, 14, 16, 18, 20, 22, 28px — Tailwind's default 4px spacing scale covers these; `Stack` takes an exact px `gap`
- Radius: `--rvd-radius-sm: 5px`, `--rvd-radius-md: 8px`, `--rvd-radius-lg: 10px`, `--rvd-radius-full: 9999px`
- Motion: `--rvd-dur-fast: .15s` (hover), `--rvd-dur-theme: .3s` (mode change). All transitions/animations disabled under `prefers-reduced-motion: reduce`.

### 4.5 Tailwind exposure

`src/styles/global.css` imports Tailwind and declares `@theme inline { --color-bg: var(--rvd-bg); --color-ink: var(--rvd-ink); … --font-display: …; --font-body: …; --font-mono: …; --radius-lg: var(--rvd-radius-lg); … }` so utilities (`bg-surface`, `text-muted`, `border-line`, `font-display`) resolve at runtime and follow theme/mode/section tone. Custom utilities via `@utility` for each type role (`type-display-hero`, `type-label`, …). (Measure + gutter live in the `Container` component rather than a utility.)

### 4.6 Base styles (`src/styles/base.css`)

From A v3: body background/ink/Manrope, antialiasing, theme transition; links inherit color with a 60%-accent underline (`offset 3px`, `thickness 1.5px`) that turns full accent on hover; `::selection` uses accent/on-accent; visible `:focus-visible` ring in accent.

## 5. Mode and theme runtime

- `<html data-rvd-mode="light|dark" data-rvd-theme="…">`.
- An inline, blocking script in `<head>` (in `Base` layout) reads `localStorage["rvd-mode"]` (`light|dark|system`, default `system`) and `localStorage["rvd-theme"]`, resolves `system` via `matchMedia('(prefers-color-scheme: dark)')`, and sets `data-rvd-mode`, `data-rvd-theme`, and Web Awesome's `wa-dark` class before first paint. It also listens for system changes while in `system` mode.
- A tiny module `src/scripts/theme.ts` exports `setMode(mode)` and `setTheme(name)` used by `ThemeToggle` and the styleguide theme switcher. localStorage access is wrapped in try/catch.

## 6. Section tones

`Section` sets local semantic overrides so descendants recolor automatically:

| `tone` | Background | Local overrides |
|---|---|---|
| `base` | `--rvd-bg` | none |
| `tint-1` | `--rvd-tint-1` | none |
| `tint-2` | `--rvd-tint-2` | none |
| `band` | `--rvd-band` | `--rvd-ink` and `--rvd-muted`: `var(--rvd-on-band)`; `--rvd-line: color-mix(in oklab, var(--rvd-on-band) 15%, transparent)`; `--rvd-accent` and `--rvd-accent-text`: `var(--rvd-on-band)` |
| `deep` | `--rvd-deep` | `--rvd-ink: var(--rvd-on-deep)`, `--rvd-muted: color-mix(in oklab, var(--rvd-on-deep) 75%, var(--rvd-deep))`, `--rvd-line: color-mix(on-deep 12%, deep)`; `--rvd-accent-l` and `--rvd-accent-text-l`: `0.74`, `--rvd-on-accent: oklch(0.17 0.015 268)` (deep is always a dark surface, so it uses the dark-mode accent) |

**Re-derivation rule.** A custom property that references another (`--rvd-accent: oklch(var(--rvd-accent-l) …)`) is resolved on the element that declares it and inherited as a value. So every derived token (`--rvd-accent`, `--rvd-accent-text`, `--rvd-hover`, `--rvd-tint-*`) and the whole WA mapping are declared on `:root, [data-rvd-tone]`, never on `:root` alone. `Section` renders `data-rvd-tone`.

Web Awesome components inside a band inherit these via the WA theme mapping (§8).

**Contrast deviations from v3 (light mode only), all to meet AA:** accent fill lightness 0.55 → 0.53; new `--rvd-accent-text` at 0.48 for accent-colored body text; band lightness 0.50 instead of reusing the accent; accent on deep uses the dark-mode lightness. Dark mode is unchanged from v3.

## 7. Components

### 7.1 Layout (`src/components/layout/`)

- **`Section`** — props: `tone` (`base|tint-1|tint-2|band|deep`, default `base`), `space` (`sm|md|lg`, default `md`), `id`, `label` (for `aria-label`). Full-bleed band + inner `Container`.
- **`Container`** — props: `width` (`measure|wide`). Max width + gutter.
- **`Stack`** — props: `gap` (token step). Vertical flex.
- **`SiteHeader`** — `Wordmark` left, `ThemeToggle` right, wraps on small screens.
- **`SiteFooter`** — deep tone, caption text, top hairline; slots for left/right.

### 7.2 Content (`src/components/`)

- **`Heading`** — props: `level` (1–4), `size` (`hero|xl|section`), `accent` (optional trailing character, e.g. `.` or `/`, rendered in `--rvd-accent`).
- **`Wordmark`** — first/last name with accent slash; links home.
- **`LabelList` / `LabelRow`** — row: mono label (`flex: 0 0 100px`) + content (`flex: 1 1 300px`), top hairline; list adds the closing bottom hairline. Wraps to stacked on narrow screens.
- **`LinkList` / `LinkCard`** — card: title (18/700) + accent `↗`, blurb (`body-sm`, muted), mono tags; `--rvd-hover` background on hover, `radius-lg`, 14px padding; list applies `-14px` inline margin so text aligns with the column. `external` prop controls the arrow and `rel`.
- **`Quote`** — `figure > blockquote + figcaption`; name in ink/600, role in muted.
- **`StatusDot`** — 7px accent dot + text; optional `pulse` (respects reduced motion).
- **`SocialLinks`** — data-driven list of links in the `ui` style, 6px/20px gaps.
- **`Avatar`** — wraps `wa-avatar`; circular, hairline border, `clamp(64px, 11vw, 84px)`; striped placeholder when no image.
- **`ThemeToggle`** — `wa-radio-group` with button-appearance radios (Light / Dark / System), `label-sm` mono, surface fill on the selected option; calls `setMode`.
- **`Button`** — thin wrapper over `wa-button`, variants `primary` (accent fill, on-accent text, `radius-lg`, 16/700) and `quiet`; optional mono sub-label slot.
- **`CopyEmail`** — primary `Button` showing the address with a "Copy"/"Copied" mono sub-label; uses `wa-copy-button` behaviour/clipboard with the 1.6s reset from v3.
- **`Tag` / `TagList`** — mono `label-sm` text separated by `·`. (`wa-tag` only if a removable/interactive tag is ever needed.)

### 7.3 Long-form (`src/components/`)

- **`Prose`** — wrapper applying `.rvd-prose` (hand-written in `src/styles/prose.css`, not Tailwind Typography): h2 as `display-section`, h3/h4 in Manrope 700; paragraph rhythm; ul/ol markers in accent; inline `code` on `--rvd-surface`; `pre` Shiki blocks with `radius-lg` and `--rvd-surface` background; images/figures with captions in `caption` style; blockquote in `Quote` typography with a 3px accent rule on the inline-start edge; `hr` as hairline; tables with hairline rows and mono header labels.
- **`PostList`** — blog index built on `LabelRow`: mono date label + linked title + optional one-line description.
- **`PostMeta`** — mono date · reading time · tags.
- **`ProjectHeader`** — `hero`-size heading, `TagList`, project links, optional cover image.

### 7.4 Page layouts (`src/layouts/`)

- **`Base`** — `<html>`, head (meta, fonts, theme script, WA component registration, global CSS), `SiteHeader`, `<main>`, `SiteFooter`.
- **`Page`** — `Base` + `Section` + `Prose` for simple content pages (`/now`, `/uses`, …).
- **`Post`** — `Base` + title (`hero`), `PostMeta`, `Prose` body.
- **`Project`** — `Base` + `ProjectHeader` + `Prose` body.

### 7.5 Content collections (`src/content.config.ts`)

- `posts`: `title`, `description`, `date`, `updated?`, `tags[]`, `draft`
- `projects`: `name`, `blurb`, `tags[]`, `url?`, `repo?`, `cover?`, `order`
- `pages`: `title`, `description`
- Every collection has `draft: boolean` (default `false`). Drafts render in `astro dev` and are excluded from production builds. The sample entries are drafts, so production ships only `/`, `/styleguide`, and an empty `/blog` (with an empty state).

One sample entry each, using placeholder copy, to exercise the layouts.

## 8. Web Awesome integration

- Package: `@awesome.me/webawesome` (free). Import WA's base styles once, then `src/styles/webawesome-theme.css`, then register only used components (`button`, `copy-button`, `radio-group`, `radio`, `avatar`, `tooltip`, `details`, `dialog`) from a single client script in `Base`.
- `webawesome-theme.css` maps WA variables to our semantic tokens: brand color scale → `--rvd-accent` (fill, border, on), surface/default colors → `--rvd-bg`/`--rvd-surface`, text colors → `--rvd-ink`/`--rvd-muted`, border color → `--rvd-line`, font families → our three stacks, border radii → our radius tokens, focus ring → accent. Because the mapping references semantic tokens, WA follows theme, mode, and section tone.
- Exact `--wa-*` variable names are verified against the installed version during implementation; the styleguide's WA section is the check.

## 9. `/styleguide`

Unlisted (`noindex`, excluded from sitemap/nav). Sticky toolbar with section jump links, `ThemeToggle`, and a theme `<select>` bound to `setTheme`. Sections:

1. **Color** — swatch per semantic token: name, resolved value (read via `getComputedStyle`), and live contrast ratio vs. its intended background.
2. **Type** — every role from §4.3 with sample text and its spec line.
3. **Space, radius, motion** — visual scales.
4. **Section tones** — all five tones stacked, each containing a heading with accent, paragraph, muted text, link, `Button`, `LabelRow`, and a WA component, to prove in-band recoloring.
5. **Components** — each component from §7.1–7.3 with realistic placeholder content (from A v3), its props, and a copyable usage snippet.
6. **Web Awesome** — each registered WA component, themed.
7. **Prose** — a full sample article: h2–h4, paragraphs, lists, inline code, a Shiki code block, blockquote, figure with caption, table, hr.

`src/pages/index.astro` is a minimal placeholder (wordmark + link to `/styleguide`) until the homepage session.

## 10. Accessibility

- Contrast AA for all text tokens on every surface/tone they appear on, across 4 themes × 2 modes (checked by script, §11).
- Visible focus ring on all interactive elements.
- `ThemeToggle` is a labelled radio group; `CopyEmail` announces "Copied" via `aria-live`.
- Reduced-motion respected globally.
- Semantic landmarks in `Base`; `Section` accepts an accessible label.

## 11. Verification

1. `astro check` and `astro build` succeed with no errors.
2. `scripts/check-contrast.mjs` computes every relevant text/background token pair from the token definitions for each theme × mode × tone and fails on any pair below 4.5:1 (3:1 for display sizes ≥ 24px).
3. Browser pass on `/styleguide` (Chrome): screenshots at 375px and 1280px, in light and dark, for all four themes; confirm no flash of wrong theme on reload.
4. Compare the styleguide's Components and Section tones against A v3 side by side for visual fidelity.

## 12. File layout

```
public/CNAME
src/
  assets/images/
  components/
    layout/{Section,Container,Stack,SiteHeader,SiteFooter}.astro
    {Heading,Wordmark,LabelList,LabelRow,LinkList,LinkCard,Quote,StatusDot,
     SocialLinks,Avatar,ThemeToggle,Button,CopyEmail,Tag,TagList,Prose,
     PostList,PostMeta,ProjectHeader}.astro
  content/{posts,projects,pages}/
  content.config.ts
  layouts/{Base,Page,Post,Project}.astro
  pages/{index,styleguide}.astro
  pages/{blog,projects}/[...slug].astro, blog/index.astro
  scripts/theme.ts
  styles/{global,tokens,base,webawesome-theme,prose}.css
  styles/themes/{teal-amber,teal,cobalt-teal,violet-cobalt}.css
scripts/check-contrast.mjs
.github/workflows/deploy.yml
astro.config.mjs
```
