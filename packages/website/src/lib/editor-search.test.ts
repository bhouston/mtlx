import { expect, it } from 'vitest';
import { createDefaultDocument, setInputValue } from 'mtlx-editor/model';
import { createMaterialXZipArchive, serializeMaterialX, type MaterialXPackage } from 'mtlx-core';
import {
  DRAFT_LIMITS,
  decodeEditorSnapshot,
  editorSearch,
  editorShareUrl,
  encodeEditorSnapshot,
  hasEditorSnapshot,
  readEditorSnapshot,
} from './editor-search';
const pkg = (): MaterialXPackage => ({ rootPath: 'material.mtlx', document: createDefaultDocument(), resources: [] });
it('shares an unchanged source with the editor and preview settings in the query', () => {
  const state = {
    materialUrl: 'ignored',
    scope: 'NG',
    geometry: 'sphere' as const,
    rotate: false,
  };
  const source = 'https://example.com/a.mtlx.zip?token=a/b&v=2';
  const url = new URL(editorShareUrl('https://mtlx.test', state, pkg(), source));
  expect(url.pathname).toBe('/editor');
  expect(url.hash).toBe('');
  expect(url.searchParams.has('mode')).toBe(false);
  expect(editorSearch(Object.fromEntries(url.searchParams))).toEqual({ ...state, materialUrl: source });
  expect(editorSearch({ material: 'local/compound', mode: 'view', scope: [] })).toEqual({
    materialUrl: '/materials/compound/compound.mtlx',
  });
});
it('round-trips current edits, layout and resource bytes in a self-contained fragment', () => {
  const original = pkg();
  original.document = setInputValue(original.document, 'surface', 'base_color', '0, 1, 0');
  original.resources.push({ sourcePath: 'a.png', archivePath: 'textures/a.png', data: new Uint8Array([1, 2, 3]) });
  const url = new URL(
    editorShareUrl('https://mtlx.test', { materialUrl: 'https://example.com/original.mtlx', scope: 'NG' }, original),
  );
  expect(url.searchParams.has('materialUrl')).toBe(false);
  expect(hasEditorSnapshot(url.hash)).toBe(true);
  const restored = readEditorSnapshot(url.hash);
  expect(serializeMaterialX(restored.document)).toBe(serializeMaterialX(original.document));
  expect(restored.resources[0]?.data).toEqual(original.resources[0]?.data);
});
it('bounds shared packages on creation and decoding', () => {
  const large = pkg();
  large.resources.push({ sourcePath: 'large', archivePath: 'large', data: new Uint8Array(1024 * 1024 + 1) });
  expect(() => editorShareUrl('https://mtlx.test', {}, large)).toThrow('Download the .mtlx.zip');
  expect(() => readEditorSnapshot('#material=' + 'a'.repeat(40000))).toThrow('oversized');
  expect(() => readEditorSnapshot('#material=!')).toThrow('Invalid');
  const compressed = createMaterialXZipArchive([
    {
      path: 'material.mtlx',
      data: new TextEncoder().encode('<materialx>' + ' '.repeat(2 * 1024 * 1024) + '</materialx>'),
    },
  ]);
  const encoded = btoa(Array.from(compressed, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
  expect(() => readEditorSnapshot('#material=' + encoded)).toThrow();
});

it('drafts accept resources beyond the share-link size', () => {
  const draft = pkg();
  const data = new Uint8Array(200 * 1024).map(() => Math.floor(Math.random() * 256));
  draft.resources = [{ archivePath: 'textures/big.png', sourcePath: 'textures/big.png', data }];
  expect(() => encodeEditorSnapshot(draft)).toThrow(/too large/);
  const restored = decodeEditorSnapshot(encodeEditorSnapshot(draft, DRAFT_LIMITS), DRAFT_LIMITS);
  expect(serializeMaterialX(restored.document)).toBe(serializeMaterialX(draft.document));
  expect(restored.resources[0]!.data).toEqual(data);
});
