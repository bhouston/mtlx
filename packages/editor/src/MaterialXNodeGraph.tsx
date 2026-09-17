import { isStructural, structuralSpecs, type EditorSession } from 'mtlx-core/session';
import { useEditorSession } from './useEditorSession.js';
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type ColorMode,
  type FinalConnectionState,
  type Connection,
  type Edge,
} from '@xyflow/react';
import {
  graphScopes,
  type EditorMode,
  type GraphConnection,
  type MaterialXDocument,
  type MaterialXNodeSpec,
  type Point,
} from './model.js';
import { validateGraph } from './validation.js';
import { socketColor, socketTypes } from './socket-colors.js';
import { MATERIALX_NODE_MIME } from './MaterialXNodeLib.js';
import { GraphContextMenu } from './GraphContextMenu.js';
import { QuickAddMenu } from './QuickAddMenu.js';
import { isNodeDefinition, type NodeDefinition } from './node-catalog-tree.js';
import { nodeTypes, type FlowNode } from './MaterialNode.js';
import { edgeTypes, MaterialConnectionLine } from './MaterialEdge.js';
import { attempt, registerCanvas, useCommandContext, type WireTarget } from './commands.js';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb.js';

export { MATERIALX_CLIPBOARD_TYPE } from './commands.js';
type LooseEnd = { node: string; handle: string; side: 'output' | 'input'; type?: string };
/** Definitions that could take the loose end of a dragged wire. */
const accepts = (from?: LooseEnd) => (spec: MaterialXNodeSpec) => {
  if (!from?.type) return true;
  return from.side === 'output'
    ? [...spec.inputs, ...spec.parameters].some((port) => !port.type || port.type === from.type)
    : spec.outputs.some((port) => !port.type || port.type === from.type);
};
export interface MaterialXNodeGraphProps {
  /** Shared editing state; create it with `createEditorSession` from `mtlx-core/session`. */
  session: EditorSession;
  /** Material file name or path, shown at the root of the breadcrumbs. */
  fileName?: string;
  mode?: EditorMode;
  /** Controls the session's scope; without it the session owns navigation. */
  scope?: string;
  onScopeChange?: (scope: string) => void;
  className?: string;
  /** React Flow chrome (controls, background) follows this; the editor's own colors follow CSS tokens. */
  colorMode?: ColorMode;
  /** Rendered over the canvas, for example a material preview. */
  children?: ReactNode;
}
function asConnection(connection: Connection | Edge): GraphConnection {
  return {
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle ?? 'out',
    targetHandle: connection.targetHandle ?? 'in',
  };
}
function Graph({
  fileName,
  session,
  mode = 'edit',
  className = '',
  colorMode = 'system',
  children,
  path,
  onNavigate,
}: MaterialXNodeGraphProps & {
  path: string[];
  onNavigate: (path: string[]) => void;
}) {
  const editable = mode === 'edit';
  const commands = useCommandContext(session, { editable });
  const { snapshot, projection } = commands;
  const document = snapshot.document as MaterialXDocument;
  const catalog = session.getCatalog() as MaterialXNodeSpec[];
  const scope = snapshot.scope;
  const selected = snapshot.selection;
  // Menus offer a node graph at the root and interface ports inside one, alongside the definitions.
  const menuCatalog = useMemo(
    () => [...catalog, ...structuralSpecs.filter((spec) => (spec.category === 'nodegraph') === !scope)],
    [catalog, scope],
  );
  const portType = useMemo(() => socketTypes(projection.nodes, projection.edges), [projection]);
  const diagnostics = useMemo(
    () => validateGraph(document, scope, catalog, projection),
    [document, scope, catalog, projection],
  );
  const invalidEdges = useMemo(
    () => new Set(diagnostics.flatMap((issue) => (issue.edgeId ? [issue.edgeId] : []))),
    [diagnostics],
  );
  /** React Flow only reports edge selection through change events, so the graph keeps the selected ids. */
  const [selectedEdges, setSelectedEdges] = useState<ReadonlySet<string>>(new Set());
  const edges = useMemo(
    () =>
      projection.edges.map((edge): Edge => {
        const outputs = projection.nodes.find((node) => node.id === edge.source)?.outputs;
        return {
          ...edge,
          type: 'materialx',
          data: { invalid: invalidEdges.has(edge.id) },
          sourceHandle:
            outputs?.find((port) => port.name === edge.sourceHandle)?.name ?? outputs?.[0]?.name ?? edge.sourceHandle,
          selected: selectedEdges.has(edge.id),
          className: invalidEdges.has(edge.id) ? 'mtlx-edge-error' : undefined,
          style: {
            stroke: socketColor(portType(edge.source, 'output', edge.sourceHandle)),
            strokeWidth: 2,
          },
        };
      }),
    [projection, portType, invalidEdges, selectedEdges],
  );
  const [showAll, setShowAll] = useState<ReadonlySet<string>>(new Set());
  const toggleInputs = useCallback(
    (id: string) =>
      setShowAll((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    [],
  );
  const [context, setContext] = useState<{ nodeId?: string; wire?: WireTarget; position: Point; client: Point }>({
    position: { x: 0, y: 0 },
    client: { x: 0, y: 0 },
  });
  const operations = session.graph(scope);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const canvas = useRef<HTMLDivElement>(null);
  /** A wire released on empty canvas remembers its loose end so the added node connects to it. */
  const [quickAdd, setQuickAdd] = useState<{ at: Point; position: Point; from?: LooseEnd }>();
  const openQuickAdd = (client: Point, from?: LooseEnd) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect || !editable) return;
    const at = { x: Math.max(0, client.x - rect.left), y: Math.max(0, client.y - rect.top) };
    setQuickAdd({ at, position: screenToFlowPosition(client), from });
  };
  /** Frames the given nodes, or everything when none are given. */
  const fit = (nodeIds?: readonly string[]) =>
    void fitView({
      padding: 0.15,
      duration: 200,
      ...(nodeIds?.length ? { nodes: nodeIds.map((id) => ({ id })) } : {}),
    });
  // The floating toolbar lives outside the canvas, so the canvas lends it these through the session.
  const canvasActions = useRef({ openQuickAdd, fit });
  useEffect(() => {
    canvasActions.current = { openQuickAdd, fit };
  });
  useEffect(
    () =>
      registerCanvas(session, {
        addNode: () => {
          const rect = canvas.current?.getBoundingClientRect();
          if (rect) canvasActions.current.openQuickAdd({ x: rect.left + rect.width / 2, y: rect.top + 80 });
        },
        fitView: (nodeIds) => canvasActions.current.fit(nodeIds),
        zoomIn: () => void zoomIn({ duration: 200 }),
        zoomOut: () => void zoomOut({ duration: 200 }),
      }),
    [session, zoomIn, zoomOut],
  );
  // React Flow fits on init; any later container resize (hidden tabs, mobile, editor layout switch) refits.
  useEffect(() => {
    const element = canvas.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0)
        requestAnimationFrame(() => void fitView({ padding: 0.15 }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [fitView]);
  // A port right-click notes its wire here; the node's context-menu handler, which follows in the same
  // dispatch, opens the menu with it. Stopping propagation instead would also stop the menu trigger.
  const pendingWire = useRef<WireTarget>(undefined);
  const takeWire = () => {
    const wire = pendingWire.current;
    pendingWire.current = undefined;
    return wire;
  };
  const projectedNodes = useMemo(
    () =>
      projection.nodes.map(
        (graph): FlowNode => ({
          id: graph.id,
          type: 'materialx',
          position: graph.position,
          data: {
            graph,
            errors: diagnostics.filter((issue) => issue.nodeIds.includes(graph.id)).map((issue) => issue.message),
            portType,
            mode: editable ? 'edit' : 'view',
            showAll: showAll.has(graph.id),
            onToggleInputs: () => toggleInputs(graph.id),
            onPortContextMenu: (_, side, name) => {
              pendingWire.current = { node: graph.id, side, name };
            },
            onExpand:
              graph.compoundScope !== undefined && !path.includes(graph.compoundScope)
                ? () => onNavigate([...path, graph.compoundScope!])
                : undefined,
          },
          selected: selected.includes(graph.id),
        }),
      ),
    [projection, portType, diagnostics, editable, selected, showAll, toggleInputs, path, onNavigate],
  );
  // React Flow owns transient node state (drag positions, measurements); each new projection replaces it.
  const [nodes, setNodes, onNodesChange] = useNodesState(projectedNodes);
  useLayoutEffect(() => setNodes(projectedNodes), [projectedNodes, setNodes]);
  const commit = (operation: () => unknown) => {
    if (editable) attempt(session, operation);
  };
  const add = (spec: NodeDefinition, position: Point) =>
    commit(() =>
      session.transaction('Add node', () => {
        const id = operations.addNode({ definition: spec.nodeDefName });
        session.layout.moveNodes({ [id]: position }, scope);
        session.select([id]);
      }),
    );
  const addAndConnect = (spec: NodeDefinition) => {
    const pending = quickAdd;
    setQuickAdd(undefined);
    if (!pending) return;
    commit(() =>
      session.transaction('Add node', () => {
        const id = operations.addNode({ definition: spec.nodeDefName });
        session.layout.moveNodes({ [id]: pending.position }, scope);
        const from = pending.from;
        // A new interface port takes the type of the wire that created it.
        if (from?.type && isStructural(spec)) operations.setInterfacePort(id, { type: from.type });
        if (from?.side === 'output') {
          const inputs = operations.getInputs(id);
          const port = inputs.find((input) => input.type === from.type) ?? inputs[0];
          if (port) operations.connect({ node: from.node, output: from.handle }, { node: id, input: port.name });
        } else if (from?.side === 'input') {
          const outputs = operations.getOutputs(id);
          const port = outputs.find((output) => output.type === from.type) ?? outputs[0];
          if (port) operations.connect({ node: id, output: port.name }, { node: from.node, input: from.handle });
        }
        session.select([id]);
      }),
    );
  };
  const onConnectEnd = (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
    if (state.isValid || state.toNode || !state.fromNode || !state.fromHandle) return;
    const point = 'clientX' in event ? event : event.changedTouches[0];
    if (!point) return;
    const side = state.fromHandle.type === 'source' ? 'output' : 'input';
    const handle = state.fromHandle.id ?? (side === 'output' ? 'out' : 'in');
    openQuickAdd(
      { x: point.clientX, y: point.clientY },
      { node: state.fromNode.id, handle, side, type: portType(state.fromNode.id, side, handle) },
    );
  };
  /** Records where the context menu opened; right-clicking inside a multi-selection keeps it. */
  const openContext = (event: { clientX: number; clientY: number }, nodeId?: string, wire?: WireTarget) => {
    if (!editable) return;
    const client = { x: event.clientX, y: event.clientY };
    setContext({ nodeId, wire, position: screenToFlowPosition(client), client });
    if (nodeId ? !selected.includes(nodeId) : selected.length) session.select(nodeId ? [nodeId] : []);
  };
  /** Canvas-only keys; editing shortcuts come from `useCommandShortcuts`, which the host mounts once. */
  const shortcuts = useRef<(event: KeyboardEvent) => void>(() => {});
  const onShortcut = (event: KeyboardEvent) => {
    const element = canvas.current;
    if (!editable || quickAdd || !element || event.metaKey || event.ctrlKey) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (!element.matches(':hover') && !element.contains(target)) return;
    if (event.shiftKey && event.key.toLowerCase() === 'a') {
      const rect = element.getBoundingClientRect();
      openQuickAdd({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else if (event.key === 'f') fit(selected);
    else if (event.key === 'Escape') session.select([]);
    else return;
    event.preventDefault();
  };
  useEffect(() => {
    shortcuts.current = onShortcut;
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => shortcuts.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
  const rootLabel = fileName?.split(/[\\/]/).at(-1) || 'material.mtlx';
  const error = snapshot.error;
  return (
    <section className={`mtlx-editor mtlx-graph ${className}`} aria-label="MaterialX node graph">
      <div className="mtlx-graph-main">
        <div
          ref={canvas}
          className="mtlx-canvas"
          onDoubleClick={(event) => {
            if ((event.target as Element).classList.contains('react-flow__pane'))
              openQuickAdd({ x: event.clientX, y: event.clientY });
          }}
          onDragOver={(event) => {
            if (editable && event.dataTransfer.types.includes(MATERIALX_NODE_MIME)) {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={(event) => {
            const id = event.dataTransfer.getData(MATERIALX_NODE_MIME);
            if (!id || !editable) return;
            event.preventDefault();
            event.stopPropagation();
            const spec = menuCatalog.find((candidate) => candidate.nodeDefName === id);
            if (spec && isNodeDefinition(spec)) add(spec, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
          }}
        >
          <Breadcrumb aria-label="Graph breadcrumb" className="mtlx-breadcrumb-overlay nodrag nopan">
            <BreadcrumbList>
              {path.map((value, index) => (
                <Fragment key={value}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === path.length - 1 ? (
                      <BreadcrumbPage>{value.split('/').at(-1) || rootLabel}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <button type="button" onClick={() => onNavigate(path.slice(0, index + 1))}>
                          {value.split('/').at(-1) || rootLabel}
                        </button>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          {/* The menu trigger wraps only the flow, so right-clicking the overlays never opens it. */}
          <GraphContextMenu
            catalog={menuCatalog}
            context={{
              ...commands,
              // Pasting onto a node nudges from the originals; pasting on the canvas lands at the pointer.
              at: context.nodeId ? undefined : context.position,
              client: context.client,
              wire: context.wire,
              openQuickAdd,
            }}
            onAdd={(spec) => add(spec, context.position)}
          >
            <div className="mtlx-flow">
              <ReactFlow<FlowNode>
                nodes={nodes}
                edges={edges}
                connectionLineComponent={MaterialConnectionLine}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
                colorMode={colorMode}
                zoomOnDoubleClick={false}
                minZoom={0.08}
                snapToGrid
                snapGrid={[10, 10]}
                nodesDraggable={editable}
                nodesConnectable={editable}
                edgesReconnectable={false}
                deleteKeyCode={editable ? ['Delete', 'Backspace'] : null}
                onDelete={({ nodes: deletedNodes, edges: deletedEdges }) =>
                  commit(() =>
                    session.transaction(deletedNodes.length ? 'Delete nodes' : 'Disconnect inputs', () => {
                      operations.removeNodes(deletedNodes.map((deleted) => deleted.id));
                      const remaining = new Set(operations.listNodes().map((remainingNode) => remainingNode.id));
                      for (const edge of deletedEdges) {
                        if (!remaining.has(edge.target)) continue;
                        const input = edge.targetHandle ?? 'in';
                        const source = operations.getConnection({ node: edge.target, input });
                        if (source?.node === edge.source && source.output === (edge.sourceHandle ?? 'out'))
                          operations.disconnectInput(edge.target, input);
                      }
                    }),
                  )
                }
                onNodesChange={(changes) => {
                  const selections = changes.filter((change) => change.type === 'select');
                  if (selections.length) {
                    const next = session
                      .getSnapshot()
                      .selection.filter((id) => !selections.some((change) => change.id === id && !change.selected));
                    for (const change of selections)
                      if (change.selected && !next.includes(change.id)) next.push(change.id);
                    session.select(next);
                  }
                  const positions = Object.fromEntries(
                    changes.flatMap((change) =>
                      change.type === 'position' && change.dragging === false && change.position
                        ? [[change.id, change.position]]
                        : [],
                    ),
                  );
                  if (Object.keys(positions).length) commit(() => session.layout.moveNodes(positions, scope));
                  onNodesChange(changes.filter((change) => change.type !== 'remove'));
                }}
                onEdgesChange={(changes) =>
                  setSelectedEdges((current) => {
                    const next = new Set(current);
                    for (const change of changes)
                      if (change.type === 'select') next[change.selected ? 'add' : 'delete'](change.id);
                    return next;
                  })
                }
                onPaneClick={() => session.select([])}
                onNodeContextMenu={(event, node) => openContext(event, node.id, takeWire())}
                onSelectionContextMenu={(event, chosen) => openContext(event, chosen[0]?.id, takeWire())}
                onPaneContextMenu={(event) => openContext(event)}
                onEdgeContextMenu={(event, edge) =>
                  openContext(event, undefined, { node: edge.target, side: 'input', name: edge.targetHandle ?? 'in' })
                }
                isValidConnection={(candidate) => {
                  const wire = asConnection(candidate);
                  return !operations.checkConnection(
                    { node: wire.source, output: wire.sourceHandle },
                    { node: wire.target, input: wire.targetHandle },
                  );
                }}
                onConnect={(candidate) =>
                  commit(() => {
                    const wire = asConnection(candidate);
                    operations.connect(
                      { node: wire.source, output: wire.sourceHandle },
                      { node: wire.target, input: wire.targetHandle },
                    );
                  })
                }
                onEdgeDoubleClick={(_, edge) =>
                  commit(() => operations.disconnectInput(edge.target, edge.targetHandle ?? 'in'))
                }
                onConnectEnd={onConnectEnd}
              >
                <Background />
              </ReactFlow>
            </div>
          </GraphContextMenu>
          {children && <div className="mtlx-canvas-overlay nodrag nopan nowheel">{children}</div>}
          {quickAdd && (
            <QuickAddMenu
              catalog={menuCatalog}
              at={quickAdd.at}
              accept={accepts(quickAdd.from)}
              placeholder={quickAdd.from ? `Connect ${quickAdd.from.node}.${quickAdd.from.handle} to…` : undefined}
              onAdd={addAndConnect}
              onClose={() => setQuickAdd(undefined)}
            />
          )}
          {(diagnostics.length > 0 || error) && (
            <section className="mtlx-error-log nodrag nopan nowheel" aria-label="Graph errors">
              <h2>Graph errors ({diagnostics.length + (error ? 1 : 0)})</h2>
              {/* Keyboard focus lets users scroll and copy the error log. */}
              {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
              <div role="log" aria-live="polite" tabIndex={0}>
                <pre>{[...diagnostics.map((issue) => issue.message), ...(error ? [error] : [])].join('\n\n')}</pre>
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
/** The breadcrumb trail for a scope when it was not reached by navigating. */
const defaultPath = (scope: string) => [
  '',
  ...scope
    .split('/')
    .filter(Boolean)
    .map((_, index, parts) => parts.slice(0, index + 1).join('/')),
];
/** Renders and edits one scope of the session's document; the `ReactFlowProvider` is created internally. */
export function MaterialXNodeGraph(props: MaterialXNodeGraphProps) {
  const { session } = props;
  const snapshot = useEditorSession(session);
  const scopes = graphScopes(snapshot.document as MaterialXDocument);
  const externalScope = props.scope !== undefined && scopes.includes(props.scope) ? props.scope : undefined;
  useLayoutEffect(() => {
    if (externalScope !== undefined) session.setScope(externalScope);
  }, [externalScope, session]);
  const scope = snapshot.scope;
  // Compound nodes navigate to scopes their path does not spell, so the trail is kept while it leads here.
  const [trail, setTrail] = useState<string[]>([]);
  const path = trail.at(-1) === scope ? trail : defaultPath(scope);
  const onNavigate = (next: string[]) => {
    const nextScope = next[next.length - 1]!;
    setTrail(next);
    session.setScope(nextScope);
    props.onScopeChange?.(nextScope);
  };
  return (
    <ReactFlowProvider key={scope}>
      <Graph {...props} path={path} onNavigate={onNavigate} />
    </ReactFlowProvider>
  );
}
