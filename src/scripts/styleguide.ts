import type { Tone } from '../components/types';
import { contrastRatio, contrastReport, evaluatePairs, pairsForTone, resolveToken } from '../lib/contrast';

function renderSwatches() {
  for (const swatch of document.querySelectorAll<HTMLElement>('[data-rvd-swatch]')) {
    const token = swatch.dataset.rvdSwatch!;
    const value = resolveToken(swatch, token);
    swatch.querySelector('[data-value]')!.textContent = value;
    const on = swatch.dataset.rvdSwatchOn;
    const ratio = swatch.querySelector('[data-ratio]');
    if (on && ratio) ratio.textContent = `${contrastRatio(value, resolveToken(swatch, on)).toFixed(2)}:1 on ${on}`;
  }
}

function renderToneReadouts() {
  for (const scope of document.querySelectorAll<HTMLElement>('[data-rvd-contrast-scope][data-rvd-tone]')) {
    const list = scope.querySelector('[data-rvd-contrast-readout]');
    if (!list) continue;
    const results = evaluatePairs((token) => resolveToken(scope, token), pairsForTone(scope.dataset.rvdTone as Tone));
    list.replaceChildren(
      ...results.map((result) => {
        const item = document.createElement('li');
        item.dataset.pass = String(result.pass);
        item.textContent = `${result.pass ? '✓' : '✗'} ${result.fg} on ${result.bg} — ${result.ratio.toFixed(2)} (min ${result.min}) · ${result.use}`;
        return item;
      }),
    );
  }
}

function renderAll() {
  renderSwatches();
  renderToneReadouts();
}

for (const select of document.querySelectorAll<HTMLSelectElement>('[data-rvd-theme-select]')) {
  select.value = window.rvd.getTheme();
  select.addEventListener('change', () => window.rvd.setTheme(select.value));
}

document.addEventListener('rvd:change', (event) => {
  for (const select of document.querySelectorAll<HTMLSelectElement>('[data-rvd-theme-select]')) {
    select.value = event.detail.theme;
  }
  renderAll();
});

window.rvdContrastReport = () => contrastReport(document);
renderAll();
