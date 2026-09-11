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

test('inspection controls work with a keyboard, reduced motion and narrow screens', async () => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`http://localhost:${PORT}/viewer`);
  await page.setInputFiles('input[type=file]', materialPath);
  await expectReady();
  const rotation = page.getByRole('button', { name: 'Resume rotation' });
  expect(await rotation.getAttribute('aria-pressed')).toBe('true');
  await rotation.focus();
  await page.keyboard.press('Enter');
  expect(await page.getByRole('button', { name: 'Pause rotation' }).count()).toBe(1);
  await page.getByRole('combobox', { name: 'Geometry', exact: true }).selectOption('sphere');
  await page.getByRole('button', { name: 'Reset' }).focus();
  await page.keyboard.press('Enter');
  expect(await page.getByRole('combobox', { name: 'Material', exact: true }).count()).toBe(1);
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await page.getByRole('button', { name: 'Exit fullscreen' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download diagnostics' }).click();
  expect((await download).suggestedFilename()).toBe('mtlx-diagnostics.json');
  await page.setViewportSize({ width: 375, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole('button', { name: 'Hide details' }).click();
  expect(await page.locator('#material-details').isVisible()).toBe(false);
  expect(pageErrors).toEqual([]);
});

test('sample selection and URL input share one query parameter through navigation', async () => {
  const copper =
    'https://raw.githubusercontent.com/bhouston/material-samples/main/materials/showcase/standard_surface/copper/copper.mtlx';
  await page.route('https://raw.githubusercontent.com/**', (route) =>
    route.fulfill({ path: materialPath, contentType: 'application/xml' }),
  );
  await page.goto(`http://localhost:${PORT}/viewer?materialUrl=${encodeURIComponent(copper)}`);
  await expect.poll(() => page.getByLabel('Material URL', { exact: true }).inputValue()).toBe(copper);
  expect(await page.getByRole('combobox', { name: 'Sample material' }).innerText()).toContain('copper');
  await page.getByRole('combobox', { name: 'Sample material' }).click();
  await page.getByRole('option', { name: 'chrome', exact: true }).click();
  await expect
    .poll(() => page.getByLabel('Material URL', { exact: true }).inputValue())
    .toContain('/chrome/chrome.mtlx');
  expect(new URL(page.url()).searchParams.has('material')).toBe(false);
  await page.goBack();
  await expect.poll(() => page.getByLabel('Material URL', { exact: true }).inputValue()).toBe(copper);
  await page.getByLabel('Material URL', { exact: true }).fill('https://raw.githubusercontent.com/custom/material.mtlx');
  await page.getByRole('button', { name: 'Load URL' }).click();
  await expect
    .poll(() => page.getByRole('combobox', { name: 'Sample material' }).innerText())
    .toBe('Load a sample material…');
  await page.getByLabel('Material URL', { exact: true }).fill(copper);
  await page.getByRole('button', { name: 'Load URL' }).click();
  await expect.poll(() => page.getByRole('combobox', { name: 'Sample material' }).innerText()).toContain('copper');
});
