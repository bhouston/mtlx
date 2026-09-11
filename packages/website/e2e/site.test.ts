import { resolve } from 'node:path';
import { type Browser, type Page, chromium } from 'playwright';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'vitest';
import { PORT } from './globalSetup';

let browser: Browser;
let page: Page;
let pageErrors: string[];

beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(() => browser.close());

beforeEach(async () => {
  pageErrors = [];
  page = await browser.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
});
afterEach(() => page.close());

test('home page server-renders and hydrates', async () => {
  const response = await page.goto(`http://localhost:${PORT}/`);
  expect(response?.status()).toBe(200);
  await expect.poll(() => page.locator('h1').textContent()).toBe('mtlx');
  expect(pageErrors).toEqual([]);
});

const materialPath = resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx');

async function expectReady() {
  await expect
    .poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 30_000 })
    .toBe('ready');
  expect(await page.locator('canvas').count()).toBe(1);
  expect(await page.locator('main').innerText()).toContain('Basic document checks passed');
  expect(await page.locator('main').innerText()).not.toContain('3D preview error:');
  expect(pageErrors).toEqual([]);
}

test('viewer renders a dropped .mtlx through the first completed frame and validates it', async () => {
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.setInputFiles('input[type=file]', materialPath);
  // Wait for a completed render, including shader compilation in the WebGL2 fallback.
  await expectReady();
});

test('a failed replacement clears old details and repeated loads resize the canvas correctly', async () => {
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.setInputFiles('input[type=file]', materialPath);
  await expectReady();
  await page.setInputFiles('input[type=file]', {
    name: 'broken.mtlx',
    mimeType: 'application/xml',
    buffer: Buffer.from('<broken>'),
  });
  await expect.poll(() => page.locator('dl').count()).toBe(0);
  await expect.poll(() => page.locator('canvas').count()).toBe(0);
  expect(await page.locator('main').innerText()).toContain('Load a material to see its details here.');
  for (const width of [900, 1100]) {
    await page.setInputFiles('input[type=file]', materialPath);
    await expectReady();
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page
          .locator('canvas')
          .evaluate((canvas) => Math.abs(canvas.getBoundingClientRect().width - canvas.parentElement!.clientWidth)),
      )
      .toBeLessThanOrEqual(1);
  }
  expect(pageErrors).toEqual([]);
});
