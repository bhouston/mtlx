import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ClipboardPaste,
  Copy,
  CopyPlus,
  Group,
  LayoutGrid,
  Maximize,
  Plus,
  Redo2,
  RotateCcw,
  Scissors,
  Search,
  Trash2,
  Undo2,
  Unplug,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { EditorSession, EditorSnapshot } from 'mtlx-core/session';
import { useEditorSession } from './useEditorSession.js';
import {
  autoLayout,
  projectGraph,
  type GraphEdge,
  type GraphNode,
  type MaterialXDocument,
  type MaterialXElement,
  type MaterialXNodeSpec,
  type Point,
} from './model.js';

/** Tag on the clipboard JSON so paste can tell node data from other text. */
export const MATERIALX_CLIPBOARD_TYPE = 'mtlx-editor/nodes';
/** A right-clicked port, or the input end of a right-clicked wire. */
export type WireTarget = { node: string; side: 'output' | 'input'; name: string };
export type GraphProjection = { nodes: GraphNode[]; edges: GraphEdge[] };

/** Everything a command may read or act on. Surfaces build it from the session; menus add where they opened. */
export interface CommandContext {
  session: EditorSession;
  snapshot: EditorSnapshot;
  projection: GraphProjection;
  editable: boolean;
  /** Nodes the command applies to: the selection, or the right-clicked node. */
  targets: readonly string[];
  /** Canvas point to paste or add at; without one, pasted nodes are nudged from the originals. */
  at?: Point;
  /** Screen point the command was invoked from, for menus that open at the pointer. */
  client?: Point;
  wire?: WireTarget;
  openQuickAdd?: (client: Point) => void;
  /** The mounted canvas for this session, when one is showing it. */
  canvas?: CanvasActions;
}
/** What a canvas offers commands that live outside it, such as the floating toolbar. */
export interface CanvasActions {
  addNode: () => void;
  /** Frames the given nodes, or everything when none are given. */
  fitView: (nodeIds?: readonly string[]) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}
const canvases = new Map<EditorSession, CanvasActions>();
const canvasListeners = new Set<() => void>();
const subscribeCanvases = (listener: () => void) => {
  canvasListeners.add(listener);
  return () => {
    canvasListeners.delete(listener);
  };
};
/** A canvas announces itself while mounted; the returned function withdraws it. */
export function registerCanvas(session: EditorSession, actions: CanvasActions) {
  canvases.set(session, actions);
  for (const listener of canvasListeners) listener();
  return () => {
    if (canvases.get(session) === actions) canvases.delete(session);
    for (const listener of canvasListeners) listener();
  };
}
export interface CommandState {
  visible: boolean;
  enabled: boolean;
  /** Menu text and tooltip; defaults to the command's label. */
  title: string;
}
/** A stateless action; `state` decides how a menu or toolbar shows it and `run` performs it. */
export interface Command {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** `mod` is Cmd on macOS and Ctrl elsewhere, for example `mod+shift+z`. */
  shortcuts?: readonly string[];
  variant?: 'destructive';
  state?: (context: CommandContext) => Partial<CommandState>;
  run: (context: CommandContext) => unknown;
}
export type CommandEntry = Command | 'divider';
export type ResolvedCommand = Command & CommandState;

export function commandState(command: Command, context: CommandContext): CommandState {
  return { visible: true, enabled: true, title: command.label, ...command.state?.(context) };
}
/** Visible commands in order, with at most one divider between neighbours and none at the ends. */
export function resolveCommands(entries: readonly CommandEntry[], context: CommandContext) {
  const resolved: (ResolvedCommand | 'divider')[] = [];
  for (const entry of entries) {
    if (entry === 'divider') {
      if (resolved.length && resolved.at(-1) !== 'divider') resolved.push('divider');
      continue;
    }
    const state = commandState(entry, context);
    if (state.visible) resolved.push({ ...entry, ...state });
  }
  if (resolved.at(-1) === 'divider') resolved.pop();
  return resolved;
}
/** Run an edit and report its outcome on the session, so any surface can show the failure. */
export function attempt(session: EditorSession, operation: () => unknown) {
  const fail = (failure: unknown) => session.setError(failure instanceof Error ? failure.message : String(failure));
  try {
    const result = operation();
    if (result instanceof Promise) return result.then(() => session.setError(), fail);
    session.setError();
  } catch (failure) {
    fail(failure);
  }
  return undefined;
}
export const execute = (command: Command, context: CommandContext) =>
  attempt(context.session, () => command.run(context));

const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/.test(navigator.platform);
export function matchesShortcut(event: KeyboardEvent, shortcut: string) {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts.pop()!;
  return (
    event.key.toLowerCase() === key &&
    (event.metaKey || event.ctrlKey) === parts.includes('mod') &&
    event.shiftKey === parts.includes('shift') &&
    !event.altKey
  );
}
export function shortcutLabel(shortcut: string) {
  const parts = shortcut.split('+');
  const key = parts.pop()!.toUpperCase();
  if (isMac) return `${parts.includes('mod') ? '⌘' : ''}${parts.includes('shift') ? '⇧' : ''}${key}`;
  return [...parts.map((part) => (part === 'mod' ? 'Ctrl' : 'Shift')), key].join('+');
}

const nodes = (context: CommandContext) => context.projection.nodes.filter((node) => context.targets.includes(node.id));
const whenEditable = (context: CommandContext) => ({ visible: context.editable });
const whenTargets = (context: CommandContext) => ({ visible: context.editable && context.targets.length > 0 });
/** Copy the target nodes to the system clipboard as typed JSON, with their canvas positions baked in. */
async function copyNodes(context: CommandContext) {
  const elements = nodes(context).map((node) => ({
    ...node.element,
    attributes: { ...node.element.attributes, xpos: String(node.position.x), ypos: String(node.position.y) },
  }));
  if (!elements.length) return false;
  await navigator.clipboard.writeText(
    JSON.stringify({ type: MATERIALX_CLIPBOARD_TYPE, version: 1, nodes: elements }, null, 2),
  );
  return true;
}
const wireInfo = ({ projection, wire }: CommandContext) => {
  if (!wire) return undefined;
  const incoming = projection.edges.filter((edge) => edge.target === wire.node && edge.targetHandle === wire.name);
  const outgoing = projection.edges.filter((edge) => edge.source === wire.node && edge.sourceHandle === wire.name);
  const explicit = projection.nodes
    .find((node) => node.id === wire.node)
    ?.element.children.some(
      (child) => ['input', 'parameter'].includes(child.name) && child.attributes.name === wire.name,
    );
  return { wire, incoming, outgoing, explicit: !!explicit };
};

export const undo: Command = {
  id: 'undo',
  label: 'Undo',
  icon: Undo2,
  shortcuts: ['mod+z'],
  state: ({ snapshot, editable }) => ({
    visible: editable,
    enabled: snapshot.canUndo,
    title: snapshot.undoLabel ? `Undo ${snapshot.undoLabel.toLowerCase()}` : 'Undo',
  }),
  run: ({ session }) => session.undo(),
};
export const redo: Command = {
  id: 'redo',
  label: 'Redo',
  icon: Redo2,
  shortcuts: ['mod+shift+z', 'mod+y'],
  state: ({ snapshot, editable }) => ({
    visible: editable,
    enabled: snapshot.canRedo,
    title: snapshot.redoLabel ? `Redo ${snapshot.redoLabel.toLowerCase()}` : 'Redo',
  }),
  run: ({ session }) => session.redo(),
};
export const copy: Command = {
  id: 'copy',
  label: 'Copy',
  icon: Copy,
  shortcuts: ['mod+c'],
  state: whenTargets,
  run: copyNodes,
};
export const cut: Command = {
  id: 'cut',
  label: 'Cut',
  icon: Scissors,
  shortcuts: ['mod+x'],
  state: whenTargets,
  run: async (context) => {
    if (!(await copyNodes(context))) return;
    const { session, snapshot, targets } = context;
    session.transaction('Cut nodes', () => session.graph(snapshot.scope).removeNodes(targets));
  },
};
export const paste: Command = {
  id: 'paste',
  label: 'Paste',
  icon: ClipboardPaste,
  shortcuts: ['mod+v'],
  state: whenEditable,
  run: async ({ session, snapshot, at }) => {
    const data = JSON.parse(await navigator.clipboard.readText()) as { type?: string; nodes?: MaterialXElement[] };
    if (data?.type !== MATERIALX_CLIPBOARD_TYPE || !Array.isArray(data.nodes))
      throw new Error('Clipboard does not hold MaterialX nodes.');
    const placed = data.nodes.filter((node) => node?.attributes?.xpos !== undefined);
    const origin = {
      x: Math.min(...placed.map((node) => Number(node.attributes.xpos))),
      y: Math.min(...placed.map((node) => Number(node.attributes.ypos))),
    };
    const offset = at && placed.length ? { x: at.x - origin.x, y: at.y - origin.y } : { x: 40, y: 40 };
    session.select(session.graph(snapshot.scope).pasteNodes(data.nodes, offset));
  },
};
export const duplicate: Command = {
  id: 'duplicate',
  label: 'Duplicate',
  icon: CopyPlus,
  shortcuts: ['mod+d'],
  state: whenTargets,
  run: (context) => {
    const { session, snapshot } = context;
    const sources = nodes(context);
    if (!sources.length) return;
    const graph = session.graph(snapshot.scope);
    session.transaction(sources.length === 1 ? 'Clone node' : 'Clone nodes', () => {
      const clones = sources.map((source) => {
        const cloned = graph.cloneNode(source.id);
        session.layout.moveNodes(
          { [cloned]: { x: source.position.x + 40, y: source.position.y + 40 } },
          snapshot.scope,
        );
        return cloned;
      });
      session.select(clones);
    });
  },
};
export const group: Command = {
  id: 'group',
  label: 'Group',
  icon: Group,
  shortcuts: ['mod+g'],
  state: ({ snapshot, targets, editable }) => ({ visible: editable && !snapshot.scope && targets.length > 0 }),
  run: ({ session, snapshot, targets }) =>
    session.transaction('Group nodes', () => session.select([session.graph(snapshot.scope).groupNodes(targets)])),
};
export const remove: Command = {
  id: 'delete',
  label: 'Delete',
  icon: Trash2,
  variant: 'destructive',
  state: whenTargets,
  run: ({ session, snapshot, targets }) => session.graph(snapshot.scope).removeNodes(targets),
};
/** Opens the searchable node picker; only surfaces that can place a node offer it. */
export const search: Command = {
  id: 'search',
  label: 'Search nodes…',
  icon: Search,
  state: ({ wire, targets, openQuickAdd, client, editable }) => ({
    visible: editable && !wire && !targets.length && !!openQuickAdd && !!client,
  }),
  run: ({ openQuickAdd, client }) => openQuickAdd!(client!),
};
export const disconnect: Command = {
  id: 'disconnect',
  label: 'Disconnect',
  icon: Unplug,
  variant: 'destructive',
  state: (context) => {
    const info = wireInfo(context);
    if (!info) return { visible: false };
    const count = info.wire.side === 'output' ? info.outgoing.length : info.incoming.length;
    return { visible: count > 0, title: count > 1 ? `Disconnect ${count} wires` : 'Disconnect' };
  },
  run: (context) => {
    const { session, snapshot } = context;
    const { wire, outgoing } = wireInfo(context)!;
    const graph = session.graph(snapshot.scope);
    if (wire.side === 'input') return graph.disconnectInput(wire.node, wire.name);
    session.transaction('Disconnect inputs', () => {
      for (const edge of outgoing) graph.disconnectInput(edge.target, edge.targetHandle ?? 'in');
    });
  },
};
export const reset: Command = {
  id: 'reset',
  label: 'Reset to default',
  icon: RotateCcw,
  state: (context) => {
    const info = wireInfo(context);
    return { visible: !!info && info.wire.side === 'input' && info.explicit && !info.incoming.length };
  },
  run: ({ session, snapshot, wire }) => session.graph(snapshot.scope).resetInput(wire!.node, wire!.name),
};
/** Placeholder so a right-clicked bare port still opens a menu. */
export const notConnected: Command = {
  id: 'not-connected',
  label: 'Not connected',
  state: (context) => {
    const info = wireInfo(context);
    const resettable = info && info.wire.side === 'input' && info.explicit && !info.incoming.length;
    return { visible: !!info && !info.incoming.length && !info.outgoing.length && !resettable, enabled: false };
  },
  run: () => {},
};

/** Canvas commands; they hide until a canvas for the session mounts. */
export const addNode: Command = {
  id: 'add-node',
  label: 'Add node',
  icon: Plus,
  state: ({ canvas, editable }) => ({ visible: editable && !!canvas }),
  run: ({ canvas }) => canvas!.addNode(),
};
export const zoomIn: Command = {
  id: 'zoom-in',
  label: 'Zoom in',
  icon: ZoomIn,
  state: ({ canvas }) => ({ visible: !!canvas }),
  run: ({ canvas }) => canvas!.zoomIn(),
};
export const zoomOut: Command = {
  id: 'zoom-out',
  label: 'Zoom out',
  icon: ZoomOut,
  state: ({ canvas }) => ({ visible: !!canvas }),
  run: ({ canvas }) => canvas!.zoomOut(),
};
export const fitView: Command = {
  id: 'fit-view',
  label: 'Fit view',
  icon: Maximize,
  state: ({ canvas, targets }) => ({ visible: !!canvas, title: targets.length ? 'Fit selection' : 'Fit view' }),
  run: ({ canvas, targets }) => canvas!.fitView(targets),
};
export const arrange: Command = {
  id: 'arrange',
  label: 'Arrange',
  icon: LayoutGrid,
  state: ({ editable, projection }) => ({
    visible: editable,
    enabled: projection.nodes.length > 0,
    title: 'Arrange nodes by data flow',
  }),
  run: ({ session, snapshot, projection, canvas }) => {
    session.layout.moveNodes(autoLayout(projection.nodes, projection.edges), snapshot.scope);
    requestAnimationFrame(() => canvas?.fitView());
  },
};

export const TOOLBAR_COMMANDS: readonly CommandEntry[] = [
  addNode,
  'divider',
  undo,
  redo,
  'divider',
  cut,
  copy,
  paste,
  'divider',
  group,
  'divider',
  remove,
  'divider',
  zoomIn,
  zoomOut,
  fitView,
  arrange,
];
export const CONTEXT_MENU_COMMANDS: readonly CommandEntry[] = [
  disconnect,
  reset,
  notConnected,
  copy,
  cut,
  paste,
  'divider',
  search,
  'divider',
  group,
  'divider',
  remove,
];
export const SHORTCUT_COMMANDS: readonly Command[] = [undo, redo, cut, copy, paste, duplicate, group];

/** The session's current graph as a command context. Each surface memoizes its own projection. */
export function useCommandContext(session: EditorSession, options: { editable?: boolean } = {}): CommandContext {
  const snapshot = useEditorSession(session);
  const document = snapshot.document as MaterialXDocument;
  const catalog = session.getCatalog() as MaterialXNodeSpec[];
  const { scope, selection } = snapshot;
  const projection = useMemo(() => projectGraph(document, scope, catalog), [document, scope, catalog]);
  const editable = options.editable ?? true;
  const canvas = useSyncExternalStore(
    subscribeCanvases,
    () => canvases.get(session),
    () => undefined,
  );
  return useMemo(
    () => ({ session, snapshot, projection, editable, targets: selection, canvas }),
    [session, snapshot, projection, editable, selection, canvas],
  );
}
/** Window-level shortcuts for the session's commands, outside text fields. Mount once per page. */
export function useCommandShortcuts(
  session: EditorSession,
  options: { editable?: boolean; commands?: readonly Command[] } = {},
) {
  const context = useCommandContext(session, options);
  const latest = useRef(context);
  useEffect(() => {
    latest.current = context;
  });
  const commands = options.commands ?? SHORTCUT_COMMANDS;
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const current = latest.current;
      if (!current.editable || event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const command = commands.find((candidate) => candidate.shortcuts?.some((key) => matchesShortcut(event, key)));
      if (!command) return;
      // Selected text keeps the browser's own copy and cut.
      if ((command.id === 'copy' || command.id === 'cut') && window.getSelection()?.toString()) return;
      const state = commandState(command, current);
      if (!state.visible || !state.enabled) return;
      event.preventDefault();
      void execute(command, current);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [commands]);
}
