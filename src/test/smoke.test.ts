import { expect, test } from 'vitest';
import Index from '../pages/index.astro';
import { render } from './render';

test('placeholder home page links to the styleguide', async () => {
  const html = await render(Index);
  expect(html).toContain('href="/styleguide/"');
});
