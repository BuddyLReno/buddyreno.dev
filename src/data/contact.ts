import type { Choice } from '../components/ChoicePills.astro';

// Contact page copy. PLACEHOLDER: all wording is a first draft for Buddy to edit.
export const contact = {
  lede: "Got a question, an idea, or something you're building? Send a note and I'll get back to you.",
  reasonLegend: "What's this about?",
  defaultReason: 'work',
  reasons: [
    { value: 'work', label: 'Work together', hint: "What are you building, and where do you see me fitting in?" },
    { value: 'shop', label: 'Talk shop', hint: 'Rails, Hotwire, design systems, frontend, AI tooling: ask away.' },
    { value: 'hi', label: 'Just saying hi', hint: "What's on your mind?" },
  ] satisfies Choice[],
  submit: 'Send message',
  sending: 'Sending…',
  note: 'I usually reply within a few days.',
  // Shown by the client-side check before anything is sent.
  errors: {
    name: 'Who should I reply to? Add your name.',
    email: "That email doesn't look right, and I'll need one to write back.",
    message: 'Add a sentence or two so I know what this is about.',
    turnstile: 'One moment, the spam check is still loading. Try again in a second.',
    // Set by the Worker via ?error=… after a round trip.
    invalid: 'Something in the form looked off. Check the fields and try again.',
    verify: "The spam check didn't go through. Give it another try.",
    send: "Your message didn't send on my end. Please try again in a bit.",
  },
  messageMinLength: 12,
  // Turnstile public site key (safe to commit); the secret lives in the Worker. Invisible mode.
  // Local dev can't pass this key on localhost; use Cloudflare's test key 1x00000000000000000000AA there.
  turnstileSiteKey: '0x4AAAAAAFJs8A6F7asuN4jl',
  thanks: {
    title: 'Thanks',
    body: "Your message is on its way. I'll get back to you soon.",
  },
};
