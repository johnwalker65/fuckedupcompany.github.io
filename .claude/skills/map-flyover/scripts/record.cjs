#!/usr/bin/env node
// Record the 3D map tour page to an MP4, frame by frame (smooth even on slow machines).
// Usage: node record.cjs <page.html|url> <out.mp4> [--size 1920x1080] [--fps 30] [--maplibre <dir with maplibre-gl.js/.css>]
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const args = process.argv.slice(2);
if (args.length < 2) { console.error('usage: record.cjs <page> <out.mp4> [--size WxH] [--fps N] [--maplibre DIR]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const src = args[0], out = path.resolve(args[1]);
const [W, H] = opt('--size', '1920x1080').split('x').map(Number);
const FPS = Number(opt('--fps', '30'));
const LOCAL_ML = opt('--maplibre', null);

(async () => {
  const url = /^https?:/.test(src) ? src : 'file://' + path.resolve(src);
  const scale = 1.5; // render a smaller CSS viewport at 1.5x for crisp text and faster WebGL
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: Math.round(W / scale), height: Math.round(H / scale) }, deviceScaleFactor: scale });
  if (LOCAL_ML) {
    await page.route(/unpkg\.com\/maplibre-gl@[^/]+\/dist\/(maplibre-gl\.(js|css))$/, (route, req) => {
      const f = req.url().match(/(maplibre-gl\.(js|css))$/)[1];
      route.fulfill({ path: path.join(LOCAL_ML, f) });
    });
  }
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'mode=video');
  await page.waitForFunction(() => window.tourReady === true, null, { timeout: 120000 });
  const dur = await page.evaluate(() => window.tourDuration);
  const frames = Math.ceil(dur * FPS);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tour-frames-'));
  console.log(`Recording ${dur.toFixed(1)}s at ${FPS}fps = ${frames} frames, ${W}x${H}`);
  const t0 = Date.now();
  for (let f = 0; f <= frames; f++) {
    await page.evaluate(t => window.renderAt(t), Math.min(dur, f / FPS));
    await page.screenshot({ path: path.join(dir, String(f).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (f % FPS === 0) process.stdout.write(`  ${f}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  await browser.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'),
    '-vf', `scale=${W}:${H}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('Saved', out);
})().catch(e => { console.error(e); process.exit(1); });
