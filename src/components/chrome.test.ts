import { expect, test } from 'vitest';
import { render } from '../test/render';
import SiteFooter from './layout/SiteFooter.astro';
import SiteHeader from './layout/SiteHeader.astro';
import AppearanceMenu from './AppearanceMenu.astro';
import themeInit from '../scripts/theme-init.js?raw';
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
    expect(html).toMatch(new RegExp(`<wa-radio[^>]*appearance="button"[^>]*value="${value}"[^>]*><svg[^>]*aria-hidden="true"`));
  }
  // Icon-only segments keep a text name for screen readers and a tooltip for everyone else.
  for (const name of ['Light', 'Dark', 'System']) {
    expect(html).toMatch(new RegExp(`<span class="sr-only"[^>]*>${name}</span>`));
    expect(html).toMatch(new RegExp(`<wa-tooltip[^>]*>${name}</wa-tooltip>`));
  }
});

test('AppearanceMenu pairs a trigger with a popover of mode and palette choices', async () => {
  const html = await render(AppearanceMenu);
  const id = html.match(/<button id="([^"]+)"[^>]*aria-label="Appearance"/)?.[1];
  expect(id).toBeTruthy();
  expect(html).toMatch(new RegExp(`<wa-popover[^>]*for="${id}"`));
  expect(html).toContain('data-rvd-theme-toggle');
  expect(html).toMatch(/<wa-radio-group[^>]*label="Palette"/);
});

test('AppearanceMenu offers every runtime theme with swatch hues from its theme file', async () => {
  const html = await render(AppearanceMenu);
  const themes: string[] = JSON.parse(themeInit.match(/const THEMES = (\[[^\]]*\])/)![1].replaceAll("'", '"'));
  for (const theme of themes) {
    expect(html).toMatch(new RegExp(`<wa-radio value="${theme}"[\\s\\S]*?style="--sw-h1: \\d+; --sw-h2: \\d+`));
  }
});

test('SiteHeader contains the wordmark and the appearance menu', async () => {
  const html = await render(SiteHeader);
  expect(html).toContain('rvd-wordmark');
  expect(html).toContain('data-rvd-appearance');
});

test('SiteHeader can omit the toggle', async () => {
  const html = await render(SiteHeader, { props: { toggle: false } });
  expect(html).toContain('rvd-wordmark');
  expect(html).not.toContain('data-rvd-appearance');
});

test('SiteFooter is a deep band with default and overridable slots', async () => {
  const year = new Date().getFullYear();
  const fallback = await render(SiteFooter);
  expect(fallback).toMatch(/<footer[^>]*data-rvd-tone="deep"/);
  expect(fallback).toContain(`© ${year} Buddy Reno`);
  expect(fallback).toContain('Spring Hill, TN');
  const custom = await render(SiteFooter, { slots: { end: 'Somewhere else' } });
  expect(custom).toContain('Somewhere else');
  expect(custom).not.toContain('Spring Hill, TN');
});
