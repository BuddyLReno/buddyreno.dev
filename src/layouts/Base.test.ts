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

test('Base renders the site header and footer by default', async () => {
  const html = await render(Base, { props: { title: 'Chrome' } });
  expect(html).toContain('rvd-site-header');
  expect(html).toContain('rvd-site-footer');
});
