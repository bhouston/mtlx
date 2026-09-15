import { expect, test } from 'vitest';
import { getNodeCatalog, getNodeFamilies } from './model.js';
import { buildNodeCatalogTree, nodeCatalogLeaves } from './node-catalog-tree.js';

test('collapses type variants to one family in catalog order', () => {
  const catalog = getNodeCatalog();
  const float = catalog.find((node) => node.nodeDefName === 'ND_constant_float')!;
  const color = catalog.find((node) => node.nodeDefName === 'ND_constant_color3')!;
  const single = { ...float, category: 'single', nodeDefName: 'ND_single' };
  expect(buildNodeCatalogTree([float, color, single])).toMatchObject([
    {
      kind: 'group',
      label: 'Procedural',
      children: [
        { kind: 'node', label: 'constant', node: float },
        { kind: 'node', label: 'single', node: single },
      ],
    },
  ]);
  expect(getNodeFamilies([float, color])[0]?.variants).toEqual([float, color]);
  expect(buildNodeCatalogTree([])).toEqual([]);
});

test('keeps incompatible interfaces, versions and targets distinct', () => {
  const node = getNodeCatalog().find((s) => s.nodeDefName === 'ND_constant_float')!;
  const older = { ...node, nodeGroup: undefined, nodeDefName: 'ND_custom_v1', attributes: { version: '1' } };
  const newer = { ...older, nodeDefName: 'ND_custom_v2', attributes: { version: '2' } };
  const target = { ...older, nodeDefName: 'ND_custom_target', attributes: { version: '1', target: 'custom' } };
  expect(buildNodeCatalogTree([older, newer, target])).toMatchObject([
    {
      label: 'Other',
      children: [
        { kind: 'node', id: 'ND_custom_v1', label: expect.stringContaining('v1') },
        { kind: 'node', id: 'ND_custom_v2', label: expect.stringContaining('v2') },
        { kind: 'node', id: 'ND_custom_target', label: expect.stringContaining('custom') },
      ],
    },
  ]);
  const separate = getNodeFamilies(getNodeCatalog()).filter((f) => f.variants[0]?.category === 'separate3');
  expect(separate).toHaveLength(2);
  expect(separate[0]?.label).not.toBe(separate[1]?.label);
});

test('lists tiledimage once and excludes core category-only placeholders', () => {
  const leaves = nodeCatalogLeaves(getNodeCatalog());
  expect(leaves.filter((entry) => entry.label === 'tiledimage')).toHaveLength(1);
  expect(leaves.every((entry) => entry.kind === 'node' && !!entry.node.nodeDefName)).toBe(true);
  expect(getNodeFamilies(getNodeCatalog()).find((f) => f.label === 'tiledimage')?.variants).toHaveLength(6);
});
