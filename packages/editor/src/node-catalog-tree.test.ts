import { expect, test } from 'vitest';
import { getNodeCatalog } from './model.js';
import { buildNodeCatalogTree } from './node-catalog-tree.js';

test('groups variants only when needed and preserves every definition', () => {
  const catalog = getNodeCatalog();
  const float = catalog.find((node) => node.nodeDefName === 'ND_constant_float')!;
  const color = catalog.find((node) => node.nodeDefName === 'ND_constant_color3')!;
  const single = { ...float, category: 'single', nodeDefName: 'ND_single' };
  expect(buildNodeCatalogTree([float, color, single])).toMatchObject([
    {
      kind: 'group',
      label: 'procedural',
      children: [
        {
          kind: 'group',
          label: 'constant',
          children: [
            { kind: 'node', node: float },
            { kind: 'node', node: color },
          ],
        },
        { kind: 'node', node: single },
      ],
    },
  ]);
  expect(buildNodeCatalogTree([float])).toMatchObject([{ children: [{ kind: 'node', node: float }] }]);
  expect(buildNodeCatalogTree([])).toEqual([]);
});

test('keeps custom definitions and versions distinct within their group', () => {
  const node = getNodeCatalog()[0]!;
  const older = { ...node, nodeGroup: undefined, nodeDefName: 'ND_custom_v1', attributes: { version: '1' } };
  const newer = { ...older, nodeDefName: 'ND_custom_v2', attributes: { version: '2' } };
  expect(buildNodeCatalogTree([older, newer])).toMatchObject([
    {
      label: 'Other',
      children: [
        {
          kind: 'group',
          children: [
            { id: 'ND_custom_v1', node: older },
            { id: 'ND_custom_v2', node: newer },
          ],
        },
      ],
    },
  ]);
});
