import { useMemo, useState } from 'react';
import { ChevronRight, GripVertical } from 'lucide-react';
import { getNodeCatalog, nodeType, type MaterialXNodeSpec } from './model.js';
import { buildNodeCatalogTree, nodeCatalogLeaves, type NodeCatalogEntry } from './node-catalog-tree.js';
import { getNodeFamilies } from './node-families.js';
export const MATERIALX_NODE_MIME = 'application/x-materialx-nodedef';
const defaultCatalog = getNodeCatalog();
export interface MaterialXNodeListProps {
  nodes: MaterialXNodeSpec[];
  disabled?: boolean;
  onAdd?: (node: MaterialXNodeSpec) => void;
}
/** Shared by the category column and search results; buttons also support keyboard insertion. */
export function MaterialXNodeList({ nodes, disabled, onAdd }: MaterialXNodeListProps) {
  return <CatalogList entries={nodeCatalogLeaves(nodes)} disabled={disabled} onAdd={onAdd} />;
}
function CatalogList({
  entries,
  disabled,
  onAdd,
  selected,
  onSelect,
}: {
  entries: NodeCatalogEntry[];
  disabled?: boolean;
  onAdd?: (node: MaterialXNodeSpec) => void;
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <ul className="mtlx-node-list">
      {entries.map((entry) => {
        if (entry.kind === 'group')
          return (
            <li key={entry.id}>
              <button
                type="button"
                className="mtlx-catalog-group"
                aria-pressed={selected === entry.id}
                onClick={() => onSelect?.(entry.id)}
              >
                {entry.label}
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </li>
          );
        const node = entry.node;
        return (
          <li key={entry.id}>
            <button
              type="button"
              disabled={disabled}
              draggable={!disabled}
              data-nodedef={node.nodeDefName}
              title={[node.nodeDefName, node.attributes?.doc].filter(Boolean).join('\n')}
              onClick={() => onAdd?.(node)}
              onDragStart={(event) => {
                event.dataTransfer.setData(MATERIALX_NODE_MIME, node.nodeDefName!);
                event.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <GripVertical className="mtlx-node-grip" size={14} aria-hidden="true" />
              <span className="mtlx-catalog-label">{entry.label}</span>
            </button>
          </li>
        );
      })}
      {!entries.length && <li>No matching nodes</li>}
    </ul>
  );
}
export interface MaterialXNodeLibProps {
  catalog?: MaterialXNodeSpec[];
  disabled?: boolean;
  onAdd?: (node: MaterialXNodeSpec) => void;
  className?: string;
}
export function MaterialXNodeLib({ catalog = defaultCatalog, disabled, onAdd, className = '' }: MaterialXNodeLibProps) {
  const [query, setQuery] = useState('');
  const tree = useMemo(() => buildNodeCatalogTree(catalog), [catalog]);
  const [path, setPath] = useState<string[]>(['shader']);
  const search = query.trim().toLowerCase();
  const searchEntries: NodeCatalogEntry[] = getNodeFamilies(catalog)
    .filter((family) =>
      family.variants.some((node) =>
        `${node.category} ${node.nodeDefName} ${nodeType(node)} ${node.nodeGroup}`.toLowerCase().includes(search),
      ),
    )
    .map((family) => ({ kind: 'node', id: family.id, label: family.label, node: family.variants[0]! }));

  const columns: { entries: NodeCatalogEntry[]; label: string; selected?: string }[] = [];
  let entries = tree;
  let label = 'Node categories';
  for (let depth = 0; entries.length; depth++) {
    const selected =
      entries.find((entry) => entry.kind === 'group' && entry.id === path[depth]) ??
      (depth === 0 ? entries[0] : undefined);
    columns.push({ entries, label, selected: selected?.id });
    if (selected?.kind !== 'group') break;
    entries = selected.children;
    label = `${selected.label} nodes`;
  }
  return (
    <section className={`mtlx-editor mtlx-library ${className}`} aria-label="MaterialX node library">
      <h2>Node library</h2>
      <input
        aria-label="Search nodes"
        type="search"
        placeholder="Search nodes or types…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={`mtlx-library-columns ${search ? 'mtlx-search-results' : ''}`}>
        {search ? (
          <CatalogList entries={searchEntries} disabled={disabled} onAdd={onAdd} />
        ) : (
          columns.map((column, depth) => (
            <nav key={depth} aria-label={column.label}>
              <CatalogList
                entries={column.entries}
                disabled={disabled}
                onAdd={(node) => {
                  setPath(columns.slice(0, depth).map((previous) => previous.selected!));
                  onAdd?.(node);
                }}
                selected={column.selected}
                onSelect={(id) => setPath([...columns.slice(0, depth).map((previous) => previous.selected!), id])}
              />
            </nav>
          ))
        )}
      </div>
      <small>Drag a node to the graph, or click to add it.</small>
    </section>
  );
}
