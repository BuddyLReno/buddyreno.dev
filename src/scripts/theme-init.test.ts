// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import source from './theme-init.js?raw';

const root = document.documentElement;
let systemDark = false;
let systemListeners: Array<() => void> = [];

function boot(stored: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value);
  new Function(source)();
}

function setSystemDark(dark: boolean) {
  systemDark = dark;
  for (const listener of systemListeners) listener();
}

beforeEach(() => {
  localStorage.clear();
  root.removeAttribute('data-rvd-mode');
  root.removeAttribute('data-rvd-theme');
  root.className = '';
  systemDark = false;
  systemListeners = [];
  window.matchMedia = ((media: string) => ({
    media,
    get matches() {
      return systemDark;
    },
    addEventListener: (_type: string, listener: () => void) => systemListeners.push(listener),
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => vi.restoreAllMocks());

test('defaults to system mode and the teal-amber theme', () => {
  boot();
  expect(root.dataset.rvdMode).toBe('light');
  expect(root.dataset.rvdTheme).toBe('teal-amber');
  expect(root.classList.contains('wa-light')).toBe(true);
  expect(window.rvd.getMode()).toBe('system');
});

test('system mode follows the OS preference, including live changes', () => {
  systemDark = true;
  boot();
  expect(root.dataset.rvdMode).toBe('dark');
  expect(root.classList.contains('wa-dark')).toBe(true);
  setSystemDark(false);
  expect(root.dataset.rvdMode).toBe('light');
  expect(root.classList.contains('wa-dark')).toBe(false);
});

test('a stored explicit mode wins over the OS and ignores OS changes', () => {
  systemDark = true;
  boot({ 'rvd-mode': 'light' });
  expect(root.dataset.rvdMode).toBe('light');
  setSystemDark(true);
  expect(root.dataset.rvdMode).toBe('light');
});

test('unknown stored values fall back to defaults', () => {
  boot({ 'rvd-mode': 'purple', 'rvd-theme': 'mordor' });
  expect(window.rvd.getMode()).toBe('system');
  expect(root.dataset.rvdTheme).toBe('teal-amber');
});

test('setMode and setTheme apply, persist, and announce', () => {
  boot();
  const onChange = vi.fn();
  document.addEventListener('rvd:change', onChange);
  window.rvd.setMode('dark');
  window.rvd.setTheme('cobalt-teal');
  expect(root.dataset.rvdMode).toBe('dark');
  expect(root.dataset.rvdTheme).toBe('cobalt-teal');
  expect(localStorage.getItem('rvd-mode')).toBe('dark');
  expect(localStorage.getItem('rvd-theme')).toBe('cobalt-teal');
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange.mock.calls[1][0].detail).toEqual({ mode: 'dark', theme: 'cobalt-teal', resolvedMode: 'dark' });
  document.removeEventListener('rvd:change', onChange);
});

test('invalid setMode/setTheme values are ignored', () => {
  boot();
  window.rvd.setMode('sepia' as RvdMode);
  window.rvd.setTheme('mordor');
  expect(window.rvd.getMode()).toBe('system');
  expect(window.rvd.getTheme()).toBe('teal-amber');
});

test('storage throws: boots with defaults and toggles still work for the session', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied');
  });
  boot();
  expect(root.dataset.rvdTheme).toBe('teal-amber');
  window.rvd.setMode('dark');
  expect(root.dataset.rvdMode).toBe('dark');
  window.rvd.setTheme('teal');
  expect(root.dataset.rvdTheme).toBe('teal');
});
