import { expect, test } from 'vitest';
import { isPublished } from './content';

test('drafts are hidden in production and visible in dev', () => {
  const draft = { data: { draft: true } };
  const live = { data: { draft: false } };
  expect(isPublished(draft, true)).toBe(false);
  expect(isPublished(live, true)).toBe(true);
  expect(isPublished(draft, false)).toBe(true);
});
