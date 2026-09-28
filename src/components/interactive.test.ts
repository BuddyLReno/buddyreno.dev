import { expect, test } from 'vitest';
import { render } from '../test/render';
import Avatar from './Avatar.astro';
import Button from './Button.astro';
import CopyEmail from './CopyEmail.astro';
import LinkCard from './LinkCard.astro';
import LinkList from './LinkList.astro';

test('LinkCard renders title, blurb, tags, and an arrow only when external', async () => {
  const external = await render(LinkCard, {
    props: { href: 'https://example.com', title: 'Project name', tags: ['Rails'], external: true },
    slots: { default: 'One line on what it does.' },
  });
  expect(external).toMatch(/<li[\s\S]*<a[^>]*href="https:\/\/example.com"[^>]*rel="external"/);
  expect(external).toContain('Project name');
  expect(external).toContain('One line on what it does.');
  expect(external).toContain('Rails');
  expect(external).toContain('↗');
  const internal = await render(LinkCard, { props: { href: '/projects/x/', title: 'Internal' } });
  expect(internal).not.toContain('↗');
  expect(internal).not.toContain('rel="external"');
});

test('LinkCard without href renders a non-link card with no arrow', async () => {
  const html = await render(LinkCard, {
    props: { title: 'Private project', tags: ['Rails'], external: true },
    slots: { default: 'Coming soon.' },
  });
  expect(html).toMatch(/<li[\s\S]*<div[^>]*class="rvd-link-card"/);
  expect(html).not.toContain('<a');
  expect(html).not.toContain('↗');
  expect(html).toContain('Coming soon.');
});

test('LinkList is a list', async () => {
  const html = await render(LinkList);
  expect(html).toMatch(/<ul[^>]*class="rvd-link-list"/);
});

test('Avatar uses wa-avatar with an image, placeholder otherwise', async () => {
  const withImage = await render(Avatar, { props: { src: '/me.jpg', label: 'Buddy Reno' } });
  expect(withImage).toMatch(/<wa-avatar[^>]*image="\/me.jpg"[^>]*label="Buddy Reno"/);
  const placeholder = await render(Avatar, { props: { label: 'Buddy Reno' } });
  expect(placeholder).toMatch(/role="img"[^>]*aria-label="Buddy Reno"/);
  expect(placeholder).not.toContain('<wa-avatar');
});

test('Button maps appearance to wa-button and renders the sub slot', async () => {
  const primary = await render(Button, { slots: { default: 'Say hi', sub: 'Copy' } });
  expect(primary).toMatch(/<wa-button[^>]*variant="brand"[^>]*appearance="accent"/);
  expect(primary).toMatch(/slot="end"[^>]*>[\s\S]*Copy/);
  const quiet = await render(Button, { props: { appearance: 'quiet', href: '/x/' } });
  expect(quiet).toMatch(/<wa-button[^>]*appearance="plain"/);
  expect(quiet).toContain('href="/x/"');
});

test('CopyEmail copies the address and relies on wa-copy-button announcements', async () => {
  const html = await render(CopyEmail, { props: { email: 'hello@example.com' } });
  expect(html).toMatch(/<wa-copy-button[^>]*value="hello@example.com"[^>]*tooltip="none"/);
  expect(html).toContain('data-rvd-copy-label');
  expect(html).toContain('feedback-duration="1600"');
  expect(html).toContain('success-label="Email address copied"');
  expect(html).toContain('error-label="Could not copy the email address"');
  expect(html).not.toContain('aria-live');
  expect(html).toContain('hello@example.com');
});

test('CopyEmail swaps its label for a same-size circled icon instead of changing text', async () => {
  const html = await render(CopyEmail, { props: { email: 'hello@example.com' } });
  expect(html).toMatch(/data-rvd-copy-label[^>]*data-state="idle"/);
  expect(html).toMatch(/<svg[^>]*data-rvd-copy-icon="copied"[^>]*aria-hidden="true"/);
  expect(html).toMatch(/<svg[^>]*data-rvd-copy-icon="failed"[^>]*aria-hidden="true"/);
  expect(html).not.toContain('Copied');
});
