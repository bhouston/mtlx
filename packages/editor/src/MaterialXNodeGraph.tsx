import { isStructural, structuralSpecs, type EditorSession } from 'mtlx-core/session';
import { useEditorSession } from './useEditorSession.js';
import { NodeParameterEditor } from './NodeParameterEditor.js';
import { ParameterResourcesContext, type ParameterResources } from './parameter-editors.js';
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import {
  Background,
  Controls,
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
  autoLayout,
  graphScopes,
  projectGraph,
  type EditorMode,
  type GraphConnection,
  type MaterialXDocument,
  type MaterialXNodeSpec,
} from './model.js';
import { validateGraph } from './validation.js';
import { socketColor, socketTypes } from './socket-colors.js';
import { MATERIALX_NODE_MIME } from './MaterialXNodeLib.js';
import { GraphContextMenu } from './GraphContextMenu.js';
import { QuickAddMenu } from './QuickAddMenu.js';
import { isNodeDefinition, type NodeDefinition } from './node-catalog-tree.js';
import { nodeTypes, type FlowNode } from './MaterialNode.js';
import { edgeTypes, MaterialConnectionLine } from './MaterialEdge.js';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb.js';

const EMPTY_RESOURCES: ParameterResources = { files: [] };
type Point = { x: number; y: number };
type LooseEnd = { node: string; handle: string; side: 'output' | 'input'; type?: string };
/** A right-clicked port, or the input end of a right-clicked wire. */
type WireTarget = { node: string; side: 'output' | 'input'; name: string };
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
  scope?: string;
  onScopeChange?: (scope: string) => void;
  className?: string;
  /** React Flow chrome (controls, background) follows this; the editor's own colors follow CSS tokens. */
  colorMode?: ColorMode;
  /** Rendered over the canvas, for example a material preview. */
  children?: ReactNode;
  /** Package files offered by filename inputs, and an optional upload hook. */
  resources?: ParameterResources;
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
  document,
  fileName,
  session,
  mode = 'edit',
  scope = '',
  catalog,
  className = '',
  colorMode = 'system',
  children,
  resources,
  path,
  onNavigate,
}: MaterialXNodeGraphProps & {
  document: MaterialXDocument;
  catalog: MaterialXNodeSpec[];
  path: string[];
  onNavigate: (path: string[]) => void;
}) {
  // Menus offer a node graph at the root and interface ports inside one, alongside the definitions.
  const menuCatalog = useMemo(
    () => [...catalog, ...structuralSpecs.filter((spec) => (spec.category === 'nodegraph') === !scope)],
    [catalog, scope],
  );
  const projection = useMemo(() => projectGraph(document, scope, catalog), [document, scope, catalog]);
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
  /** Selected node ids in selection order; the inspector shows the last one. */
  const [selected, setSelected] = useState<readonly string[]>([]);
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
  const [error, setError] = useState('');
  const [context, setContext] = useState<{ nodeId?: string; wire?: WireTarget; position: Point; client: Point }>({
    position: { x: 0, y: 0 },
    client: { x: 0, y: 0 },
  });
  const editable = mode === 'edit';
  const operations = session.graph(scope);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const canvas = useRef<HTMLDivElement>(null);
  /** A wire released on empty canvas remembers its loose end so the added node connects to it. */
  const [quickAdd, setQuickAdd] = useState<{ at: Point; position: Point; from?: LooseEnd }>();
  const openQuickAdd = (client: Point, from?: LooseEnd) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect || !editable) return;
    const at = { x: Math.max(0, client.x - rect.left), y: Math.max(0, client.y - rect.top) };
    setQuickAdd({ at, position: screenToFlowPosition(client), from });
  };
  const nodeCount = projection.nodes.length;
  // React Flow fits on init; a container sized later (hidden tabs, mobile) refits once it becomes visible.
  useEffect(() => {
    const element = canvas.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    let sized = false;
    const observer = new ResizeObserver(([entry]) => {
      const visible = !!entry && entry.contentRect.width > 0 && entry.contentRect.height > 0;
      if (visible && !sized) requestAnimationFrame(() => void fitView({ padding: 0.15 }));
      sized = visible;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [fitView]);
  // Node data is memoized on the projection, so port menus reach the latest openContext through a ref.
  const portContext = useRef<(event: { clientX: number; clientY: number }, wire: WireTarget) => void>(() => {});
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
            onPortContextMenu: (event, side, name) => {
              event.stopPropagation();
              portContext.current(event, { node: graph.id, side, name });
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
    if (!editable) return;
    try {
      operation();
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  };
  const add = (spec: NodeDefinition, position: Point) =>
    commit(() =>
      session.transaction('Add node', () => {
        const id = operations.addNode({ definition: spec.nodeDefName });
        session.layout.moveNodes({ [id]: position }, scope);
        setSelected([id]);
      }),
    );
  const duplicate = (ids: readonly string[]) => {
    const sources = projection.nodes.filter((node) => ids.includes(node.id));
    if (!sources.length) return;
    commit(() =>
      session.transaction(sources.length === 1 ? 'Clone node' : 'Clone nodes', () => {
        const clones = sources.map((source) => {
          const cloned = operations.cloneNode(source.id);
          session.layout.moveNodes({ [cloned]: { x: source.position.x + 40, y: source.position.y + 40 } }, scope);
          return cloned;
        });
        setSelected(clones);
      }),
    );
  };
  /** The nodes a node-targeted action applies to: the whole selection when the target is part of it. */
  const targets = (nodeId: string) => (selected.includes(nodeId) ? selected : [nodeId]);
  const group = () => {
    if (!selected.length || scope) return;
    commit(() =>
      session.transaction('Group nodes', () => {
        setSelected([operations.groupNodes(selected)]);
      }),
    );
  };
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
        setSelected([id]);
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
    if (nodeId ? !selected.includes(nodeId) : selected.length) setSelected(nodeId ? [nodeId] : []);
  };
  useEffect(() => {
    portContext.current = (event, wire) => openContext(event, wire.node, wire);
  });
  // The pane never takes focus, so shortcuts apply while the pointer or focus is on the canvas.
  const shortcuts = useRef<(event: KeyboardEvent) => void>(() => {});
  const onShortcut = (event: KeyboardEvent) => {
    const element = canvas.current;
    if (!editable || quickAdd || !element) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (!element.matches(':hover') && !element.contains(target)) return;
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key.toLowerCase() === 'd' && selected.length) duplicate(selected);
    else if (meta && event.key.toLowerCase() === 'g' && !scope) group();
    else if (event.shiftKey && !meta && event.key.toLowerCase() === 'a') {
      const rect = element.getBoundingClientRect();
      openQuickAdd({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else if (event.key === 'f' && !meta)
      void fitView({
        padding: 0.15,
        duration: 200,
        ...(selected.length ? { nodes: selected.map((id) => ({ id })) } : {}),
      });
    else if (event.key === 'Escape') setSelected([]);
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
  /** Disconnect and reset actions for the right-clicked wire or port, when they apply. */
  const wireActions = (wire: WireTarget) => {
    const incoming = projection.edges.filter((edge) => edge.target === wire.node && edge.targetHandle === wire.name);
    const outgoing = projection.edges.filter((edge) => edge.source === wire.node && edge.sourceHandle === wire.name);
    const explicit = projection.nodes
      .find((node) => node.id === wire.node)
      ?.element.children.some(
        (child) => ['input', 'parameter'].includes(child.name) && child.attributes.name === wire.name,
      );
    if (wire.side === 'output')
      return {
        label: outgoing.length > 1 ? `Disconnect ${outgoing.length} wires` : 'Disconnect',
        onDisconnect: outgoing.length
          ? () =>
              commit(() =>
                session.transaction('Disconnect inputs', () => {
                  for (const edge of outgoing) operations.disconnectInput(edge.target, edge.targetHandle ?? 'in');
                }),
              )
          : undefined,
      };
    return {
      label: 'Disconnect',
      onDisconnect: incoming.length ? () => commit(() => operations.disconnectInput(wire.node, wire.name)) : undefined,
      onReset:
        explicit && !incoming.length ? () => commit(() => operations.resetInput(wire.node, wire.name)) : undefined,
    };
  };
  const inspected = projection.nodes.find((node) => node.id === selected.at(-1));
  const rootLabel = fileName?.split(/[\\/]/).at(-1) || 'material.mtlx';
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
          {editable && (
            <div className="mtlx-toolbar-overlay nodrag nopan">
              <button
                type="button"
                className="mtlx-toolbar-button"
                title="Add node"
                onClick={() => {
                  const rect = canvas.current?.getBoundingClientRect();
                  if (rect) openQuickAdd({ x: rect.left + rect.width / 2, y: rect.top + 80 });
                }}
              >
                <Plus size={14} aria-hidden="true" />
                Add node
              </button>
              <button
                type="button"
                className="mtlx-toolbar-button"
                title="Arrange nodes by data flow"
                disabled={!nodeCount}
                onClick={() =>
                  commit(() => {
                    session.layout.moveNodes(autoLayout(projection.nodes, projection.edges), scope);
                    requestAnimationFrame(() => void fitView({ padding: 0.15, duration: 200 }));
                  })
                }
              >
                <LayoutGrid size={14} aria-hidden="true" />
                Arrange
              </button>
            </div>
          )}
          {/* The menu trigger wraps only the flow, so right-clicking the overlays never opens it. */}
          <GraphContextMenu
            catalog={menuCatalog}
            editable={editable}
            nodeId={context.nodeId}
            onAdd={(spec) => add(spec, context.position)}
            onSearch={() => openQuickAdd(context.client)}
            onClone={() => {
              if (context.nodeId) duplicate(targets(context.nodeId));
            }}
            onDelete={() => {
              if (context.nodeId) commit(() => operations.removeNodes(targets(context.nodeId!)));
            }}
            onGroup={scope ? undefined : group}
            wire={context.wire && wireActions(context.wire)}
          >
            <div className="mtlx-flow">
              <ReactFlow<FlowNode>
                nodes={nodes}
                edges={edges}
                connectionLineComponent={MaterialConnectionLine}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
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
                  if (selections.length)
                    setSelected((current) => {
                      const next = current.filter(
                        (id) => !selections.some((change) => change.id === id && !change.selected),
                      );
                      for (const change of selections)
                        if (change.selected && !next.includes(change.id)) next.push(change.id);
                      return next;
                    });
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
                onPaneClick={() => setSelected([])}
                onNodeContextMenu={(event, node) => openContext(event, node.id)}
                onSelectionContextMenu={(event, chosen) => openContext(event, chosen[0]?.id)}
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
                <Controls showInteractive={false} />
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
      <ParameterResourcesContext.Provider value={resources ?? EMPTY_RESOURCES}>
        <NodeParameterEditor
          key={`${scope}/${inspected?.id ?? ''}`}
          graph={operations}
          node={inspected}
          projection={projection}
          editable={editable}
          commit={commit}
          onRename={(name) =>
            commit(() => {
              operations.renameNode(inspected!.id, name);
              setSelected([name]);
            })
          }
        />
      </ParameterResourcesContext.Provider>
    </section>
  );
}
/** Renders and edits one scope of the session's document; the `ReactFlowProvider` is created internally. */
export function MaterialXNodeGraph(props: MaterialXNodeGraphProps) {
  const snapshot = useEditorSession(props.session);
  // Projection utilities take MaterialXDocument; the session's frozen tree is only ever read here.
  const document = snapshot.document as MaterialXDocument;
  const catalog = props.session.getCatalog() as MaterialXNodeSpec[];
  const scopes = graphScopes(document);
  const externalScope = scopes.includes(props.scope ?? '') ? (props.scope ?? '') : '';
  const defaultPath = [
    '',
    ...externalScope
      .split('/')
      .filter(Boolean)
      .map((_, index, parts) => parts.slice(0, index + 1).join('/')),
  ];
  const [navigation, setNavigation] = useState({ externalScope, path: defaultPath });
  const validPath = navigation.path.every((value) => scopes.includes(value));
  const path = navigation.externalScope === externalScope && validPath ? navigation.path : defaultPath;
  const scope = path[path.length - 1]!;
  const onNavigate = (next: string[]) => {
    const nextScope = next[next.length - 1]!;
    setNavigation({ externalScope: props.onScopeChange ? nextScope : externalScope, path: next });
    props.onScopeChange?.(nextScope);
  };
  return (
    <ReactFlowProvider key={scope}>
      <Graph {...props} document={document} catalog={catalog} scope={scope} path={path} onNavigate={onNavigate} />
    </ReactFlowProvider>
  );
}
