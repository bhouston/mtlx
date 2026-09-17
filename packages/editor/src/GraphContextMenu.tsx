import { useMemo, type ReactElement } from 'react';
import { buildNodeCatalogTree, type NodeCatalogEntry, type NodeDefinition } from './node-catalog-tree.js';
import { nodeType, type MaterialXNodeSpec } from './model.js';
import { CONTEXT_MENU_COMMANDS, execute, resolveCommands, type CommandContext, type CommandEntry } from './commands.js';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from './ui/context-menu.js';

/** Right-click menu driven by commands; the node catalog submenu joins them on an empty canvas. */
export function GraphContextMenu({
  children,
  catalog,
  context,
  entries = CONTEXT_MENU_COMMANDS,
  onAdd,
}: {
  children: ReactElement;
  catalog: MaterialXNodeSpec[];
  /** The command context for where the menu opened: its targets, canvas point and wire. */
  context: CommandContext;
  entries?: readonly CommandEntry[];
  onAdd: (spec: NodeDefinition) => void;
}) {
  const groups = useMemo(() => buildNodeCatalogTree(catalog), [catalog]);
  const items = resolveCommands(entries, context);
  const showCatalog = !context.wire && !context.targets.length;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={!context.editable}>
        {children}
      </ContextMenuTrigger>
      {context.editable && (
        <ContextMenuContent collisionPadding={8}>
          {items.map((item, index) =>
            item === 'divider' ? (
              <ContextMenuSeparator key={index} />
            ) : (
              <ContextMenuItem
                key={item.id}
                variant={item.variant}
                disabled={!item.enabled}
                onSelect={() => void execute(item, context)}
              >
                {item.title}
              </ContextMenuItem>
            ),
          )}
          {showCatalog && (
            <ContextMenuSub>
              <ContextMenuSubTrigger disabled={!groups.length}>Add node</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <CatalogMenu entries={groups} onAdd={onAdd} />
              </ContextMenuSubContent>
            </ContextMenuSub>
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
