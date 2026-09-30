import { expect, test } from 'vitest';
import { contact } from '../data/contact';
import { render } from '../test/render';
import Contact from './contact/index.astro';
import Home from './index.astro';
import Thanks from './contact/thanks.astro';

test('the contact form posts every field to the contact endpoint', async () => {
  const html = await render(Contact);
  expect(html).toMatch(/<form[^>]*action="\/api\/contact"[^>]*method="post"/);
  for (const name of ['reason', 'name', 'email', 'company', 'message']) {
    expect(html).toMatch(new RegExp(`name="${name}"`));
  }
  expect(html).toContain('type="submit"');
});

test('the message hint starts as the default reason hint', async () => {
  const html = await render(Contact);
  const chosen = contact.reasons.find((r) => r.value === contact.defaultReason)!;
  const textarea = html.match(/<textarea[^>]*>/)?.[0] ?? '';
  expect(textarea).toContain(`placeholder="${chosen.hint.replaceAll("'", '&#39;')}"`);
});

test('the contact page has a hidden honeypot and an error region', async () => {
  const html = await render(Contact);
  expect(html).toMatch(/<input[^>]*name="website"[^>]*tabindex="-1"/);
  expect(html).toMatch(/role="alert"[^>]*hidden|hidden[^>]*role="alert"/);
});

test('no email address appears on the homepage or contact pages', async () => {
  for (const page of [Home, Contact, Thanks]) {
    const html = await render(page);
    expect(html).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    expect(html).not.toContain('mailto:');
  }
});

test('the thanks page is not indexed', async () => {
  const html = await render(Thanks);
  expect(html).toContain('<meta name="robots" content="noindex">');
});
