import { parse, wcagContrast } from 'culori';
import type { Tone } from '../components/types';

export interface ContrastPair {
  fg: string;
  bg: string;
  min: number;
  use: string;
  /** Tones this pair applies to. Omitted = every tone. */
  tones?: Tone[];
}

export interface ContrastResult extends ContrastPair {
  fgValue: string;
  bgValue: string;
  ratio: number;
  pass: boolean;
}

export type ToneContrastResult = ContrastResult & { theme: string; mode: 'light' | 'dark'; tone: Tone };

// Hover and surface pairs skip `band`: cards and code blocks don't go on the solid band (DESIGN.md).
const NOT_BAND: Tone[] = ['base', 'tint-1', 'tint-2', 'deep'];

export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: '--rvd-ink', bg: '--rvd-bg', min: 4.5, use: 'Body text' },
  { fg: '--rvd-muted', bg: '--rvd-bg', min: 4.5, use: 'Secondary text' },
  { fg: '--rvd-accent-text', bg: '--rvd-bg', min: 4.5, use: 'Link hover, ↗, inline accents' },
  { fg: '--rvd-accent', bg: '--rvd-bg', min: 3, use: 'Display accents, status dot' },
  { fg: '--rvd-on-accent', bg: '--rvd-accent', min: 4.5, use: 'Primary button label' },
  { fg: '--rvd-ink', bg: '--rvd-hover', min: 4.5, use: 'Card title on hover', tones: NOT_BAND },
  { fg: '--rvd-muted', bg: '--rvd-hover', min: 4.5, use: 'Card blurb on hover', tones: NOT_BAND },
  { fg: '--rvd-accent-text', bg: '--rvd-hover', min: 4.5, use: 'Card ↗ on hover', tones: ['base', 'deep'] },
  { fg: '--rvd-ink', bg: '--rvd-surface', min: 4.5, use: 'Selected toggle, code text', tones: NOT_BAND },
  { fg: '--rvd-muted', bg: '--rvd-surface', min: 4.5, use: 'Code comments', tones: NOT_BAND },
  { fg: '--rvd-accent-text', bg: '--rvd-surface', min: 4.5, use: 'Code keywords', tones: NOT_BAND },
  { fg: '--rvd-accent-2-text', bg: '--rvd-surface', min: 4.5, use: 'Code strings', tones: NOT_BAND },
];

export function contrastRatio(fg: string, bg: string): number {
  const a = parse(fg);
  const b = parse(bg);
  if (!a || !b) throw new Error(`Unparseable color: ${a ? bg : fg}`);
  return wcagContrast(a, b);
}

export function pairsForTone(tone: Tone): ContrastPair[] {
  return CONTRAST_PAIRS.filter((pair) => !pair.tones || pair.tones.includes(tone));
}

export function evaluatePairs(resolve: (token: string) => string, pairs: ContrastPair[]): ContrastResult[] {
  return pairs.map((pair) => {
    const fgValue = resolve(pair.fg);
    const bgValue = resolve(pair.bg);
    const ratio = contrastRatio(fgValue, bgValue);
    return { ...pair, fgValue, bgValue, ratio, pass: ratio >= pair.min };
  });
}

/** Resolves a token to a concrete color string, as the browser computes it inside `scope`. */
export function resolveToken(scope: Element, token: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  scope.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** Every pair × theme × mode × tone scope on the page. Restores the page's theme and mode. */
export function contrastReport(doc: Document): ToneContrastResult[] {
  const root = doc.documentElement;
  const saved = { theme: root.dataset.rvdTheme, mode: root.dataset.rvdMode };
  const scopes = [...doc.querySelectorAll<HTMLElement>('[data-rvd-contrast-scope][data-rvd-tone]')];
  const results: ToneContrastResult[] = [];
  try {
    for (const theme of window.rvd.THEMES) {
      for (const mode of ['light', 'dark'] as const) {
        root.dataset.rvdTheme = theme;
        root.dataset.rvdMode = mode;
        for (const scope of scopes) {
          const tone = scope.dataset.rvdTone as Tone;
          const pairs = evaluatePairs((token) => resolveToken(scope, token), pairsForTone(tone));
          results.push(...pairs.map((result) => ({ ...result, theme, mode, tone })));
        }
      }
    }
  } finally {
    root.dataset.rvdTheme = saved.theme;
    root.dataset.rvdMode = saved.mode;
  }
  return results;
}
