import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { expect, test } from 'vitest';
import { PORT } from './globalSetup';

test('rotates studio highlights without downloads or replacing the canvas and restores shared yaw', async () => {
  const browser = await chromium.launch({
    channel: process.env.MTLX_HARDWARE_GPU ? 'chrome' : undefined,
    args: process.env.MTLX_HARDWARE_GPU ? ['--use-angle=metal'] : [],
  });
  const page = await browser.newPage();
  const errors: string[] = [];
  const environmentRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/\.(hdr|exr)([?#]|$)|studio-environment\.png/.test(request.url())) environmentRequests.push(request.url());
  });
  await page.route('https://mtlx-static.ben3d.ca/viewer/shaderball.glb', (route) =>
    route.fulfill({
      path: resolve(import.meta.dirname, '../../static-assets/public/viewer/shaderball.glb'),
    }),
  );
  try {
    await page.goto(`http://localhost:${PORT}/viewer?rotate=false&geometry=sphere`);
    const renderer = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const extension = gl?.getExtension('WEBGL_debug_renderer_info');
      return extension ? String(gl!.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '';
    });
    expect(renderer).not.toBe('');
    expect(renderer).not.toMatch(/SwiftShader|llvmpipe|lavapipe/i);
    console.log('Environment rotation renderer:', renderer);
    await page.setInputFiles('input[type=file]', {
      name: 'copper.mtlx',
      mimeType: 'application/xml',
      buffer: await readFile(resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx')),
    });
    await expect
      .poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 30_000 })
      .toBe('ready');
    const canvas = await page.locator('canvas').elementHandle();
    const before = await canvas.screenshot();
    await page.getByRole('button', { name: 'Viewer settings', exact: true }).click();
    const rotation = page.getByRole('slider', { name: 'Environment rotation', exact: true });
    expect(await rotation.inputValue()).toBe('0');
    await rotation.evaluate((input: HTMLInputElement) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '90');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(() => new URL(page.url()).searchParams.get('environmentRotation')).toBe('90');
    expect(await canvas.evaluate((element) => element.isConnected)).toBe(true);
    await page.getByRole('button', { name: 'Close viewer settings', exact: true }).click();
    await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(false);
    if (process.env.MTLX_ROTATION_SCREENSHOT) await canvas.screenshot({ path: process.env.MTLX_ROTATION_SCREENSHOT });
    expect(environmentRequests).toEqual([]);
    await page.goto(
      `http://localhost:${PORT}/embed?materialUrl=/materials/compound/compound.mtlx&environmentRotation=90&rotate=false`,
    );
    await expect
      .poll(() => page.locator('[data-preview-state]').getAttribute('data-preview-state'), { timeout: 30_000 })
      .toBe('ready');
    await page.getByRole('button', { name: 'Viewer settings', exact: true }).click();
    expect(await page.getByRole('slider', { name: 'Environment rotation', exact: true }).inputValue()).toBe('90');
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
