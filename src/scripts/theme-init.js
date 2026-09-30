// Rivendell theme runtime. ThemeScript.astro inlines this file (blocking, in <head>)
// so data-rvd-mode and data-rvd-theme are set before first paint. Keep it dependency-free.
(() => {
  const THEMES = ['rivendell', 'mordor', 'the-shire', 'grey-havens', 'evenstar'];
  const MODES = ['light', 'dark', 'system'];
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');

  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable: the in-memory value still applies for this session.
    }
  };

  const storedMode = read('rvd-mode');
  const storedTheme = read('rvd-theme');
  let mode = MODES.includes(storedMode) ? storedMode : 'system';
  let theme = THEMES.includes(storedTheme) ? storedTheme : THEMES[0];

  const resolvedMode = () => (mode === 'system' ? (system.matches ? 'dark' : 'light') : mode);

  const apply = () => {
    const dark = resolvedMode() === 'dark';
    root.dataset.rvdMode = dark ? 'dark' : 'light';
    root.dataset.rvdModePref = mode; // the choice (may be 'system'); rvdMode is what it resolved to
    root.dataset.rvdTheme = theme;
    root.classList.toggle('wa-dark', dark);
    root.classList.toggle('wa-light', !dark);
  };

  const changed = () => {
    apply();
    document.dispatchEvent(
      new CustomEvent('rvd:change', { detail: { mode, theme, resolvedMode: resolvedMode() } }),
    );
  };

  system.addEventListener('change', () => {
    if (mode === 'system') changed();
  });
  apply();

  window.rvd = {
    THEMES,
    MODES,
    getMode: () => mode,
    getTheme: () => theme,
    getResolvedMode: resolvedMode,
    setMode(next) {
      if (!MODES.includes(next)) return;
      mode = next;
      write('rvd-mode', next);
      changed();
    },
    setTheme(next) {
      if (!THEMES.includes(next)) return;
      theme = next;
      write('rvd-theme', next);
      changed();
    },
  };
})();
