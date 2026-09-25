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

test('SiteHeader can omit the toggle', async () => {
  const html = await render(SiteHeader, { props: { toggle: false } });
  expect(html).toContain('rvd-wordmark');
  expect(html).not.toContain('data-rvd-theme-toggle');
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
