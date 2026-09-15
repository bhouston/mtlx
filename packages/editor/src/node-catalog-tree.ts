import { type MaterialXNodeSpec } from './model.js';

export type NodeCatalogEntry =
  | { kind: 'group'; id: string; label: string; children: NodeCatalogEntry[] }
  | { kind: 'node'; id: string; label: string; node: MaterialXNodeSpec };

export function nodeCatalogLeaf(node: MaterialXNodeSpec): NodeCatalogEntry {
  return { kind: 'node', id: node.nodeDefName!, label: node.category, node };
}

/** Add a variant level only when a node category has multiple definitions. */
export function buildNodeCatalogTree(catalog: MaterialXNodeSpec[]): NodeCatalogEntry[] {
  const groups = new Map<string, Map<string, MaterialXNodeSpec[]>>();
  for (const node of catalog) {
    const group = node.nodeGroup ?? 'Other';
    if (!groups.has(group)) groups.set(group, new Map());
    const categories = groups.get(group)!;
    if (!categories.has(node.category)) categories.set(node.category, []);
    categories.get(node.category)!.push(node);
  }
  return [...groups.keys()].toSorted().map((group) => ({
    kind: 'group',
    id: group,
    label: group,
    children: [...groups.get(group)!].map(([category, nodes]) =>
      nodes.length === 1
        ? nodeCatalogLeaf(nodes[0]!)
        : { kind: 'group', id: category, label: category, children: nodes.map(nodeCatalogLeaf) },
    ),
  }));
}
