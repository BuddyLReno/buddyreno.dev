import { spawn } from 'node:child_process';

async function waitForServer(url, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`astro preview did not start at ${url}`);
}

/** Runs `fn(baseUrl)` against `astro preview` of the current dist/, then stops the server. */
export async function withPreview(fn, { port = 4329 } = {}) {
  const server = spawn('npx', ['astro', 'preview', '--port', String(port), '--ignore-lock'], {
    stdio: 'ignore',
  });
  const base = `http://localhost:${port}`;
  try {
    await waitForServer(`${base}/`);
    return await fn(base);
  } finally {
    server.kill();
  }
}
