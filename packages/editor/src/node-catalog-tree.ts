import { type MaterialXNodeSpec } from './model.js';
import { getNodeFamilies } from './node-families.js';

export type NodeCatalogEntry =
  | { kind: 'group'; id: string; label: string; children: NodeCatalogEntry[] }
  | { kind: 'node'; id: string; label: string; node: MaterialXNodeSpec };

export function nodeCatalogLeaf(node: MaterialXNodeSpec): NodeCatalogEntry {
  return { kind: 'node', id: node.nodeDefName!, label: node.category, node };
}

/** One entry per compatible interface family; concrete type variants stay out of the menus. */
export function nodeCatalogLeaves(catalog: MaterialXNodeSpec[]): NodeCatalogEntry[] {
  return getNodeFamilies(catalog).map((family) => ({
    kind: 'node',
    id: family.id,
    label: family.label,
    node: family.variants[0]!,
  }));
}
export function buildNodeCatalogTree(catalog: MaterialXNodeSpec[]): NodeCatalogEntry[] {
  const groups = new Map<string, NodeCatalogEntry[]>();
  for (const entry of nodeCatalogLeaves(catalog)) {
    if (entry.kind !== 'node') continue;
    const group = entry.node.nodeGroup ?? 'Other';
    groups.set(group, [...(groups.get(group) ?? []), entry]);
  }
  return [...groups.keys()].toSorted().map((group) => ({
    kind: 'group',
    id: group,
    label: group,
    children: groups.get(group)!,
  }));
}
