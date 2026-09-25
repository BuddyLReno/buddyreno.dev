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
