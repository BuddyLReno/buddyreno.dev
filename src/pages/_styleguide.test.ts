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

test('the sticky toolbar carries the mode toggle and theme select', async () => {
  const html = await render(Styleguide);
  const toolbar = html.match(/<nav[^>]*class="rvd-sg-toolbar"[\s\S]*?<\/nav>/)?.[0] ?? '';
  expect(toolbar).toContain('data-rvd-theme-toggle');
  expect(toolbar).toContain('data-rvd-theme-select');
});

test('the styleguide header has no toggle (the toolbar has it)', async () => {
  const html = await render(Styleguide);
  const header = html.match(/<header[^>]*class="rvd-site-header"[\s\S]*?<\/header>/)?.[0] ?? '';
  expect(header).toContain('rvd-wordmark');
  expect(header).not.toContain('data-rvd-theme-toggle');
});
