import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

test('Base renders favicons and Open Graph / Twitter card tags', async () => {
  const html = await render(Base, {
    props: { title: 'Share me', description: 'A shareable page' },
    request: new Request('https://buddyreno.dev/some/page/'),
  });
  expect(html).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
  expect(html).toContain('<meta property="og:type" content="website">');
  expect(html).toContain('<meta property="og:site_name" content="Buddy Reno">');
  expect(html).toContain('<meta property="og:title" content="Share me">');
  expect(html).toContain('<meta property="og:description" content="A shareable page">');
  expect(html).toContain('<meta property="og:url" content="https://buddyreno.dev/some/page/">');
  expect(html).toContain('<meta property="og:image" content="https://buddyreno.dev/og.png">');
  expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
});

test('Base can mark a page noindex', async () => {
  const html = await render(Base, { props: { title: 'Hidden', noindex: true } });
  expect(html).toContain('<meta name="robots" content="noindex">');
});

test('Base renders the site header and footer by default', async () => {
  const html = await render(Base, { props: { title: 'Chrome' } });
  expect(html).toContain('rvd-site-header');
  expect(html).toContain('rvd-site-footer');
});

test('Base fixes the cascade layer order before any stylesheet', async () => {
  // Astro bundles component CSS ahead of global.css, so first-appearance order would rank
  // `@layer components` below Tailwind's `base` (preflight would then reset component spacing).
  const html = await render(Base, { props: { title: 'Layers' } });
  const head = html.slice(0, html.indexOf('</head>'));
  const first = head.match(/<(style|link rel="stylesheet")[^>]*>([^<]*)/);
  const order = first?.[2].match(/^@layer ([^;]+);$/)?.[1].split(',').map((name) => name.trim());
  const waLayers = readFileSync(resolve('node_modules/@awesome.me/webawesome/dist/styles/layers.css'), 'utf8')
    .match(/@layer ([^;{]+);/)![1]
    .split(',')
    .map((name) => name.trim());
  expect(order).toEqual([...waLayers, 'properties', 'theme', 'base', 'components', 'utilities']);
});

test('the body fills the viewport and main grows, so the footer sits at the bottom on short pages', () => {
  const css = readFileSync(resolve('src/styles/base.css'), 'utf8');
  const body = css.match(/\n  body \{[^}]*\}/)?.[0] ?? '';
  expect(body).toMatch(/display: flex;/);
  expect(body).toMatch(/flex-direction: column;/);
  expect(body).toMatch(/min-height: 100dvh;/);
  expect(css).toMatch(/\n  main \{[^}]*flex: 1 0 auto;[^}]*\}/);
});
