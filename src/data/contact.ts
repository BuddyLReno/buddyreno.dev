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
  },
  messageMinLength: 12,
  thanks: {
    title: 'Thanks',
    body: "Your message is on its way. I'll get back to you soon.",
  },
};
