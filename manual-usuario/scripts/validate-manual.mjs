import { chromium } from '../../frontend/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const manualRoot = path.resolve(scriptDir, '..');
const manualUrl = `file:///${path.join(manualRoot, 'index.html').replaceAll('\\', '/')}`;
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ headless: true, executablePath: edgePath });

async function validateViewport(viewport, name) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(manualUrl, { waitUntil: 'load' });

  const title = await page.title();
  if (!title.includes('Manual de usuario')) throw new Error(`${name}: titulo ausente`);
  if (await page.locator('#caso-completo').count() !== 1) throw new Error(`${name}: caso completo ausente`);
  const realShotCount = await page.locator('img.real-shot').count();
  if (realShotCount < 3) throw new Error(`${name}: capturas reales insuficientes (${realShotCount})`);
  const operationCount = await page.locator('.operation-block').count();
  if (operationCount < 15) throw new Error(`${name}: cobertura operativa insuficiente (${operationCount})`);
  const procedureCount = await page.locator('.procedure').count();
  if (procedureCount < 8) throw new Error(`${name}: procedimientos insuficientes (${procedureCount})`);

  await page.locator('#manual-search').fill('mampostería BIM');
  if (!(await page.locator('#search-results a').count())) throw new Error(`${name}: busqueda sin resultados`);
  await page.keyboard.press('Escape');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`${name}: overflow horizontal de ${overflow}px`);

  if (errors.length) throw new Error(`${name}: errores de pagina: ${errors.join(' | ')}`);
  await page.close();
  return `${name}: OK`;
}

const results = [];
results.push(await validateViewport({ width: 1920, height: 1080 }, 'desktop-1920'));
results.push(await validateViewport({ width: 2560, height: 1440 }, 'desktop-ampliado'));

await browser.close();
process.stdout.write(`${results.join('\n')}\n`);
