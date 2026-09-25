import { expect, test } from 'vitest';
import { render } from '../../test/render';
import Container from './Container.astro';
import Section from './Section.astro';
import Stack from './Stack.astro';

test('Section defaults to base tone, md space, measure width', async () => {
  const html = await render(Section, { slots: { default: 'hi' } });
  expect(html).toMatch(/<section[^>]*data-rvd-tone="base"/);
  expect(html).toMatch(/<section[^>]*data-rvd-space="md"/);
  expect(html).toContain('data-rvd-width="measure"');
  expect(html).toContain('hi');
});

test('Section passes tone, space, id, label, and extra attributes through', async () => {
  const html = await render(Section, {
    props: { tone: 'deep', space: 'lg', id: 'contact', label: 'Contact', 'data-rvd-contrast-scope': '' },
  });
  expect(html).toMatch(/<section[^>]*id="contact"/);
  expect(html).toMatch(/<section[^>]*aria-label="Contact"/);
  expect(html).toMatch(/<section[^>]*data-rvd-tone="deep"/);
  expect(html).toMatch(/<section[^>]*data-rvd-space="lg"/);
  expect(html).toMatch(/<section[^>]*data-rvd-contrast-scope/);
});

test('Section keeps its own attributes when a caller passes colliding ones', async () => {
  const html = await render(Section, {
    props: { tone: 'deep', 'data-rvd-tone': 'band', 'class:list': ['extra'] } as never,
  });
  expect(html.match(/data-rvd-tone="([^"]+)"/)?.[1]).toBe('deep');
  expect(html.match(/<section[^>]*?class="([^"]+)"/)?.[1]).toContain('rvd-section');
});

test('Container supports the wide measure', async () => {
  const html = await render(Container, { props: { width: 'wide' } });
  expect(html).toContain('data-rvd-width="wide"');
});

test('Stack renders the requested element and gap', async () => {
  const html = await render(Stack, { props: { as: 'ul', gap: 14 } });
  expect(html).toMatch(/<ul[^>]*class="rvd-stack/);
  expect(html).toContain('--rvd-stack-gap:14px');
  expect(html).toMatch(/<ul[^>]*role="list"/);
});
