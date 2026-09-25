import { expect, test } from 'vitest';
import { render } from '../test/render';
import Heading from './Heading.astro';
import LabelList from './LabelList.astro';
import LabelRow from './LabelRow.astro';
import Quote from './Quote.astro';
import SocialLinks from './SocialLinks.astro';
import StatusDot from './StatusDot.astro';
import TagList from './TagList.astro';

test('Heading maps level and size, and renders an accent character', async () => {
  const html = await render(Heading, {
    props: { level: 1, size: 'hero', accent: '.' },
    slots: { default: "Hi, I'm Alex" },
  });
  expect(html).toMatch(/<h1[^>]*class="[^"]*type-display-hero/);
  expect(html).toMatch(/Hi, I'm Alex<span[^>]*class="rvd-heading__accent"[^>]*>\.<\/span>/);
});

test('Heading defaults to an h2 section heading without accent', async () => {
  const html = await render(Heading, { slots: { default: 'Now' } });
  expect(html).toMatch(/<h2[^>]*class="[^"]*type-display-section/);
  expect(html).not.toContain('rvd-heading__accent');
});

test('LabelRow renders a dt/dd pair inside a LabelList dl', async () => {
  const row = await render(LabelRow, { props: { label: 'Reading' }, slots: { default: 'Book title' } });
  expect(row).toMatch(/<dt[^>]*>Reading<\/dt>/);
  expect(row).toMatch(/<dd[^>]*>Book title<\/dd>/);
  const list = await render(LabelList, { props: { closed: false } });
  expect(list).toMatch(/<dl[^>]*class="rvd-label-list"/);
  expect(list).toContain('data-rvd-closed="false"');
});

test('Quote renders figure, blockquote, and attribution', async () => {
  const html = await render(Quote, {
    props: { name: 'Teammate Name', role: 'Staff Engineer, Company' },
    slots: { default: 'Great to work with.' },
  });
  expect(html).toMatch(/<figure[\s\S]*<blockquote[\s\S]*Great to work with\.[\s\S]*<figcaption/);
  expect(html).toContain('Teammate Name');
  expect(html).toContain('Staff Engineer, Company');
});

test('StatusDot can pulse', async () => {
  const html = await render(StatusDot, { props: { pulse: true }, slots: { default: 'Open to new projects' } });
  expect(html).toContain('data-rvd-pulse');
  expect(html).toContain('Open to new projects');
});

test('TagList joins tags with a hidden separator and renders nothing when empty', async () => {
  const html = await render(TagList, { props: { tags: ['Rails', 'Hotwire'] } });
  expect(html).toMatch(/Rails[\s\S]*aria-hidden="true"[^>]*>[\s\S]*·[\s\S]*<\/span>[\s\S]*Hotwire/);
  const spoken = html
    .replace(/<span[^>]*aria-hidden="true"[^>]*>[^<]*<\/span>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  expect(spoken).toBe('Rails Hotwire');
  const empty = await render(TagList, { props: { tags: [] } });
  expect(empty).not.toContain('rvd-tag-list');
});

test('SocialLinks renders a labelled list of links', async () => {
  const html = await render(SocialLinks, {
    props: { links: [{ label: 'GitHub', href: 'https://github.com/BuddyLReno' }] },
  });
  expect(html).toMatch(/<ul[^>]*aria-label="Elsewhere"/);
  expect(html).toContain('<a href="https://github.com/BuddyLReno"');
});
