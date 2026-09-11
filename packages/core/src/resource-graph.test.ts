import { expect, it } from 'vitest';
import { parseMaterialX } from './xml.js';
import { applyResourceDestinations, buildResourceGraph, planResourceDestinations } from './resource-graph.js';

it('plans against every original name and rewrites only original resource references', () => {
  const pkg = {
    rootPath: 'm.mtlx',
    document: parseMaterialX(
      '<materialx><image name="textures/a.png"><input name="file" type="filename" value="textures/a.png"/><input name="label" type="string" value="textures/a.png"/><input name="other" type="filename" value="textures/a-2.png"/></image></materialx>',
    ),
    resources: ['textures/a.png', 'textures/a-2.png'].map((archivePath) => ({
      archivePath,
      sourcePath: archivePath,
      data: new Uint8Array([1]),
    })),
  };
  const graph = buildResourceGraph(pkg);
  expect(graph.edges).toHaveLength(2);
  const plan = planResourceDestinations(pkg, (r) => r.archivePath, ['m.mtlx', 'textures/a.png']);
  expect(plan.get('textures/a.png')).toBe('textures/a-3.png');
  expect(plan.get('textures/a-2.png')).toBe('textures/a-2.png');
  applyResourceDestinations(pkg, plan);
  expect(pkg.document.nodes[0]?.name).toBe('textures/a.png');
  expect(pkg.document.nodes[0]?.inputs.map((input) => input.value)).toEqual([
    'textures/a-3.png',
    'textures/a.png',
    'textures/a-2.png',
  ]);
});
