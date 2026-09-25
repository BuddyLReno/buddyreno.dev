export type Tone = 'base' | 'tint-1' | 'tint-2' | 'band' | 'deep';
export const TONES: readonly Tone[] = ['base', 'tint-1', 'tint-2', 'band', 'deep'];
export type Space = 'sm' | 'md' | 'lg';
export type Width = 'measure' | 'wide';

export interface SocialLink {
  label: string;
  href: string;
}
