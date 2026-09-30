# Design system: Rivendell

Rivendell is the design system for buddyreno.dev. **Read this before building any page or component.**
The full rationale is in `docs/superpowers/specs/2026-09-24-design-system-design.md`. You can see
every piece live at `/styleguide/` (`npm run dev`).

## Foundation

- Astro 7 + Tailwind CSS v4 + Web Awesome 3 (free, npm, cherry-picked in `src/scripts/webawesome.ts`).
- **Prefix:** CSS variables `--rvd-*`, attributes `data-rvd-*`, classes `.rvd-*`, storage `rvd-*`.
- **Themes** are named color palettes (`data-rvd-theme` on `<html>`, one file each in `src/styles/themes/`).
  They set only `--rvd-hue-1`, `--rvd-hue-2` and `--rvd-accent-c`, plus two optional tuning inputs:
  `--rvd-band-boost` (multiplies band chroma; default 1) and `--rvd-tint-hue-shift` (degrees; pale reds read
  pink, so Mordor nudges its tint toward yellow). Names are Lord of the Rings places and things
  (Rivendell is the default). To add or rename a theme, change the file in `src/styles/themes/` and the `THEMES` list
  in `src/scripts/theme-init.js`. Adding one takes three edits: the file, an `@import` in `global.css`, and
  the `THEMES` entry; a test catches each omission. `AppearanceMenu` (names and swatches) picks up theme
  files automatically.
- **Mode** (`data-rvd-mode="light|dark"`) is set before first paint by the inlined `theme-init.js`.
  Use `window.rvd.setMode()` / `setTheme()` and listen for `rvd:change`.

## Where things live

| Decision | File |
| --- | --- |
| Token values (inputs + derived roles) | `src/styles/tokens.css` |
| Section tone overrides | `src/styles/tones.css` |
| Every `--wa-*` override | `src/styles/webawesome-theme.css` (nowhere else; component-scoped WA tweaks, e.g. `.rvd-theme-toggle`, live here too, inside `@layer wa-theme-overrides`) |
| Tailwind colors, fonts, radii, `type-*` utilities | `src/styles/global.css` |
| Long-form styles | `src/styles/prose.css` |
| Code-block colors | `src/styles/code.css` (maps Shiki's `--astro-code-*` variables (Astro API names; allowed only here)) |

**Re-derivation rule:** a custom property whose value uses `var(--rvd-…)` must be declared on
`:root, [data-rvd-tone]` (or a tone-specific rule), or it won't recolor inside bands. A test enforces this.

## Vocabulary. Reuse these before building anything new.

| Component | Use for |
| --- | --- |
| `layout/Section` (`tone`, `space`, `width`) | Every full-bleed band. Tones: `base`, `tint-1`, `tint-2`, `band`, `deep`. |
| `layout/Container`, `layout/Stack` | Measure + gutter; vertical rhythm. |
| `Heading` (`level`, `size`, `accent`) | All headings; `accent="."` gives the colored period. |
| `LabelList` + `LabelRow` | Mono label + content rows (Now, Experience, post index). Unlabeled rows: `LabelList as="ul"` + `LabelRow` with no `label` (Favorite Reads). |
| `LinkList` + `LinkCard` | Hover-tinted link rows (projects, featured posts). `LinkCard` renders an `<li>`: always inside `LinkList`. |
| `Quote` | Testimonials. |
| `Button` (`appearance="primary\|quiet"`, `sub` slot), `CopyEmail` | Actions. |
| `TextField` (`rows` for a textarea, `optional`), `ChoicePills` | Forms (Contact). Native inputs; borders use `--rvd-control-line` (3:1). |
| `AppearanceMenu` | Header (and styleguide toolbar) control: a trigger showing the chosen mode icon + palette swatches, opening a `wa-popover` with `ThemeToggle` and a palette radio group. |
| `StatusDot`, `SocialLinks`, `TagList`, `Wordmark`, `ThemeToggle` (icon segments, `ModeIcon`) | As named. |
| `Avatar` (`src`, `label`) | Takes a string: `import me from '../assets/images/me_bw.jpg'`, then `src={me.src}`. Not optimized (`wa-avatar` bypasses `astro:assets`). |
| `Prose`, `PostMeta`, `PostList`, `ProjectHeader` | Long-form. |
| Layouts `Base`, `Page`, `Post`, `Project` | Pages. Content lives in `src/content/{posts,projects,pages}`. `Base` has `header` and `footer` named slots (defaults `SiteHeader`/`SiteFooter`). |

## Conventions

- Style with Tailwind utilities backed by tokens (`bg-surface`, `text-muted`, `type-label`) or scoped
  `<style>` using `var(--rvd-*)`. No hex, rgb, or raw `oklch()` outside `tokens.css`/`tones.css`.
- Component and system styles live in `@layer components`, so Tailwind utilities passed via `class` override
  them (e.g. `<Heading class="mb-6">`). Custom-property declarations stay unlayered. `Base.astro` fixes the
  layer order up front; tests enforce all three.
- Accent-colored **text** uses `--rvd-accent-text`. `--rvd-accent` is for fills, underlines, and display-size accents.
- Content sets `draft: true` to hide from production; drafts still render in `astro dev`.
- Dates: always `formatDate()` / `isoDate()` from `src/lib/format.ts` (UTC).
- Tests next to pages must start with an underscore (e.g. `src/pages/_styleguide.test.ts`) — Astro treats
  other `.ts` files in `src/pages` as endpoints.
- Content URLs (`url`, `repo`) use `httpUrl` from `src/lib/schema.ts` (http/https only).

## Don't

- Don't nest a `Section` inside another `Section`. Tones reset surface tokens, not ink.
- Don't put `LinkCard`s or code blocks on `tone="band"`. Those pairs aren't contrast-checked there. Put `LinkCard`s
  on `base` or `deep` only (their hover tint isn't checked on `tint-*` either).
- Don't name a `pages` entry `blog`, `projects`, or `styleguide`; those routes shadow it.
- Don't import `webawesome.css` or `native.css`; only the default theme CSS is loaded.
- Don't use a `<wa-*>` component without adding its import to `src/scripts/webawesome.ts`.
- Don't rely on a `<wa-*>` component's own host padding/border (e.g. `wa-radio appearance="button"`): Tailwind's
  preflight zeroes them and page rules beat WA's `:host` styles. Set them in the component's `<style>` instead
  (see `ThemeToggle.astro`).

## Verify

`npm test` · `npx astro check` · `npm run contrast` (AA across every theme × mode × tone) · `npm run screenshots`

`contrast` and `screenshots` both build first, then serve `dist/` with `astro preview --ignore-lock`
(Astro 7 otherwise auto-backgrounds `preview` when it detects an AI agent).
