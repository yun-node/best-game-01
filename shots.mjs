// Takes Emberfall's screenshots with Playwright (dev tool, not part of the
// entry). Serves game/ on a local port, opens each scene from shots.json,
// waits for it to settle, and saves a 1280x800 JPEG into screenshots/.
//
//   node shots.mjs [--port 8123]
//
// Chromium comes from the Playwright browser cache; set
// PLAYWRIGHT_CHROMIUM_PATH to override the executable.

import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/makefun/.shot-tools/node_modules/playwright-core');

const portArg = process.argv.indexOf('--port');
const port = portArg === -1 ? 8123 : Number(process.argv[portArg + 1]) || 8123;
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

const server = spawn('node', [join(here, 'serve.ts'), '--port', String(port)], { stdio: 'pipe' });
const waitForServer = () =>
  new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      fetch(`http://localhost:${port}/index.html`)
        .then((r) => (r.ok ? resolve(true) : setTimeout(tick, 200)))
        .catch(() => (Date.now() - start > 15000 ? resolve(false) : setTimeout(tick, 200)));
    };
    tick();
  });

const ok = await waitForServer();
if (!ok) {
  console.error('server did not start');
  server.kill();
  process.exit(1);
}

const exe = process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE ERROR:', m.text()); });

for (const shot of shots) {
  await page.goto(`http://localhost:${port}/index.html${shot.query}`, { waitUntil: 'load' });
  await page.waitForTimeout(shot.query.includes('play') ? 2500 : 1200);
  await page.screenshot({ path: join(here, 'screenshots', shot.name), type: 'jpeg', quality: 82 });
  const size = (await import('node:fs')).statSync(join(here, 'screenshots', shot.name)).size;
  console.log(shot.name, size, 'bytes');
}
await browser.close();
server.kill();
console.log('done');
