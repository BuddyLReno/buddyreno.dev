import { z } from 'astro/zod';

export const httpUrl = z.url({ protocol: /^https?$/ });
