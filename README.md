# buddyreno.dev

Source for [buddyreno.dev](https://buddyreno.dev), Buddy Reno's personal site. Built with
[Astro](https://astro.build), Tailwind CSS, and [Web Awesome](https://webawesome.com) on the Rivendell
design system.

- **`AGENTS.md`**: how to work on it: commands, rules, gotchas, content, deploys, and hosting.
- **`DESIGN.md`**: the design system: tokens, tones, components, do/don't.

```sh
npm install
npm run dev        # http://localhost:4321, styleguide at /styleguide/
npm test
```

## Editing content

Homepage copy lives in `src/data/home.ts` and contact page copy in `src/data/contact.ts`. You don't need
to touch any markup.

## Deploying

- **Site**: Actions → Site → Run workflow with "deploy" checked. Deploys to GitHub Pages.
- **Contact form Worker**: `npm run worker:deploy` (Cloudflare). Only needed after changing `worker/` or
  the contact reasons.

The site is served through Cloudflare. `/api/contact` goes to the Worker, everything else goes to GitHub
Pages. `AGENTS.md` → Hosting has the details.
