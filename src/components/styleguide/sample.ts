import type { SocialLink } from '../types';

// Placeholder copy from Portfolio A v3. Real content arrives with the homepage.
export const work = [
  { name: 'Project name', blurb: 'One line on what it does and why it mattered.', tags: ['Rails', 'Hotwire'] },
  { name: 'Side project', blurb: 'Small, useful, and shipped. Link to the live thing or the repo.', tags: ['Web Components'] },
  { name: 'Open source library', blurb: 'What it solves for other developers.', tags: ['TypeScript'] },
  { name: 'Client work', blurb: 'A measurable outcome: faster, cheaper, happier users.', tags: ['React', 'Stripe'] },
];

export const jobs = [
  { when: '2022 — Now', role: 'Senior Software Engineer', co: 'Company One' },
  { when: '2019 — 2022', role: 'Software Engineer', co: 'Company Two' },
  { when: '2017 — 2019', role: 'Frontend Developer', co: 'Company Three' },
  { when: '2015 — 2017', role: 'Junior Developer', co: 'Company Four' },
];

export const quotes = [
  {
    text: 'Alex turned a messy spec into something customers actually love using — and made the rest of us better along the way.',
    name: 'Teammate Name',
    role: 'Staff Engineer, Company',
  },
  {
    text: 'Rare combo: sweats the pixel details and the database indexes. Every PR taught me something.',
    name: 'Colleague Name',
    role: 'Product Designer, Company',
  },
];

export const social: SocialLink[] = [
  { label: 'GitHub', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'X', href: '#' },
  { label: 'Email', href: '#contact' },
];

export const email = 'hello@example.com';
