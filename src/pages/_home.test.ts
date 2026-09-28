import { expect, test } from 'vitest';
import { now } from '../data/home';
import { render } from '../test/render';
import Home from './index.astro';

test('a Now row with several options renders the first and carries all of them for the rotator', async () => {
  const html = await render(Home);
  const reading = now.find((row) => row.label === 'Reading');
  expect(Array.isArray(reading?.text)).toBe(true);
  const options = reading!.text as string[];
  const el = html.match(/<span[^>]*data-rvd-rotate="([^"]*)"[^>]*>([^<]*)<\/span>/);
  expect(el).not.toBeNull();
  expect(JSON.parse(el![1].replaceAll('&quot;', '"'))).toEqual(options);
  expect(el![2]).toBe(options[0]);
});

test('single-option Now rows render plain text', async () => {
  const html = await render(Home);
  expect(html).toContain('Hand brewing coffee');
  expect(html).not.toMatch(/data-rvd-rotate[^>]*>Hand brewing coffee/);
});
