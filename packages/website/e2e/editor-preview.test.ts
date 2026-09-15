import { resolve } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { PORT } from './globalSetup';
let browser: Browser;
let page: Page;
beforeAll(async () => {
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto(`http://localhost:${PORT}/editor`);
});
afterAll(() => browser.close());
const state = () => page.locator('[data-preview-state]').getAttribute('data-preview-state');

test('an edit recompiles the material into the running viewer instead of rebuilding it', async () => {
  await expect.poll(() => page.locator('.react-flow__node').count()).toBe(2);
  await expect.poll(state, { timeout: 45000 }).toBe('ready');
  await page.evaluate(() => document.querySelector('canvas')!.setAttribute('data-first', ''));
  await page.locator('.react-flow__node[data-id="surface"]').click();
  await page.getByLabel('surface specular_roughness value', { exact: true }).fill('0.75');
  await expect.poll(state).toBe('loading');
  await expect.poll(state, { timeout: 45000 }).toBe('ready');
  // Same canvas, same renderer: only the material was replaced.
  expect(await page.locator('canvas').count()).toBe(1);
  expect(await page.locator('canvas[data-first]').count()).toBe(1);
});

test('textured materials preview from plain XML with textures served from memory', async () => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const base = 'https://materials.test/wood/';
  await page.route(base + '**', async (route) => {
    const name = new URL(route.request().url()).pathname.replace('/wood/', '');
    await route.fulfill({ path: resolve(import.meta.dirname, '../../../assets/wood_grain', name) });
  });
  await page.addInitScript(() => {
    const original = window.createImageBitmap;
    let decoded = 0;
    Object.assign(window, { decodedImages: () => decoded });
    window.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) => {
      decoded++;
      return original.apply(window, args);
    }) as typeof createImageBitmap;
  });
  await page.goto(`http://localhost:${PORT}/editor?materialUrl=${encodeURIComponent(base + 'wood_grain.mtlx')}`);
  await expect.poll(state, { timeout: 45000 }).toBe('ready');
  await page.evaluate(() => document.querySelector('canvas')!.setAttribute('data-first', ''));
  const decoded = () => page.evaluate(() => (window as unknown as { decodedImages(): number }).decodedImages());
  // The environment and the document's textures decode on first load...
  const initial = await decoded();
  expect(initial).toBeGreaterThan(1);
  await page.locator('.react-flow__node[data-id="SR_wood1"]').click();
  await page.getByLabel('SR_wood1 coat value', { exact: true }).fill('0.5');
  await expect.poll(state).toBe('loading');
  await expect.poll(state, { timeout: 45000 }).toBe('ready');
  expect(await page.locator('canvas[data-first]').count()).toBe(1);
  // ...and an edit decodes nothing: same blob URLs, cached bitmaps.
  expect(await decoded()).toBe(initial);
  expect(errors).toEqual([]);
});
