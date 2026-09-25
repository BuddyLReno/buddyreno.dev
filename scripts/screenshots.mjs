import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { withPreview } from './lib/preview.mjs';

const WIDTHS = [375, 1280];
mkdirSync('screenshots', { recursive: true });

await withPreview(async (base) => {
  const browser = await chromium.launch();
  try {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.goto(`${base}/styleguide/`);
      await page.waitForFunction(() => customElements.get('wa-button') !== undefined);
      const themes = await page.evaluate(() => [...window.rvd.THEMES]);
      for (const theme of themes) {
        for (const mode of ['light', 'dark']) {
          await page.evaluate(([t, m]) => {
            window.rvd.setTheme(t);
            window.rvd.setMode(m);
          }, [theme, mode]);
          // Mode changes fade body and tone colors, and even reduced-motion transitions need frames to
          // finish (listeners may re-render a frame later). Settle until no animation is left running.
          await page.evaluate(async () => {
            const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
            do {
              await frame();
              await frame();
              await Promise.all(document.getAnimations().map((animation) => animation.finished));
            } while (document.getAnimations().length > 0);
          });
          const file = `screenshots/styleguide-${theme}-${mode}-${width}.png`;
          await page.screenshot({ path: file, fullPage: true });
          console.log(file);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
