import { expect, test } from 'vitest';
import { render } from '../test/render';
import PostList from './PostList.astro';
import PostMeta from './PostMeta.astro';
import ProjectHeader from './ProjectHeader.astro';
import Prose from './Prose.astro';

test('Prose wraps content in .rvd-prose', async () => {
  const html = await render(Prose, { slots: { default: '<p>Body</p>' } });
  expect(html).toMatch(/<div[^>]*class="rvd-prose"[^>]*><p>Body<\/p>/);
});

test('PostMeta renders a machine-readable date, reading time, and tags', async () => {
  const html = await render(PostMeta, {
    props: { date: new Date('2026-09-24'), minutes: 4, tags: ['CSS'] },
  });
  expect(html).toMatch(/<time[^>]*datetime="2026-09-24"[^>]*>Sep 24, 2026<\/time>/);
  expect(html).toContain('4 min read');
  expect(html).toContain('CSS');
});

test('PostList lists posts as label rows', async () => {
  const html = await render(PostList, {
    props: {
      posts: [{ href: '/blog/a/', title: 'Post A', date: new Date('2026-09-24'), description: 'About A' }],
    },
  });
  expect(html).toContain('<dl');
  expect(html).toMatch(/<dt[^>]*>Sep 24, 2026<\/dt>/);
  expect(html).toMatch(/<a href="\/blog\/a\/"[^>]*>Post A<\/a>/);
  expect(html).toContain('About A');
});

test('PostList shows an empty state instead of an empty list', async () => {
  const html = await render(PostList, { props: { posts: [] } });
  expect(html).not.toContain('<dl');
  expect(html).toContain('Nothing here yet.');
});

test('ProjectHeader renders name, blurb, tags, and links', async () => {
  const html = await render(ProjectHeader, {
    props: { name: 'Side project', blurb: 'Small and useful.', tags: ['Astro'], url: 'https://x.dev', repo: 'https://github.com/x' },
  });
  expect(html).toMatch(/<h1[^>]*type-display-hero[^>]*>Side project/);
  expect(html).toContain('Small and useful.');
  expect(html).toContain('Astro');
  expect(html).toContain('href="https://x.dev"');
  expect(html).toContain('href="https://github.com/x"');
});
