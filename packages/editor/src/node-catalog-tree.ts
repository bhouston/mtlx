import { nodeType, type MaterialXNodeSpec } from './model.js';
import { getNodeFamilies } from './node-families.js';

/** A definition the editor can instantiate: core's structural placeholders have no nodedef. */
export type NodeDefinition = MaterialXNodeSpec & { nodeDefName: string };
export const isNodeDefinition = (spec: MaterialXNodeSpec): spec is NodeDefinition => !!spec.nodeDefName;
export type NodeCatalogEntry =
  | { kind: 'group'; id: string; label: string; children: NodeCatalogEntry[] }
  | { kind: 'node'; id: string; label: string; node: NodeDefinition };

export function nodeCatalogLeaf(node: NodeDefinition): NodeCatalogEntry {
  return { kind: 'node', id: node.nodeDefName, label: node.category, node };
}

/** One entry per compatible interface family; concrete type variants stay out of the menus. */
export function nodeCatalogLeaves(catalog: MaterialXNodeSpec[]): NodeCatalogEntry[] {
  return getNodeFamilies(catalog).flatMap((family) => {
    const node = family.variants[0]!;
    return isNodeDefinition(node) ? [{ kind: 'node' as const, id: family.id, label: family.label, node }] : [];
  });
}
export function buildNodeCatalogTree(catalog: MaterialXNodeSpec[]): NodeCatalogEntry[] {
  const groups = new Map<string, NodeCatalogEntry[]>();
  for (const entry of nodeCatalogLeaves(catalog)) {
    if (entry.kind !== 'node') continue;
    const group = entry.node.nodeGroup ?? 'Other';
    groups.set(group, [...(groups.get(group) ?? []), entry]);
  }
  return [...groups.keys()]
    .toSorted((a, b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)))
    .map((group) => ({
      kind: 'group',
      id: group,
      label: group,
      children: groups.get(group)!,
    }));
}

/** Families matching a free-text query by category, definition name, type or group; `accept` narrows the variants. */
export function searchNodeCatalog(
  catalog: MaterialXNodeSpec[],
  query: string,
  accept: (spec: MaterialXNodeSpec) => boolean = () => true,
): NodeCatalogEntry[] {
  const search = query.trim().toLowerCase();
  // Exact category names rank first, then prefixes, then any other mention.
  const rank = (node: MaterialXNodeSpec) => {
    const category = node.category.toLowerCase();
    if (category === search) return 0;
    if (category.startsWith(search)) return 1;
    return `${category} ${node.nodeDefName} ${nodeType(node)} ${node.nodeGroup}`.toLowerCase().includes(search) ? 2 : 3;
  };
  return getNodeFamilies(catalog)
    .flatMap((family) => {
      const variants = family.variants.filter(accept);
      const score = Math.min(3, ...variants.map(rank));
      const node = variants[0];
      return node && isNodeDefinition(node) && score < 3
        ? [{ score, entry: { kind: 'node' as const, id: family.id, label: family.label, node } }]
        : [];
    })
    .toSorted((a, b) => a.score - b.score)
    .map(({ entry }) => entry);
}
