import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { httpUrl } from './lib/schema';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      blurb: z.string(),
      tags: z.array(z.string()).default([]),
      url: httpUrl.optional(),
      repo: httpUrl.optional(),
      cover: image().optional(),
      order: z.number().default(0),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, projects, pages };
