import { expect, test } from 'vitest';
import { favoriteReads, lastfm, now } from '../data/home';
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

test('section order alternates tones, with Things I\'ve made hidden', async () => {
  const html = await render(Home);
  const sections = [...html.matchAll(/<section[^>]*>/g)].map((m) => m[0]);
  const tones = sections.map((s) => [s.match(/aria-label="([^"]*)"/)?.[1], s.match(/data-rvd-tone="([^"]*)"/)?.[1]]);
  expect(tones).toEqual([
    ['Intro', 'base'],
    ['Now', 'tint-1'],
    ['Experience', 'base'],
    ['Tools', 'band'],
    ['Kind words', 'base'],
    ['Favorite Reads', 'tint-2'],
    ['Recent Listens', 'base'],
    ['Contact', 'deep'],
  ]);
});

test('Favorite Reads lists every book with its author', async () => {
  const html = await render(Home);
  const escape = (text: string) => text.replaceAll("'", '&#39;');
  for (const book of favoriteReads) {
    expect(html).toContain(escape(book.title));
    expect(html).toContain(book.author);
  }
});

test('Recent Listens ships hidden with a row template, and links to the Last.fm profile', async () => {
  const html = await render(Home);
  expect(html).toMatch(/<section[^>]*aria-label="Recent Listens"[^>]*hidden|<section[^>]*hidden[^>]*aria-label="Recent Listens"/);
  expect(html).toContain('<template data-rvd-listen-row>');
  expect(html).toContain(`data-rvd-lastfm-user="${lastfm.user}"`);
  expect(html).toContain(`href="https://www.last.fm/user/${lastfm.user}"`);
});
