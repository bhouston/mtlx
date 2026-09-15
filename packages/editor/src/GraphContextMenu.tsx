import { useMemo, type ReactElement } from 'react';
import { buildNodeCatalogTree, type NodeCatalogEntry, type NodeDefinition } from './node-catalog-tree.js';
import { nodeType, type MaterialXNodeSpec } from './model.js';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from './ui/context-menu.js';

export function GraphContextMenu({
  children,
  catalog,
  editable,
  nodeId,
  onAdd,
  onSearch,
  onClone,
  onDelete,
  onGroup,
}: {
  children: ReactElement;
  catalog: MaterialXNodeSpec[];
  editable: boolean;
  nodeId?: string;
  onAdd: (spec: NodeDefinition) => void;
  onSearch: () => void;
  onClone: () => void;
  onDelete: () => void;
  /** Offered at the root scope only; collapses the selection into a node graph. */
  onGroup?: () => void;
}) {
  const groups = useMemo(() => buildNodeCatalogTree(catalog), [catalog]);
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={!editable}>
        {children}
      </ContextMenuTrigger>
      {editable && (
        <ContextMenuContent collisionPadding={8}>
          {!nodeId && <ContextMenuItem onSelect={onSearch}>Search nodes…</ContextMenuItem>}
          {!nodeId && (
            <ContextMenuSub>
              <ContextMenuSubTrigger disabled={!groups.length}>Add node</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <CatalogMenu entries={groups} onAdd={onAdd} />
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          {nodeId && (
            <>
              <ContextMenuItem onSelect={onClone}>Clone</ContextMenuItem>
              {onGroup && <ContextMenuItem onSelect={onGroup}>Group into node graph</ContextMenuItem>}
              <ContextMenuItem variant="destructive" onSelect={onDelete}>
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}

function CatalogMenu({ entries, onAdd }: { entries: NodeCatalogEntry[]; onAdd: (node: NodeDefinition) => void }) {
  return entries.map((entry) => {
    if (entry.kind === 'group')
      return (
        <ContextMenuSub key={entry.id}>
          <ContextMenuSubTrigger>{entry.label}</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <CatalogMenu entries={entry.children} onAdd={onAdd} />
          </ContextMenuSubContent>
        </ContextMenuSub>
      );
    const spec = entry.node;
    return (
      <ContextMenuItem
        key={entry.id}
        textValue={`${spec.category} ${nodeType(spec)} ${spec.nodeDefName}`}
        title={[spec.nodeDefName, spec.attributes?.doc].filter(Boolean).join('\n')}
        onSelect={() => onAdd(spec)}
      >
        <span className="mtlx-catalog-label">{entry.label}</span>
      </ContextMenuItem>
    );
  });
}
