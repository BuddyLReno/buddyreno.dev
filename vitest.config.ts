/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts', 'worker/**/*.test.ts'],
    // Vitest blanks CSS imports (even ?raw) by default; AppearanceMenu reads theme hues from these.
    css: { include: [/styles\/themes\//] },
  },
});
