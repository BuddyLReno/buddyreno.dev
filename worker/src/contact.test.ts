import { expect, test, vi } from 'vitest';
import { type Env, type OutgoingEmail, handleContact } from './contact';

const URL_ = 'https://buddyreno.dev/api/contact';

function setup({ turnstile = true, sendFails = false } = {}) {
  const sent: OutgoingEmail[] = [];
  const env: Env = {
    CONTACT_TO: 'owner@example.com',
    CONTACT_FROM: 'contact@buddyreno.dev',
    TURNSTILE_SECRET: 'secret',
    EMAIL: {
      send: vi.fn(async (message: OutgoingEmail) => {
        if (sendFails) throw new Error('E_DELIVERY_FAILED');
        sent.push(message);
        return { messageId: 'id' };
      }),
    },
  };
  const verify = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    Response.json({ success: turnstile }),
  );
  return { env, sent, verify };
}

function post(fields: Record<string, string>, init: RequestInit = {}) {
  const body = new URLSearchParams({
    reason: 'shop',
    name: 'Jane Smith',
    email: 'jane@example.com',
    company: 'Acme',
    message: 'Hello! I have a question about design systems.',
    'cf-turnstile-response': 'token',
    website: '',
    ...fields,
  });
  return new Request(URL_, { method: 'POST', body, headers: { 'CF-Connecting-IP': '203.0.113.7' }, ...init });
}

const location = (res: Response) => res.headers.get('Location');

test('a valid submission emails the owner with reply-to set to the sender, then redirects to thanks', async () => {
  const { env, sent, verify } = setup();
  const res = await handleContact(post({}), env, verify);
  expect(res.status).toBe(303);
  expect(location(res)).toBe('/contact/thanks/');
  expect(sent).toHaveLength(1);
  const [email] = sent;
  expect(email.to).toBe('owner@example.com');
  expect(email.from).toEqual({ email: 'contact@buddyreno.dev', name: 'buddyreno.dev' });
  expect(email.replyTo).toEqual({ email: 'jane@example.com', name: 'Jane Smith' });
  expect(email.subject).toBe('Talk shop: Jane Smith');
  expect(email.text).toContain('Acme');
  expect(email.text).toContain('Hello! I have a question about design systems.');
});

test('Turnstile is verified with the secret, the token, and the visitor IP', async () => {
  const { env, verify } = setup();
  await handleContact(post({}), env, verify);
  const [url, init] = verify.mock.calls[0];
  expect(String(url)).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
  const body = init?.body as URLSearchParams;
  expect(Object.fromEntries(body)).toEqual({ secret: 'secret', response: 'token', remoteip: '203.0.113.7' });
});

test('a failed Turnstile check sends nothing and redirects with error=verify', async () => {
  const { env, sent, verify } = setup({ turnstile: false });
  const res = await handleContact(post({}), env, verify);
  expect(location(res)).toBe('/contact/?error=verify');
  expect(sent).toHaveLength(0);
});

test('a filled honeypot pretends to succeed without verifying or sending', async () => {
  const { env, sent, verify } = setup();
  const res = await handleContact(post({ website: 'http://spam.example' }), env, verify);
  expect(location(res)).toBe('/contact/thanks/');
  expect(verify).not.toHaveBeenCalled();
  expect(sent).toHaveLength(0);
});

test.each([
  ['missing name', { name: '   ' }],
  ['bad email', { email: 'nope' }],
  ['short message', { message: 'hi' }],
  ['huge message', { message: 'x'.repeat(5001) }],
  ['long name', { name: 'x'.repeat(101) }],
])('invalid input (%s) redirects with error=invalid', async (_, fields) => {
  const { env, sent, verify } = setup();
  const res = await handleContact(post(fields), env, verify);
  expect(location(res)).toBe('/contact/?error=invalid');
  expect(sent).toHaveLength(0);
});

test('an unknown reason falls back to a generic subject, and line breaks cannot reach headers', async () => {
  const { env, sent, verify } = setup();
  await handleContact(post({ reason: 'evil', name: 'Jane\r\nBcc: x@example.com' }), env, verify);
  expect(sent[0].subject).toBe('Contact form: Jane Bcc: x@example.com');
  expect(sent[0].replyTo).toEqual({ email: 'jane@example.com', name: 'Jane Bcc: x@example.com' });
});

test('a send failure redirects with error=send', async () => {
  const { env, verify } = setup({ sendFails: true });
  const res = await handleContact(post({}), env, verify);
  expect(location(res)).toBe('/contact/?error=send');
});

test('only POST to /api/contact is handled', async () => {
  const { env, verify } = setup();
  expect((await handleContact(new Request(URL_), env, verify)).status).toBe(405);
  expect((await handleContact(new Request('https://buddyreno.dev/api/other', { method: 'POST' }), env, verify)).status).toBe(404);
});
