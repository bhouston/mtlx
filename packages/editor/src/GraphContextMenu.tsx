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
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onGroup,
  wire,
}: {
  children: ReactElement;
  catalog: MaterialXNodeSpec[];
  editable: boolean;
  nodeId?: string;
  onAdd: (spec: NodeDefinition) => void;
  onSearch: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  /** Offered at the root scope only; collapses the selection into a node graph. */
  onGroup?: () => void;
  /** Actions for a right-clicked wire or port; the menu shows these instead of the node or pane items. */
  wire?: { label: string; onDisconnect?: () => void; onReset?: () => void };
}) {
  const groups = useMemo(() => buildNodeCatalogTree(catalog), [catalog]);
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={!editable}>
        {children}
      </ContextMenuTrigger>
      {editable && (
        <ContextMenuContent collisionPadding={8}>
          {wire && (
            <>
              {wire.onDisconnect && (
                <ContextMenuItem variant="destructive" onSelect={wire.onDisconnect}>
                  {wire.label}
                </ContextMenuItem>
              )}
              {wire.onReset && <ContextMenuItem onSelect={wire.onReset}>Reset to default</ContextMenuItem>}
              {!wire.onDisconnect && !wire.onReset && <ContextMenuItem disabled>Not connected</ContextMenuItem>}
            </>
          )}
          {!wire && !nodeId && (
            <>
              <ContextMenuItem onSelect={onPaste}>Paste</ContextMenuItem>
              <ContextMenuItem onSelect={onSearch}>Search nodes…</ContextMenuItem>
            </>
          )}
          {!wire && !nodeId && (
            <ContextMenuSub>
              <ContextMenuSubTrigger disabled={!groups.length}>Add node</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <CatalogMenu entries={groups} onAdd={onAdd} />
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          {!wire && nodeId && (
            <>
              <ContextMenuItem onSelect={onCopy}>Copy</ContextMenuItem>
              <ContextMenuItem onSelect={onCut}>Cut</ContextMenuItem>
              <ContextMenuItem onSelect={onPaste}>Paste</ContextMenuItem>
              {onGroup && <ContextMenuItem onSelect={onGroup}>Group</ContextMenuItem>}
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
