import { chromium } from 'playwright';
import { withPreview } from './lib/preview.mjs';

const { total, failures } = await withPreview(async (base) => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/styleguide/`);
    await page.waitForFunction(() => typeof window.rvdContrastReport === 'function');
    const results = await page.evaluate(() => window.rvdContrastReport());
    console.log(`Checked ${results.length} pairs.`);
    return { total: results.length, failures: results.filter((result) => !result.pass) };
  } finally {
    await browser.close();
  }
});

if (total === 0) {
  console.error('Contrast report returned no pairs — is /styleguide/ rendering its tone scopes?');
  process.exit(1);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} contrast failures:`);
  for (const f of failures) {
    console.error(
      `  ${f.theme} · ${f.mode} · ${f.tone}: ${f.fg} on ${f.bg} = ${f.ratio.toFixed(2)} (min ${f.min}) — ${f.use}`,
    );
  }
  process.exit(1);
}
console.log('All contrast pairs pass WCAG AA.');
