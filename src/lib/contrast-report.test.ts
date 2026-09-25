// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vitest';
import { contrastReport } from './contrast';

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-rvd-theme');
  document.documentElement.removeAttribute('data-rvd-mode');
  document.body.innerHTML = '';
});

test('contrastReport restores theme/mode even when it throws mid-loop', () => {
  document.documentElement.dataset.rvdTheme = 'teal-amber';
  // Deliberately 'dark', not 'light': the loop's very first iteration is
  // (THEMES[0], 'light'), so if the saved mode were already 'light' the
  // buggy (unrestored) and fixed (restored) code would look identical by
  // coincidence. Starting from 'dark' makes the restoration observable.
  document.documentElement.dataset.rvdMode = 'dark';
  window.rvd = { THEMES: ['teal-amber', 'teal'] } as unknown as RvdRuntime;

  const section = document.createElement('section');
  section.dataset.rvdContrastScope = '';
  section.dataset.rvdTone = 'base';
  document.body.append(section);

  vi.spyOn(window, 'getComputedStyle').mockImplementation(() => {
    throw new Error('boom');
  });

  expect(() => contrastReport(document)).toThrow('boom');
  expect(document.documentElement.dataset.rvdTheme).toBe('teal-amber');
  expect(document.documentElement.dataset.rvdMode).toBe('dark');
});
