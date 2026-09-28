import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { transform } from 'mtlx-core';
import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';
import { resizeTextures } from 'mtlx-core/textures';
import { type Browser, type Page, chromium } from 'playwright';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { PORT } from './globalSetup';

// wood_grain converted to AVIF by the same transform `mtlx transform --image-format avif` runs,
// served from a fake origin as a .mtlx.zip and as a loose .mtlx with sibling textures.
const origin = 'https://materials.test/';
let dir: string;
let browser: Browser;
let page: Page;
let pageErrors: string[];

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mtlx-avif-'));
  for (const output of ['wood_grain.mtlx.zip', 'loose/wood_grain.mtlx']) {
    const pkg = await loadMaterialXPackage(resolve(import.meta.dirname, '../../../assets/wood_grain/wood_grain.mtlx'));
    await transform(pkg, resizeTextures({ targets: [{ format: 'avif' }] }));
    await writeMaterialXPackage(pkg, join(dir, output));
  }
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
  await rm(dir, { recursive: true, force: true });
});

beforeEach(async () => {
  pageErrors = [];
  page = await browser.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route(origin + '**', (route) =>
    route.fulfill({
      path: join(dir, new URL(route.request().url()).pathname),
      headers: { 'Access-Control-Allow-Origin': '*' },
    }),
  );
  // Counts browser decodes of AVIF blobs (ISO-BMFF `ftyp` box with the `avif` major brand).
  await page.addInitScript(() => {
    const counts = { ok: 0, failed: 0 };
    const original = window.createImageBitmap;
    Object.assign(window, { avifDecodes: counts });
    window.createImageBitmap = (async (...args: Parameters<typeof createImageBitmap>) => {
      const avif = args[0] instanceof Blob && (await args[0].slice(4, 12).text()) === 'ftypavif';
      try {
        const bitmap = await original.apply(window, args);
        if (avif) counts.ok++;
        return bitmap;
      } catch (error) {
        if (avif) counts.failed++;
        throw error;
      }
    }) as typeof createImageBitmap;
  });
});
afterEach(() => page.close());

const avifDecodes = () =>
  page.evaluate(() => (window as unknown as { avifDecodes: { ok: number; failed: number } }).avifDecodes);

async function expectBothTexturesDecoded() {
  await expect.poll(avifDecodes, { timeout: 30_000 }).toEqual({ ok: 2, failed: 0 });
  expect(pageErrors).toEqual([]);
}

const previewState = () => page.locator('[data-preview-state]').getAttribute('data-preview-state');

test('viewer renders a .mtlx.zip with AVIF textures', async () => {
  await page.goto(`http://localhost:${PORT}/viewer?materialUrl=${encodeURIComponent(origin + 'wood_grain.mtlx.zip')}`);
  await expect.poll(previewState, { timeout: 30_000 }).toBe('ready');
  await expectBothTexturesDecoded();
});

test('editor previews a loose .mtlx with sibling AVIF textures', async () => {
  await page.goto(
    `http://localhost:${PORT}/editor?materialUrl=${encodeURIComponent(origin + 'loose/wood_grain.mtlx')}`,
  );
  await expect.poll(previewState, { timeout: 45_000 }).toBe('ready');
  await expectBothTexturesDecoded();
});

test('<material-viewer> bundle renders a .mtlx.zip with AVIF textures', async () => {
  await page.route('https://mtlx.ben3d.ca/viewer-assets/**', (route) =>
    route.fulfill({
      path: resolve(import.meta.dirname, '../public/viewer-assets', new URL(route.request().url()).pathname.slice(15)),
      headers: { 'Access-Control-Allow-Origin': '*' },
    }),
  );
  await page.route('**/__element__/material-viewer.js', (route) =>
    route.fulfill({ path: resolve(import.meta.dirname, '../../viewer/dist/material-viewer.js') }),
  );
  await page.route('**/__element__/index.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><script type="module" src="material-viewer.js"></script>
        <material-viewer src="${origin}wood_grain.mtlx.zip" style="display:block;width:320px;height:320px"></material-viewer>
        <script>
          const el = document.querySelector('material-viewer');
          el.addEventListener('load', () => (window.elementState = 'load'));
          el.addEventListener('error', (e) => (window.elementState = 'error: ' + e.detail));
        </script>`,
    }),
  );
  await page.goto(`http://localhost:${PORT}/__element__/index.html`);
  await expect
    .poll(() => page.evaluate(() => (window as { elementState?: string }).elementState), { timeout: 30_000 })
    .toBe('load');
  await expectBothTexturesDecoded();
});
