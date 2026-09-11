import { afterEach, expect, it, vi } from 'vitest';
import type * as vscode from 'vscode';
const mocked = vi.hoisted(() => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- URI construction belongs to the hoisted mock
  const uri = (value: string): vscode.Uri => {
    const url = new URL(value);
    return {
      path: url.pathname,
      scheme: url.protocol.slice(0, -1),
      toString: () => url.href,
      with: ({ path }: { path: string }) => {
        const result = new URL(url);
        result.pathname = path;
        return uri(result.href);
      },
    } as vscode.Uri;
  };
  return { uri, readFile: vi.fn(), stat: vi.fn().mockResolvedValue({ size: 20 }) };
});
vi.mock('vscode', () => ({
  Uri: {
    parse: mocked.uri,
    file: (path: string) => mocked.uri(new URL(path, 'file:///').href),
    joinPath: (uri: vscode.Uri, ...parts: string[]) => uri.with({ path: `${uri.path}/${parts.join('/')}` }),
  },
  workspace: {
    getWorkspaceFolder: () => ({ uri: mocked.uri('vscode-remote://studio/project') }),
    fs: { stat: mocked.stat, readFile: mocked.readFile },
  },
}));
import { configuredAssetUri, loadPreviewAsset } from './previewAssets.js';
const document = mocked.uri('vscode-remote://studio/project/materials/a.mtlx');
const signal = () => new AbortController().signal;
afterEach(() => {
  vi.unstubAllGlobals();
  mocked.readFile.mockReset();
  mocked.stat.mockResolvedValue({ size: 20 });
});
it('resolves workspace-relative paths without dropping the remote authority', () => {
  expect(configuredAssetUri('models/bust.gltf', document).toString()).toBe(
    'vscode-remote://studio/project/models/bust.gltf',
  );
  expect(configuredAssetUri('/ibl.hdr', document).toString()).toBe('file:///ibl.hdr');
});
it('reads local glTF sidecars relative to the configured file', async () => {
  mocked.readFile.mockImplementation(async (uri: vscode.Uri) =>
    uri.path.endsWith('.gltf')
      ? new TextEncoder().encode(
          JSON.stringify({
            buffers: [{ uri: '../data/mesh.bin' }],
            images: [{ uri: 'maps/a%20b.png' }, { uri: 'data:image/png;base64,AA==' }],
          }),
        )
      : new Uint8Array([1, 2, 3]),
  );
  const result = await loadPreviewAsset({ name: 'bust', source: 'models/bust.gltf' }, 'geometry', document, signal());
  expect(result.resources.map((resource) => resource.path)).toEqual(['../data/mesh.bin', 'maps/a%20b.png']);
  expect(mocked.readFile.mock.calls.map(([uri]) => uri.toString())).toEqual([
    'vscode-remote://studio/project/models/bust.gltf',
    'vscode-remote://studio/project/data/mesh.bin',
    'vscode-remote://studio/project/models/maps/a%20b.png',
  ]);
});
it('follows HTTP redirect bases for glTF resources and requires successful responses', async () => {
  const response = new Response(JSON.stringify({ buffers: [{ uri: 'mesh.bin' }] }));
  Object.defineProperty(response, 'url', { value: 'https://cdn.example.com/v2/model.gltf' });
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(response)
    .mockResolvedValueOnce(new Response(new Uint8Array([1])));
  vi.stubGlobal('fetch', fetcher);
  const asset = { name: 'bust', source: 'https://example.com/model.gltf' };
  await loadPreviewAsset(asset, 'geometry', document, signal());
  expect(fetcher.mock.calls[1]![0]).toBe('https://cdn.example.com/v2/mesh.bin');
  fetcher.mockResolvedValueOnce(new Response('missing', { status: 404 }));
  await expect(loadPreviewAsset(asset, 'geometry', document, signal())).rejects.toThrow('HTTP 404');
});
it('rejects oversized files before reading them', async () => {
  mocked.stat.mockResolvedValue({ size: 129 * 1024 * 1024 });
  await expect(loadPreviewAsset({ name: 'big', source: '/big.hdr' }, 'ibl', document, signal())).rejects.toThrow(
    '128 MiB',
  );
  expect(mocked.readFile).not.toHaveBeenCalled();
});
