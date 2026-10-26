// Gera os vídeos animados: video/bastidor-samuel-01..08.mp4 (um por slide, 1080×1350, para o carrossel)
// e video/bastidor-samuel-tira.mp4 (os 8 em sequência, deslizando como a tira).
// Uso: node animar.js        Precisa de ffmpeg no PATH.
const { chromium } = require('playwright');
const { mkdirSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');

const FPS = 30, SLIDE = 0.6; // transição da versão contínua, em s

(async () => {
  const dir = __dirname, out = join(dir, 'video'), tmp = join(out, '.quadros');
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] }); // máscara do brilho no logo lê o PNG local
  const page = await browser.newPage({ viewport: { width: 8640, height: 1350 }, deviceScaleFactor: 1 });
  const clips = [], durs = [];

  for (let n = 0; n < 8; n++) {
    await page.goto(pathToFileURL(join(dir, 'index.html')).href + '?export');
    await page.waitForFunction(() => window.__carrossel?.pronto, null, { timeout: 30000 });
    const { faltam } = await page.evaluate(() => window.__carrossel);
    if (faltam.length) { console.error('Ainda com placeholder: ' + faltam.join(', ')); process.exit(1); }
    const dur = await page.evaluate(i => { const d = window.__animar(i); document.getAnimations().forEach(a => a.pause()); return d; }, n);

    rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp);
    const frames = Math.round(dur / 1000 * FPS);
    for (let f = 0; f < frames; f++) {
      await page.evaluate(t => { document.getAnimations().forEach(a => { a.currentTime = t; }); window.__tick(t); }, f * 1000 / FPS);
      await page.screenshot({ path: join(tmp, String(f).padStart(4, '0') + '.png'), clip: { x: n * 1080, y: 0, width: 1080, height: 1350 } });
    }
    const file = join(out, `bastidor-samuel-${String(n + 1).padStart(2, '0')}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(tmp, '%04d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file]);
    clips.push(file); durs.push(dur / 1000);
    console.log(file);
  }
  rmSync(tmp, { recursive: true, force: true });
  await browser.close();

  // versão contínua: cada slide desliza para a esquerda, como na tira
  const args = ['-y', '-loglevel', 'error'];
  clips.forEach(c => args.push('-i', c));
  let chain = '', prev = '[0:v]', off = 0;
  for (let i = 1; i < clips.length; i++) {
    off += durs[i - 1] - SLIDE;
    const lab = i === clips.length - 1 ? '[v]' : `[x${i}]`;
    chain += `${prev}[${i}:v]xfade=transition=slideleft:duration=${SLIDE}:offset=${off.toFixed(3)}${lab};`;
    prev = lab;
  }
  const tira = join(out, 'bastidor-samuel-tira.mp4');
  execFileSync('ffmpeg', [...args, '-filter_complex', chain.slice(0, -1), '-map', '[v]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tira]);
  console.log(tira);
})();
