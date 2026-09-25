type RvdMode = 'light' | 'dark' | 'system';

interface RvdRuntime {
  readonly THEMES: readonly string[];
  readonly MODES: readonly RvdMode[];
  getMode(): RvdMode;
  getTheme(): string;
  getResolvedMode(): 'light' | 'dark';
  setMode(mode: RvdMode): void;
  setTheme(theme: string): void;
}

interface Window {
  rvd: RvdRuntime;
  rvdContrastReport?: () => unknown[];
}

interface DocumentEventMap {
  'rvd:change': CustomEvent<{ mode: RvdMode; theme: string; resolvedMode: 'light' | 'dark' }>;
}

// @fontsource/big-shoulders-display@5.3.0's package.json exports map is missing the
// "./*.css" passthrough entry that its sibling fontsource packages have, so the
// side-effect import must be extensionless (see Base.astro); shim the type here.
declare module '@fontsource/big-shoulders-display/800';
