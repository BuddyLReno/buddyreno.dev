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
