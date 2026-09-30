// Contact form handler: POST /api/contact → Turnstile check → email to the owner → 303 redirect.
// Shares reasons and the message minimum with the site so the two can't drift.
import { contact } from '../../src/data/contact';

export interface EmailAddress {
  email: string;
  name?: string;
}

/** The subset of Cloudflare's structured `send_email` API this Worker uses. */
export interface OutgoingEmail {
  to: string;
  from: EmailAddress;
  replyTo: EmailAddress;
  subject: string;
  text: string;
}

export interface Env {
  EMAIL: { send(message: OutgoingEmail): Promise<{ messageId: string }> };
  /** Secret: the verified Email Routing destination (never committed). */
  CONTACT_TO: string;
  /** Sender on the zone, e.g. contact@buddyreno.dev. */
  CONTACT_FROM: string;
  /** Secret: Turnstile secret key. */
  TURNSTILE_SECRET: string;
}

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const LIMITS = { name: 100, email: 254, company: 100, message: 5000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const redirect = (path: string) => new Response(null, { status: 303, headers: { Location: path } });
const fail = (reason: 'invalid' | 'verify' | 'send') => redirect(`/contact/?error=${reason}`);
// Collapse whitespace (including CR/LF) so user input can't shape headers.
const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();

export async function handleContact(request: Request, env: Env, fetchImpl: Fetch = fetch): Promise<Response> {
  if (new URL(request.url).pathname !== '/api/contact') return new Response('Not found', { status: 404 });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail('invalid');
  }
  const field = (name: string) => String(form.get(name) ?? '');

  // Honeypot filled: act like it worked so bots don't learn anything.
  if (field('website')) return redirect('/contact/thanks/');

  const name = oneLine(field('name'));
  const email = field('email').trim();
  const company = oneLine(field('company'));
  const message = field('message').trim();
  const valid =
    name.length > 0 &&
    name.length <= LIMITS.name &&
    email.length <= LIMITS.email &&
    EMAIL_PATTERN.test(email) &&
    company.length <= LIMITS.company &&
    message.length >= contact.messageMinLength &&
    message.length <= LIMITS.message;
  if (!valid) return fail('invalid');

  const verification = await fetchImpl(SITEVERIFY, {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: field('cf-turnstile-response'),
      remoteip: request.headers.get('CF-Connecting-IP') ?? '',
    }),
  })
    .then((res) => res.json() as Promise<{ success?: boolean }>)
    .catch(() => ({ success: false }));
  if (!verification.success) return fail('verify');

  const reason = contact.reasons.find((r) => r.value === field('reason'));
  try {
    await env.EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: env.CONTACT_FROM, name: 'buddyreno.dev' },
      replyTo: { email, name },
      subject: `${reason?.label ?? 'Contact form'}: ${name}`,
      text: [
        `Reason: ${reason?.label ?? 'Not given'}`,
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || '—'}`,
        '',
        message,
      ].join('\n'),
    });
  } catch {
    return fail('send');
  }
  return redirect('/contact/thanks/');
}
