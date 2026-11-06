import { chromium, type Browser, type Page } from 'playwright';
import { beforeAll, afterAll, beforeEach, afterEach, expect, test } from 'vitest';
import { resolve } from 'node:path';
import { PORT } from './globalSetup';
let browser: Browser;
let page: Page;
let errors: string[];
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal'] });
});
afterAll(() => browser.close());
beforeEach(async () => {
  errors = [];
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
});
afterEach(() => page.close());
const origin = `http://localhost:${PORT}`;

test('marketing and guides render statically and fit a mobile viewport', async () => {
  const response = await fetch(origin);
  const html = await response.text();
  expect(html).toContain('Keep the source.');
  await page.goto(origin);
  expect(await page.locator('h1').count()).toBe(1);
  expect(await page.locator('canvas').count()).toBe(0); // The marketing page must not initialize a GPU viewer.
  expect(await page.getByRole('link', { name: 'Try the material viewer' }).getAttribute('href')).toBe('/viewer/');
  await page.goto(`${origin}/docs/sdk/`);
  expect(await page.locator('h1').innerText()).toBe('MTLX.ai SDK');
  await page.goto(origin);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Toggle navigation bar' }).click();
  await expect
    .poll(() => page.locator('.navbar-sidebar').getByRole('link', { name: 'Editor', exact: true }).isVisible())
    .toBe(true);
  expect(errors).toEqual([]);
});

test('viewer preserves settings and camera sharing in the top-level URL without replacing its canvas', async () => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(
    `${origin}/viewer/?materialUrl=/materials/copper/copper.mtlx&geometry=sphere&rotate=false&alt=Polished%20copper`,
  );
  const tool = page.frameLocator('iframe[title="Material viewer"]');
  await expect
    .poll(() => tool.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 30_000 })
    .toBe('ready');
  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    return extension ? String(gl!.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '';
  });
  expect(renderer).not.toBe('');
  expect(renderer).not.toMatch(/SwiftShader|llvmpipe|lavapipe/i);
  console.log('Docs renderer:', renderer);
  const canvas = await tool.locator('canvas').elementHandle();
  expect(await canvas.getAttribute('aria-label')).toBe('Polished copper');
  await tool.getByRole('button', { name: 'Viewer settings', exact: true }).click();
  const rotation = tool.getByRole('slider', { name: 'Environment rotation', exact: true });
  await rotation.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => new URL(page.url()).searchParams.get('environmentRotation')).toBe('1');
  expect(await canvas.evaluate((element) => element.isConnected)).toBe(true);
  await tool.getByRole('button', { name: 'Close viewer settings', exact: true }).click();
  const download = page.waitForEvent('download');
  await tool.getByRole('button', { name: 'Download screenshot', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await tool.getByRole('button', { name: 'Share', exact: true }).click();
  await tool.getByRole('menuitem', { name: 'Copy viewer link', exact: true }).click();
  const shared = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(shared.pathname).toBe('/viewer');
  expect(shared.searchParams.get('cameraOrbit')).toBeTruthy();
  expect(shared.searchParams.get('alt')).toBe('Polished copper');
  await tool.getByRole('link', { name: 'Mtlx suite of web-focused MaterialX tools' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await page.goBack();
  await expect.poll(() => new URL(page.url()).searchParams.get('environmentRotation')).toBe('1');
  await expect
    .poll(
      () =>
        page
          .frameLocator('iframe[title="Material viewer"]')
          .locator('[data-preview-state]')
          .getAttribute('data-preview-state'),
      { timeout: 30_000 },
    )
    .toBe('ready');
  expect(errors).toEqual([]);
});

test('editor loads a material, displays a usable graph and preview, and old guide URLs redirect', async () => {
  await page.goto(`${origin}/editor/`);
  const tool = page.frameLocator('iframe[title="MaterialX node editor"]');
  await tool
    .locator('input[type=file]')
    .setInputFiles(resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx'));
  await expect
    .poll(() => tool.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 30_000 })
    .toBe('ready');
  expect(await tool.locator('.react-flow__node').count()).toBeGreaterThan(0);
  expect(
    await tool.locator('.react-flow').evaluate((element) => element.getBoundingClientRect().height),
  ).toBeGreaterThan(200);
  await page.goto(`${origin}/extension/`);
  await expect.poll(() => new URL(page.url()).pathname).toBe('/docs/vscode/');
  expect(await page.locator('h1').innerText()).toBe('VS Code extension');
  expect(errors).toEqual([]);
});
