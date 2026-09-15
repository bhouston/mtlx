import { afterEach, expect, it, vi } from 'vitest';
import { createMaterialXZipArchive, serializeMaterialX } from 'mtlx-core';
import { exportMaterial, importMaterial } from 'mtlx-editor/model';
import { loadEditorMaterial } from './editor-material-load';
const xml =
  '<materialx version="1.39"><constant name="c" type="color3"><input name="value" type="color3" value="1,0,0"/></constant></materialx>';
const signal = () => new AbortController().signal;
afterEach(() => vi.unstubAllGlobals());
it('loads query-string URLs and collects relative resources after redirects into portable ZIP paths', async () => {
  const root = new Response(
    '<materialx version="1.39"><image name="texture" type="color3"><input name="file" type="filename" value="../textures/color.png"/></image><xi:include href="defs.mtlx"/></materialx>',
  );
  Object.defineProperty(root, 'url', { value: 'https://cdn.test/catalog/materials/a.mtlx?token=redirect' });
  const texture = new Uint8Array([1, 2, 3]);
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(root)
    .mockResolvedValueOnce(new Response(texture))
    .mockResolvedValueOnce(
      new Response(
        '<materialx version="1.39"><nodedef name="ND_custom" node="custom"><output name="out" type="float"/></nodedef></materialx>',
      ),
    );
  vi.stubGlobal('fetch', fetcher);
  const pkg = await loadEditorMaterial('https://example.test/a.mtlx?token=a/b', signal(), 'https://mtlx.test');
  expect(fetcher.mock.calls.map((call) => call[0])).toEqual([
    'https://example.test/a.mtlx?token=a/b',
    'https://cdn.test/catalog/textures/color.png',
    'https://cdn.test/catalog/materials/defs.mtlx',
  ]);
  expect(pkg.rootPath).toBe('a.mtlx');
  expect(pkg.resources.map((r) => r.archivePath)).toEqual(['libraries/defs.mtlx', 'textures/color.png']);
  const reopened = importMaterial(exportMaterial(pkg, true), 'a.mtlx.zip');
  expect(reopened.resources.find((r) => r.archivePath === 'textures/color.png')?.data).toEqual(texture);
  expect(serializeMaterialX(reopened.document)).toContain('value="textures/color.png"');
});
it('loads the shared preset IDs and ZIP URLs without requesting embedded resources again', async () => {
  const bytes = createMaterialXZipArchive([
    { path: 'nested/m.mtlx', data: new TextEncoder().encode(xml) },
    { path: 'image.png', data: new Uint8Array([1]) },
  ]);
  const fetcher = vi.fn().mockResolvedValue(new Response(new Uint8Array(bytes)));
  vi.stubGlobal('fetch', fetcher);
  const pkg = await loadEditorMaterial('local/compound_zip', signal(), 'https://mtlx.test');
  expect(fetcher).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls[0]?.[0]).toBe('https://mtlx.test/materials/compound_zip/compound_zip.mtlx.zip');
  expect(pkg.rootPath).toBe('nested/m.mtlx');
  expect(pkg.resources).toHaveLength(1);
});
it('reports invalid URLs, HTTP failures and unavailable resources', async () => {
  await expect(loadEditorMaterial('javascript:alert(1)', signal(), 'https://mtlx.test')).rejects.toThrow('HTTP(S) URL');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
  await expect(loadEditorMaterial('/bad.mtlx', signal(), 'https://mtlx.test')).rejects.toThrow('HTTP 404');
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          '<materialx><image name="i" type="color3"><input name="file" type="filename" value="missing.png"/></image></materialx>',
        ),
      )
      .mockResolvedValueOnce(new Response('', { status: 404 })),
  );
  await expect(loadEditorMaterial('/a.mtlx', signal(), 'https://mtlx.test')).rejects.toThrow(
    'Could not load resource https://mtlx.test/missing.png: HTTP 404',
  );
});
it('bounds disk reads and cancels late network responses', async () => {
  const arrayBuffer = vi.fn();
  await expect(
    loadEditorMaterial(
      { name: 'big.mtlx', size: 17 * 1024 * 1024, arrayBuffer } as unknown as File,
      signal(),
      'https://mtlx.test',
    ),
  ).rejects.toThrow('read limit');
  expect(arrayBuffer).not.toHaveBeenCalled();
  let finish!: (response: Response) => void;
  const fetcher = vi.fn().mockReturnValue(
    new Promise<Response>((resolve) => {
      finish = resolve;
    }),
  );
  vi.stubGlobal('fetch', fetcher);
  const controller = new AbortController();
  const pending = loadEditorMaterial('/old.mtlx', controller.signal, 'https://mtlx.test');
  const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort();
  finish(new Response(xml));
  await rejected;
});
