// Exporta os 8 slides 1080×1350 para export/bastidor-samuel-01..08.png.
// Uso: node exportar.js              (falha se ainda houver placeholder)
//      node exportar.js --rascunho   (exporta mesmo com placeholder)
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
const dir = __dirname;
const rascunho = process.argv.includes('--rascunho');
const out = join(dir, 'export');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 8640, height: 1350 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(dir, 'index.html')).href + '?export');
await page.waitForFunction(() => window.__carrossel?.pronto, null, { timeout: 30000 });

const { faltam } = await page.evaluate(() => window.__carrossel);
if (faltam.length && !rascunho) {
  console.error('Ainda com placeholder: ' + faltam.join(', ') + '.\nSolte os arquivos em assets/ ou rode com --rascunho.');
  await browser.close();
  process.exit(1);
}

for (let i = 0; i < 8; i++) {
  const file = join(out, `bastidor-samuel-${String(i + 1).padStart(2, '0')}.png`);
  await page.screenshot({ path: file, clip: { x: i * 1080, y: 0, width: 1080, height: 1350 } });
  console.log(file);
}
if (faltam.length) console.warn('Rascunho: ainda com placeholder: ' + faltam.join(', ') + '.');
await browser.close();
})();
