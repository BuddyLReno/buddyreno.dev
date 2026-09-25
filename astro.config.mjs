import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://buddyreno.dev',
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/styleguide') })],
  markdown: { shikiConfig: { theme: 'css-variables' } },
  vite: { plugins: [tailwindcss()] },
});
