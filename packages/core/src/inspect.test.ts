import { expect, it } from 'vitest';
import { zipSync } from 'fflate';
import { inspectMaterialX } from './inspect.js';
const bytes = (text: string) => new TextEncoder().encode(text);
const wrap = (text: string) => bytes(`<materialx version="1.39">${text}</materialx>`);
it('runs type, structure, category and resource checks together', async () => {
  const result = await inspectMaterialX(
    wrap(
      '<constant name="a" type="float"><input name="value" type="color3" value="1, 1, 1"/></constant><constant name="a" type="float"/><add name="out" type="float"><input name="in1" type="color3" nodename="a"/></add><image name="img" type="color3"><input name="file" type="filename" value="missing.png"/></image>',
    ),
    'a.mtlx',
    {
      readResource: async () => {
        throw new Error('missing');
      },
      supportedCategories: [],
    },
  );
  for (const rule of ['types', 'structure', 'resources', 'renderer-support'])
    expect(result.issues.some((issue) => issue.rule === rule)).toBe(true);
  expect(result.parseError).toBeUndefined();
  expect(result.resourcePaths).toEqual(['missing.png']);
});
it('recursively validates include scope, detects cycles, and collects multiple missing files', async () => {
  const result = await inspectMaterialX(wrap('<xi:include href="lib/defs.mtlx"/>'), 'root.mtlx', {
    supportedCategories: [],
    readResource: async (path) => {
      if (path === 'lib/defs.mtlx')
        return wrap(
          '<xi:include href="../root.mtlx"/><image name="a" type="color3"><input name="file" type="filename" value="a.png"/></image><image name="b" type="color3"><input name="file" type="filename" value="b.png"/></image>',
        );
      throw new Error(path);
    },
  });
  expect(result.issues).toContainEqual(expect.objectContaining({ code: 'DEPENDENCY_CYCLE' }));
  expect(result.resourcePaths).toEqual(['lib/defs.mtlx', 'lib/a.png', 'lib/b.png']);
  expect(result.issues.filter((issue) => issue.code === 'RESOURCE_MISSING')).toHaveLength(2);
});
it('checks archive dependencies and included document types', async () => {
  const result = await inspectMaterialX(
    zipSync({
      'root.mtlx': wrap('<xi:include href="lib.mtlx"/>'),
      'lib.mtlx': wrap(
        '<constant name="c" type="float"><input name="value" type="color3" value="1, 1, 1"/></constant><add name="out" type="float"><input name="in1" type="color3" nodename="c"/></add>',
      ),
    }),
    'test.mtlx.zip',
    { supportedCategories: ['constant'] },
  );
  expect(result.resourcesChecked).toBe(true);
  expect(result.issues.some((issue) => issue.rule === 'types')).toBe(true);
  expect(result.issues.some((issue) => issue.code === 'RESOURCES_UNASSESSED')).toBe(false);
});
it('reports inaccessible local dependencies without pretending they are missing on disk', async () => {
  const result = await inspectMaterialX(
    wrap('<image name="a" type="color3"><input name="file" type="filename" value="a.png"/></image>'),
    'a.mtlx',
  );
  expect(result.resourcesChecked).toBe(false);
  expect(result.issues).toContainEqual(expect.objectContaining({ code: 'RESOURCES_UNASSESSED' }));
});
it('preserves absolute resource URLs for the host reader', async () => {
  const result = await inspectMaterialX(
    wrap(
      '<image name="a" type="color3"><input name="file" type="filename" value="https://example.com/a.png"/></image>',
    ),
    'a.mtlx',
    {
      readResource: async (path) => {
        expect(path).toBe('https://example.com/a.png');
        return new Uint8Array([1]);
      },
    },
  );
  expect(result.issues.filter((issue) => issue.rule === 'resources')).toEqual([]);
});
