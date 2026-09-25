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
