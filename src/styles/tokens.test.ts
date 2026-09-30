import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import postcss, { type Rule } from 'postcss';
import { expect, test } from 'vitest';
import themeInit from '../scripts/theme-init.js?raw';

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

const THEME_INPUTS = new Set(['--rvd-hue-1', '--rvd-hue-2', '--rvd-accent-c', '--rvd-band-boost', '--rvd-tint-hue-shift']);
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

/*
 * WA composites (e.g. --wa-focus-ring) resolve where they're declared. If one references a --wa-*
 * token we re-point on [data-rvd-tone], it must be redeclared there too, or it keeps the root value
 * inside bands. Entries here are deliberately left at root.
 */
const WA_ROOT_ONLY: Record<string, string> = {
  '--wa-color-mix-active': 'mode-dependent mix amount (10%/20%) for active tints; cosmetic',
  '--wa-color-shadow': 'dark-mode shadow color; cosmetic',
  '--wa-form-control-border-radius': 'radius tokens are tone-invariant',
  '--wa-panel-border-radius': 'radius tokens are tone-invariant',
  '--wa-tooltip-border-radius': 'radius tokens are tone-invariant',
};

test('Web Awesome composites that use our tone overrides are redeclared on [data-rvd-tone]', () => {
  const waDefault = postcss.parse(
    readFileSync(resolve('node_modules/@awesome.me/webawesome/dist/styles/themes/default.css'), 'utf8'),
  );
  const toneProps = new Set<string>();
  parse(join(STYLES, 'webawesome-theme.css')).walkRules((rule) => {
    if (rule.selector.includes('[data-rvd-tone')) rule.walkDecls(/^--wa-/, (decl) => void toneProps.add(decl.prop));
  });
  const missing = new Set<string>();
  waDefault.walkDecls(/^--wa-/, (decl) => {
    if (toneProps.has(decl.prop) || decl.prop in WA_ROOT_ONLY) return;
    const refs = [...decl.value.matchAll(/var\(\s*(--wa-[a-z0-9-]+)/g)].map(([, name]) => name);
    if (refs.some((name) => toneProps.has(name))) missing.add(decl.prop);
  });
  expect([...missing]).toEqual([]);
});

const insideComponentsLayer = (node: postcss.Node): boolean => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && (parent as postcss.AtRule).name === 'layer') {
      return (parent as postcss.AtRule).params.trim() === 'components';
    }
  }
  return false;
};

test('component <style> blocks live in @layer components, so utilities override them', () => {
  const offenders: string[] = [];
  for (const file of walk(SRC).filter((path) => path.endsWith('.astro'))) {
    const text = readFileSync(file, 'utf8');
    for (const [, attrs, css] of text.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)) {
      const trimmed = css.trim();
      if (!trimmed) continue;
      const root = postcss.parse(trimmed);
      // Base.astro's inline layer-order statement is the one allowed non-component block.
      const orderOnly = root.nodes.every((node) => node.type === 'atrule' && node.name === 'layer' && !node.nodes);
      if (attrs.includes('is:inline') && orderOnly) continue;
      const layered = root.nodes.every(
        (node) =>
          node.type === 'comment' ||
          (node.type === 'atrule' && node.name === 'layer' && node.params.trim() === 'components'),
      );
      if (!trimmed.startsWith('@layer components') || !layered) offenders.push(relative(SRC, file));
    }
  }
  expect(offenders).toEqual([]);
});

test('custom properties in src/styles stay unlayered by @layer components (tones must beat tokens)', () => {
  const offenders: string[] = [];
  for (const file of cssFiles()) {
    parse(file).walkDecls(/^--/, (decl) => {
      if (insideComponentsLayer(decl)) offenders.push(`${relative(SRC, file)}: ${decl.prop}`);
    });
  }
  expect(offenders).toEqual([]);
});
