import type { SocialLink } from '../components/types';

// Homepage content. Anything marked PLACEHOLDER is made-up copy awaiting real content.

export const intro = {
  name: 'Buddy',
  bio: [
    "Senior software engineer with 20+ years shipping web products, most of it in Rails. I work across the stack, but I'm strongest on the frontend: component systems, UI/UX, and the conventions that keep a large codebase consistent as more people work in it.",
    "Currently a senior software engineer at ClickFunnels, based in Spring Hill, TN. Away from the keyboard I'm usually reading fantasy/sci-fi, playing games on Steam, or hanging out with my wonderful family.",
  ],
  // Empty hides the StatusDot line.
  availability: '',
};


export const social: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/BuddyLReno' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/buddy-reno-19532156/' },
];

// A row whose text is a list shows one entry at random on each page load.
export interface NowRow {
  label: string;
  text: string | string[];
}

export const now: NowRow[] = [
  { label: 'Building', text: 'PageMark, reading plans with milestones and progress tracking.' },
  { label: 'Reading', text: ['This Inevitable Ruin', 'Between Two Fires', 'The Last Argument of Kings', 'The Dark Forest'] },
  { label: 'Learning', text: 'Hand brewing coffee' },
  { label: 'Playing', text: 'Crimson Desert' },
];

// Hidden until there are work projects to write up.
export const showProjects = false;

export interface Project {
  name: string;
  blurb: string;
  tags: string[];
  // Omit for a private project: the card renders without a link.
  href?: string;
}

export const projects: Project[] = [
  { name: 'Smarquee', blurb: 'A smart scrolling marquee for audio players and other text tickers. Zero dependencies, 2kb gzipped.', tags: ['JavaScript', 'npm'], href: 'https://github.com/BuddyLReno/smarquee' },
  { name: 'PageMark', blurb: 'Create plans to calculate reading milestones and track your progress. (Coming soon)', tags: ['Rails', 'Hotwire'] },
  { name: 'buddyreno.dev', blurb: 'Personal site, built on the Rivendell design system: tokens, themes, and tone-aware components.', tags: ['Astro', 'Web Awesome', 'Tailwind'], href: 'https://github.com/BuddyLReno/buddyreno.dev' },
];

export const tools =
  'Ruby, JavaScript, TypeScript, Ruby on Rails, Hotwire (Turbo, Stimulus), ViewComponent, Tailwind CSS, Shoelace/Web Awesome, ESBuild, PostCSS, React, Minitest, Playwright, RSpec, Jest, Sidekiq, MySQL, Claude Code, and Codex.';

export interface Job {
  when: string;
  role: string;
  company: string;
}

export const experience: Job[] = [
  { when: '2022 — Now', role: 'Senior Software Engineer', company: 'ClickFunnels' },
  { when: '2021 — 2022', role: 'Senior Frontend Engineer', company: 'Eezy' },
  { when: '2013 — 2021', role: 'Product Engineer III', company: 'Ramsey Solutions' },
  { when: '2005 — 2013', role: 'Software Developer', company: 'The Joseph Company' },
];

export interface Testimonial {
  text: string;
  name: string;
  role?: string;
}

export const recommendationsUrl =
  'https://www.linkedin.com/in/buddy-reno-19532156/details/recommendations/';

// Excerpted from LinkedIn recommendations; the full set is at recommendationsUrl.
export const testimonials: Testimonial[] = [
  {
    text: "Buddy is the kind of team player who simply makes the whole team better. I've seen his humility and positive attitude transform very large, daunting tasks into projects that the team can confidently execute. … He's overcome genuinely puzzling, incredibly advanced front-end challenges that can at times seem like pure wizardry.",
    name: 'Andrew Singer',
    role: 'Technology Leader, managed Buddy',
  },
  {
    text: 'We were challenged with some pretty intense goals like getting a mobile app live in 3 weeks, moving the conversion rate aggressively through rapid iterative cycles … He made all of it FUN and possible while working as a true partner that communicated openly and directly while bringing options to the table.',
    name: 'Kristiana Burk',
    role: 'Head of Product',
  },
  {
    text: 'You would be hard pressed to find a nicer, more competent, or diligent coworker than Buddy. His technical skill and commitment to delivering quality are matched only by his kindness. Buddy is on the short list of engineers I check in with when my company has open roles.',
    name: 'David Biagi',
    role: 'Software Engineer',
  },
];

export interface Book {
  title: string;
  author: string;
}

// Lord of the Rings and The Hobbit lead; the rest are unranked.
export const favoriteReads: Book[] = [
  { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien' },
  { title: "Ender's Game", author: 'Orson Scott Card' },
  { title: '1984', author: 'George Orwell' },
  { title: 'Fahrenheit 451', author: 'Ray Bradbury' },
  { title: 'Dark Matter', author: 'Blake Crouch' },
  { title: 'The Martian', author: 'Andy Weir' },
  { title: 'The Screwtape Letters', author: 'C.S. Lewis' },
  { title: 'The Last Battle', author: 'C.S. Lewis' },
  { title: 'Elder Race', author: 'Adrian Tchaikovsky' },
];

// Public, read-only Last.fm API key (it ships in the page); the shared secret is never needed.
export const lastfm = {
  user: 'BuddyLReno',
  apiKey: '82770de360264ef7eaf056daefdd1cb8',
  limit: 10,
};
