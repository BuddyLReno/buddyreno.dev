import { expect, test } from 'vitest';
import { formatDate, isoDate, readingTime } from './format';

test('formatDate formats in UTC so frontmatter dates never shift a day', () => {
  // Frontmatter `date: 2026-09-24` becomes UTC midnight.
  expect(formatDate(new Date('2026-09-24'))).toBe('Sep 24, 2026');
  expect(formatDate(new Date('2026-01-01T00:00:00Z'))).toBe('Jan 1, 2026');
});

test('isoDate returns the UTC calendar date', () => {
  expect(isoDate(new Date('2026-09-24'))).toBe('2026-09-24');
});

test('readingTime rounds up at 230 words per minute with a 1 minute floor', () => {
  expect(readingTime('')).toBe(1);
  expect(readingTime('word '.repeat(230))).toBe(1);
  expect(readingTime('word '.repeat(231))).toBe(2);
  expect(readingTime('  spaced\n\nout   words ')).toBe(1);
});
