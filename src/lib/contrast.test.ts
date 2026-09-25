import { expect, test } from 'vitest';
import { CONTRAST_PAIRS, contrastRatio, evaluatePairs, pairsForTone } from './contrast';

test('contrastRatio matches WCAG reference values', () => {
  expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
  expect(contrastRatio('#777', '#777')).toBeCloseTo(1, 5);
  expect(contrastRatio('oklch(0.21 0.02 265)', 'oklch(0.98 0.004 260)')).toBeGreaterThan(16);
  expect(contrastRatio('oklab(0.5 0 0)', 'rgb(255, 255, 255)')).toBeGreaterThan(4);
});

test('contrastRatio throws on colors it cannot parse', () => {
  expect(() => contrastRatio('color-mix(in oklab, red, blue)', '#fff')).toThrow(/Unparseable color/);
});

test('evaluatePairs marks pass/fail against each minimum', () => {
  const values: Record<string, string> = { '--a': '#000', '--b': '#fff', '--c': '#999' };
  const results = evaluatePairs((token) => values[token], [
    { fg: '--a', bg: '--b', min: 4.5, use: 'strong' },
    { fg: '--c', bg: '--b', min: 4.5, use: 'weak' },
  ]);
  expect(results.map((result) => result.pass)).toEqual([true, false]);
  expect(results[0].fgValue).toBe('#000');
});

test('pairs are scoped to tones where they apply', () => {
  expect(pairsForTone('base').length).toBe(CONTRAST_PAIRS.length);
  expect(pairsForTone('band').some((pair) => pair.bg === '--rvd-hover')).toBe(false);
  expect(pairsForTone('band').some((pair) => pair.fg === '--rvd-ink' && pair.bg === '--rvd-bg')).toBe(true);
});
