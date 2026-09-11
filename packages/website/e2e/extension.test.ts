import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { expect, test } from 'vitest';
import { getPreviewHtml } from '../../vscode-extension/src/previewHtml';
import type * as vscode from 'vscode';
import { PORT } from './globalSetup';

test('built extension webview requests data, renders, and restores controls after recreation', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    const html = getPreviewHtml(
      { cspSource: "'self'" } as vscode.Webview,
      '/__extension-test__/preview.js' as unknown as vscode.Uri,
      '/__extension-test__/default-environment.hdr' as unknown as vscode.Uri,
    );
    await page.route('**/__extension-test__/index.html', (route) =>
      route.fulfill({ body: html, contentType: 'text/html' }),
    );
    await page.route('**/__extension-test__/preview.js', (route) =>
      route.fulfill({
        path: resolve(import.meta.dirname, '../../vscode-extension/media/preview.js'),
        contentType: 'text/javascript',
      }),
    );
    await page.route('**/__extension-test__/default-environment.hdr', (route) =>
      route.fulfill({ path: resolve(import.meta.dirname, '../../viewer/assets/default-environment.hdr') }),
    );
    await page.addInitScript(() => {
      const host = window as unknown as { acquireVsCodeApi: () => unknown; messages: Array<{ type: string }> };
      host.messages = [];
      host.acquireVsCodeApi = () => ({
        getState: () => JSON.parse(localStorage.getItem('preview-state') || '{}'),
        setState: (state: unknown) => localStorage.setItem('preview-state', JSON.stringify(state)),
        postMessage: (message: { type: string }) => host.messages.push(message),
      });
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const [raw, shaderBall] = await Promise.all([
      readFile(resolve(import.meta.dirname, '../../../assets/copper/copper.mtlx')),
      readFile(resolve(import.meta.dirname, '../../viewer/assets/shaderball.glb')),
    ]);
    const send = async () => {
      await page.waitForFunction(() =>
        (window as unknown as { messages: Array<{ type: string }> }).messages.some(
          (message) => message.type === 'ready',
        ),
      );
      await page.evaluate(
        ({ raw: fileBytes, shaderBall: ballBytes }) =>
          window.postMessage(
            {
              fileName: 'copper.mtlx',
              fileSize: fileBytes.length,
              valid: true,
              issues: [],
              resourcesChecked: true,
              textures: [],
              data: new Uint8Array(fileBytes).buffer,
              shaderBall: new Uint8Array(ballBytes).buffer,
            },
            '*',
          ),
        { raw: [...raw], shaderBall: [...shaderBall] },
      );
      await expect
        .poll(() => page.locator('#preview-status').textContent(), { timeout: 30_000 })
        .toBe('Preview: ready');
    };
    await page.goto(`http://localhost:${PORT}/__extension-test__/index.html`);
    await send();
    expect(await page.getByRole('button', { name: 'Resume rotation' }).count()).toBe(1);
    await page.getByRole('combobox', { name: 'Geometry' }).selectOption('sphere');
    await page.getByRole('combobox', { name: 'IBL environment' }).selectOption('default');
    await expect
      .poll(() => page.locator('#log').innerText(), { timeout: 30_000 })
      .toContain('Environment ready: San Giuseppe Bridge.');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('button', { name: 'Copy diagnostics' }).click();
    expect(
      await page.evaluate(() =>
        (window as unknown as { messages: Array<{ type: string }> }).messages.some(
          (message) => message.type === 'copyDiagnostics',
        ),
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    expect(
      await page.evaluate(() =>
        (window as unknown as { messages: Array<{ type: string }> }).messages.some(
          (message) => message.type === 'refresh',
        ),
      ),
    ).toBe(true);
    await page.reload();
    await send();
    expect(await page.getByRole('combobox', { name: 'Geometry' }).inputValue()).toBe('sphere');
    expect(await page.getByRole('combobox', { name: 'IBL environment' }).inputValue()).toBe('default');
    expect(await page.locator('#log').innerText()).toContain('Environment ready: San Giuseppe Bridge.');
    expect(await page.getByRole('button', { name: 'Resume rotation' }).count()).toBe(1);
    await page.setViewportSize({ width: 375, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
