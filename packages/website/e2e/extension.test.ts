import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { expect, test } from 'vitest';
import { getPreviewHtml } from '../../vscode-extension/src/previewHtml';
import type * as vscode from 'vscode';
import { PORT } from './globalSetup';

test.each([false, true])(
  'built extension webview renders and restores configured assets (custom=%s)',
  async (custom) => {
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
      const customPng = (
        await readFile(resolve(import.meta.dirname, '../../viewer/assets/studio-environment.png'))
      ).toString('base64');
      await page.addInitScript(
        ({ png }) => {
          type HostMessage = { type: string; kind?: string; name?: string; requestId?: number };
          const host = window as unknown as { acquireVsCodeApi: () => unknown; messages: HostMessage[] };
          host.messages = [];
          host.acquireVsCodeApi = () => ({
            getState: () => JSON.parse(localStorage.getItem('preview-state') || '{}'),
            setState: (state: unknown) => localStorage.setItem('preview-state', JSON.stringify(state)),
            postMessage: (message: HostMessage) => {
              host.messages.push(message);
              if (message.type !== 'loadAsset') return;
              const reply = { type: 'asset', requestId: message.requestId };
              if (message.name === 'broken') {
                window.postMessage({ ...reply, error: 'Configured file not found' }, '*');
                return;
              }
              if (message.kind === 'ibl') {
                const bytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
                window.postMessage({ ...reply, data: bytes.buffer, source: 'gallery.png', resources: [] }, '*');
              } else {
                const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]);
                const gltf = {
                  asset: { version: '2.0' },
                  scene: 0,
                  scenes: [{ nodes: [0] }],
                  nodes: [{ mesh: 0 }],
                  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                  buffers: [{ uri: 'mesh.bin', byteLength: positions.byteLength }],
                  bufferViews: [{ buffer: 0, byteLength: positions.byteLength }],
                  accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] },
                  ],
                };
                window.postMessage(
                  {
                    ...reply,
                    data: new TextEncoder().encode(JSON.stringify(gltf)).buffer,
                    source: 'bust.gltf',
                    resources: [{ path: 'mesh.bin', data: positions.buffer }],
                  },
                  '*',
                );
              }
            },
          });
        },
        { png: customPng },
      );
      await page.emulateMedia({ reducedMotion: custom ? 'no-preference' : 'reduce' });
      const settings = custom
        ? {
            ibls: [{ name: 'gallery', source: 'https://example.com/gallery.png' }],
            geometries: [
              { name: 'bust', source: 'bust.gltf' },
              { name: 'broken', source: 'missing.glb' },
            ],
            defaultIbl: 'gallery',
            defaultGeometry: 'bust',
            autoRotate: false,
            warnings: [],
          }
        : undefined;
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
          ({ raw: fileBytes, shaderBall: ballBytes, settings: configured }) =>
            window.postMessage(
              {
                settings: configured,
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
          { raw: [...raw], shaderBall: [...shaderBall], settings },
        );
        await expect
          .poll(() => page.locator('#preview-status').textContent(), { timeout: 30_000 })
          .toBe('Preview: ready');
      };
      await page.goto(`http://localhost:${PORT}/__extension-test__/index.html`);
      await send();
      expect(await page.getByRole('button', { name: 'Resume rotation' }).count()).toBe(1);
      expect(await page.getByRole('combobox', { name: 'Geometry' }).inputValue()).toBe(custom ? 'bust' : 'totem');
      expect(await page.getByRole('combobox', { name: 'IBL environment' }).inputValue()).toBe(
        custom ? 'gallery' : 'bridge',
      );
      if (custom) {
        expect(
          await page.evaluate(
            () =>
              (window as unknown as { messages: Array<{ type: string }> }).messages.filter(
                (message) => message.type === 'loadAsset',
              ).length,
          ),
        ).toBe(2);
        await page.getByRole('combobox', { name: 'Geometry' }).selectOption('broken');
        await expect.poll(() => page.locator('#geometry-status').textContent()).toContain('Configured file not found');
        expect(await page.getByRole('combobox', { name: 'Geometry' }).inputValue()).toBe('bust');
        expect(await page.locator('#preview-status').textContent()).toBe('Preview: ready');
      }
      await page.getByRole('combobox', { name: 'Geometry' }).selectOption('sphere');
      await page.getByRole('combobox', { name: 'IBL environment' }).selectOption('bridge');
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
      expect(await page.getByRole('combobox', { name: 'IBL environment' }).inputValue()).toBe('bridge');
      expect(await page.locator('#log').innerText()).toContain('Environment ready: San Giuseppe Bridge.');
      expect(await page.getByRole('button', { name: 'Resume rotation' }).count()).toBe(1);
      await page.setViewportSize({ width: 375, height: 800 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  },
);
