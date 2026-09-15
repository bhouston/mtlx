import { createEditorSession, isStructural, structuralSpecs, type EditorSession } from 'mtlx-core/session';
import { useEditorSession } from './useEditorSession.js';
import { NodeParameterEditor } from './NodeParameterEditor.js';
import { ParameterResourcesContext, type ParameterResources } from './parameter-editors.js';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, LayoutGrid, Maximize2, Plus } from 'lucide-react';
import {
  Background,
  BaseEdge,
  type EdgeProps,
  getBezierPath,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useConnection,
  useReactFlow,
  type ColorMode,
  type ConnectionLineComponentProps,
  type FinalConnectionState,
  type Node,
  type NodeProps,
  type Connection,
  type Edge,
} from '@xyflow/react';
import {
  autoLayout,
  getNodeCatalog,
  graphScopes,
  projectGraph,
  visibleInputs,
  type EditorMode,
  type GraphConnection,
  type GraphNode,
  type MaterialXDocument,
  type MaterialXNodeSpec,
} from './model.js';
import { validateGraph } from './validation.js';
import { socketColor, socketTypes } from './socket-colors.js';
import { categoryColor } from './node-category-colors.js';
import { MATERIALX_NODE_MIME } from './MaterialXNodeLib.js';
import { GraphContextMenu } from './GraphContextMenu.js';
import { QuickAddMenu } from './QuickAddMenu.js';
import { isNodeDefinition, type NodeDefinition } from './node-catalog-tree.js';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb.js';

type FlowNode = Node<
  {
    errors: string[];
    graph: GraphNode;
    mode: EditorMode;
    portType: ReturnType<typeof socketTypes>;
    onExpand?: () => void;
    /** Whether every input shows; collapsed nodes list only connected or authored inputs. */
    showAll: boolean;
    onToggleInputs: () => void;
  },
  'materialx'
>;
function MaterialNode({ data, selected }: NodeProps<FlowNode>) {
  const { graph, mode, portType } = data;
  // A wire in flight can target any input, so hidden ports reappear for the drag.
  const connecting = useConnection((connection) => connection.inProgress);
  const shown = visibleInputs(graph);
  const hidden = graph.inputs.length - shown.length;
  const inputs = data.showAll || connecting || !hidden ? graph.inputs : shown;
  const accent = categoryColor(graph.definition?.nodeGroup);
  return (
    <div
      className={`mtlx-node ${selected ? 'mtlx-selected' : ''} ${data.errors.length ? 'mtlx-node-error' : ''}`}
      title={data.errors.join('\n') || undefined}
    >
      {data.errors.length > 0 && <span className="mtlx-node-error-label">Error</span>}
      <div
        className="mtlx-node-header"
        style={accent ? { backgroundColor: `${accent}2e`, borderBottom: `1px solid ${accent}` } : undefined}
      >
        <strong>
          {graph.id}
          {graph.type && <span className="mtlx-node-type"> ({graph.type})</span>}
        </strong>
        {data.onExpand && (
          <button
            type="button"
            className="mtlx-expand nodrag nopan"
            aria-label={`Expand ${graph.id}`}
            title="Expand node"
            onClick={(event) => {
              event.stopPropagation();
              data.onExpand?.();
            }}
          >
            <Maximize2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {graph.id !== graph.element.name && <small>{graph.element.name}</small>}
      <div className="mtlx-ports">
        <div>
          {inputs.map((port) => (
            <div
              className="mtlx-port"
              key={port.name}
              title={`${port.name}: ${portType(graph.id, 'input', port.name) ?? port.type ?? 'unknown'}`}
            >
              <Handle
                style={{ background: socketColor(portType(graph.id, 'input', port.name)) }}
                type="target"
                position={Position.Left}
                id={port.name}
                isConnectable={mode === 'edit'}
              />
              <span>{port.name}</span>
            </div>
          ))}
          {hidden > 0 && (
            <button
              type="button"
              className="mtlx-port mtlx-toggle-inputs nodrag nopan"
              aria-expanded={data.showAll}
              onClick={(event) => {
                event.stopPropagation();
                data.onToggleInputs();
              }}
            >
              {data.showAll ? (
                <ChevronDown size={12} aria-hidden="true" />
              ) : (
                <ChevronRight size={12} aria-hidden="true" />
              )}
              {data.showAll ? 'Fewer inputs' : `${hidden} more input${hidden === 1 ? '' : 's'}`}
            </button>
          )}
        </div>
        <div>
          {graph.outputs.map((port) => (
            <div
              className="mtlx-port mtlx-output"
              key={port.name}
              title={`${port.name}: ${portType(graph.id, 'output', port.name) ?? port.type ?? 'unknown'}`}
            >
              <span>{port.name}</span>
              <Handle
                style={{ background: socketColor(portType(graph.id, 'output', port.name)) }}
                type="source"
                position={Position.Right}
                id={port.name}
                isConnectable={mode === 'edit'}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
const nodeTypes = { materialx: MaterialNode };
function MaterialEdge(props: EdgeProps) {
  const [path] = getBezierPath(props);
  return (
    <>
      {props.data?.invalid === true && (
        <path
          className="mtlx-error-outline"
          d={path}
          fill="none"
          stroke="#dc2626"
          strokeWidth={8}
          pointerEvents="none"
        />
      )}
      <BaseEdge
        id={props.id}
        path={path}
        style={props.style}
        markerEnd={props.markerEnd}
        markerStart={props.markerStart}
      />
    </>
  );
}
const edgeTypes = { materialx: MaterialEdge };
function MaterialConnectionLine({
  fromNode,
  connectionStatus,
  fromHandle,
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps<FlowNode>) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
  });
  const type = fromNode.data.portType(
    fromNode.id,
    fromHandle.type === 'source' ? 'output' : 'input',
    fromHandle.id ?? '',
  );
  return (
    <>
      {connectionStatus === 'invalid' && <path d={path} fill="none" stroke="#dc2626" strokeWidth={8} />}
      <path d={path} fill="none" stroke={socketColor(type)} strokeWidth={2} />
    </>
  );
}
const EMPTY_RESOURCES: ParameterResources = { files: [] };
type LooseEnd = { node: string; handle: string; side: 'output' | 'input'; type?: string };
/** Definitions that could take the loose end of a dragged wire. */
const accepts = (from?: LooseEnd) => (spec: MaterialXNodeSpec) => {
  if (!from?.type) return true;
  return from.side === 'output'
    ? [...spec.inputs, ...spec.parameters].some((p) => !p.type || p.type === from.type)
    : spec.outputs.some((p) => !p.type || p.type === from.type);
};
interface GraphViewProps {
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
/** Prefer a shared session. Controlled document/onChange hosts remain supported by an adapter. */
export type MaterialXNodeGraphProps = GraphViewProps &
  (
    | { session: EditorSession; document?: never; onChange?: never; catalog?: never }
    | {
        session?: never;
        document: MaterialXDocument;
        onChange?: (document: MaterialXDocument) => void;
        catalog?: MaterialXNodeSpec[];
      }
  );
interface SessionGraphProps extends GraphViewProps {
  session: EditorSession;
  document: MaterialXDocument;
  catalog: MaterialXNodeSpec[];
}
function asConnection(c: Connection | Edge): GraphConnection {
  return {
    source: c.source,
    target: c.target,
    sourceHandle: c.sourceHandle ?? 'out',
    targetHandle: c.targetHandle ?? 'in',
  };
}
function Graph({
  document,
  fileName,
  session,
  mode = 'edit',
  scope = '',
  catalog: suppliedCatalog,
  className = '',
  colorMode = 'system',
  children,
  resources,
  path,
  onNavigate,
}: SessionGraphProps & { path: string[]; onNavigate: (path: string[]) => void }) {
  const catalog = useMemo(() => suppliedCatalog ?? getNodeCatalog(document), [suppliedCatalog, document]);
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
  const edges = useMemo(
    () =>
      projection.edges.map(
        (edge): Edge => ({
          ...edge,
          type: 'materialx',
          data: { invalid: invalidEdges.has(edge.id) },
          sourceHandle:
            projection.nodes.find((n) => n.id === edge.source)?.outputs.find((p) => p.name === edge.sourceHandle)
              ?.name ??
            projection.nodes.find((n) => n.id === edge.source)?.outputs[0]?.name ??
            edge.sourceHandle,
          className: invalidEdges.has(edge.id) ? 'mtlx-edge-error' : undefined,
          style: {
            stroke: socketColor(portType(edge.source, 'output', edge.sourceHandle)),
            strokeWidth: 2,
          },
        }),
      ),
    [projection, portType, invalidEdges],
  );
  const [selected, setSelected] = useState<string | null>(null);
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
  const [context, setContext] = useState<{
    nodeId?: string;
    position: { x: number; y: number };
    client: { x: number; y: number };
  }>({ position: { x: 0, y: 0 }, client: { x: 0, y: 0 } });
  const editable = mode === 'edit';
  const operations = session.graph(scope);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const canvas = useRef<HTMLDivElement>(null);
  /** A wire released on empty canvas remembers its loose end so the added node connects to it. */
  const [quickAdd, setQuickAdd] = useState<{
    at: { x: number; y: number };
    position: { x: number; y: number };
    from?: LooseEnd;
  }>();
  const openQuickAdd = (client: { x: number; y: number }, from?: NonNullable<typeof quickAdd>['from']) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect || !editable) return;
    const at = { x: Math.max(0, client.x - rect.left), y: Math.max(0, client.y - rect.top) };
    setQuickAdd({ at, position: screenToFlowPosition(client), from });
  };
  const nodeCount = projection.nodes.length;
  useEffect(() => {
    if (!nodeCount) return;
    const frame = requestAnimationFrame(() => void fitView({ padding: 0.15 }));
    return () => cancelAnimationFrame(frame);
  }, [nodeCount, fitView]);
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
            onExpand:
              graph.compoundScope !== undefined && !path.includes(graph.compoundScope)
                ? () => onNavigate([...path, graph.compoundScope!])
                : undefined,
          },
          selected: graph.id === selected,
        }),
      ),
    [projection, portType, diagnostics, editable, selected, showAll, toggleInputs, path, onNavigate],
  );
  const [interaction, setInteraction] = useState({ projection: projectedNodes, nodes: projectedNodes });
  const nodes = interaction.projection === projectedNodes ? interaction.nodes : projectedNodes;
  const commit = (operation: () => unknown) => {
    if (!editable) return;
    try {
      operation();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const add = (spec: NodeDefinition, position: { x: number; y: number }) =>
    commit(() =>
      session.transaction('Add node', () => {
        const id = operations.addNode({ definition: spec.nodeDefName });
        session.layout.moveNodes({ [id]: position }, scope);
      }),
    );
  const duplicate = (id: string) => {
    const source = projection.nodes.find((n) => n.id === id);
    if (source)
      commit(() =>
        session.transaction('Clone node', () => {
          const cloned = operations.cloneNode(source.id);
          session.layout.moveNodes({ [cloned]: { x: source.position.x + 40, y: source.position.y + 40 } }, scope);
          setSelected(cloned);
        }),
      );
  };
  /** React Flow's shift-drag and modifier-click selection, falling back to the inspector's node. */
  const selection = () => {
    const chosen = nodes.filter((n) => n.selected).map((n) => n.id);
    return chosen.length ? chosen : selected ? [selected] : [];
  };
  const group = () => {
    const ids = selection();
    if (!ids.length || scope) return;
    commit(() =>
      session.transaction('Group nodes', () => {
        setSelected(operations.groupNodes(ids));
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
          const port = inputs.find((p) => p.type === from.type) ?? inputs[0];
          if (port) operations.connect({ node: from.node, output: from.handle }, { node: id, input: port.name });
        } else if (from?.side === 'input') {
          const outputs = operations.getOutputs(id);
          const port = outputs.find((p) => p.type === from.type) ?? outputs[0];
          if (port) operations.connect({ node: id, output: port.name }, { node: from.node, input: from.handle });
        }
        setSelected(id);
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
  // The pane never takes focus, so shortcuts apply while the pointer or focus is on the canvas.
  const shortcuts = useRef<(event: KeyboardEvent) => void>(() => {});
  const onShortcut = (event: KeyboardEvent) => {
    const element = canvas.current;
    if (!editable || quickAdd || !element) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (!element.matches(':hover') && !element.contains(target)) return;
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key.toLowerCase() === 'd' && selected) duplicate(selected);
    else if (meta && event.key.toLowerCase() === 'g' && !scope) group();
    else if (event.shiftKey && !meta && event.key.toLowerCase() === 'a') {
      const rect = element.getBoundingClientRect();
      openQuickAdd({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    } else if (event.key === 'f' && !meta)
      void fitView({ padding: 0.15, duration: 200, ...(selected ? { nodes: [{ id: selected }] } : {}) });
    else if (event.key === 'Escape') setSelected(null);
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
  const node = projection.nodes.find((n) => n.id === selected);
  const rootLabel = fileName?.split(/[\\/]/).at(-1) || 'material.mtlx';
  return (
    <section className={`mtlx-editor mtlx-graph ${className}`} aria-label="MaterialX node graph">
      <div className="mtlx-graph-main">
        <GraphContextMenu
          catalog={menuCatalog}
          editable={editable}
          nodeId={context.nodeId}
          onAdd={(spec) => add(spec, context.position)}
          onSearch={() => openQuickAdd(context.client)}
          onClone={() => {
            if (context.nodeId) duplicate(context.nodeId);
          }}
          onDelete={() => {
            if (context.nodeId) commit(() => operations.removeNodes([context.nodeId!]));
          }}
          onGroup={scope ? undefined : group}
        >
          <div
            ref={canvas}
            className="mtlx-canvas"
            onContextMenuCapture={(event) => {
              if (!editable) return;
              const nodeId =
                (event.target as Element).closest('.react-flow__node')?.getAttribute('data-id') ?? undefined;
              const client = { x: event.clientX, y: event.clientY };
              setContext({ nodeId, position: screenToFlowPosition(client), client });
              // Right-clicking inside a multi-selection keeps it for Group.
              if (!nodeId || !nodes.some((n) => n.id === nodeId && n.selected)) setSelected(nodeId ?? null);
            }}
            onDoubleClick={(event) => {
              if ((event.target as Element).classList.contains('react-flow__pane'))
                openQuickAdd({ x: event.clientX, y: event.clientY });
            }}
            onDragOver={(e) => {
              if (editable && e.dataTransfer.types.includes(MATERIALX_NODE_MIME)) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }
            }}
            onDrop={(e) => {
              const id = e.dataTransfer.getData(MATERIALX_NODE_MIME);
              if (!id || !editable) return;
              e.preventDefault();
              e.stopPropagation();
              const spec = menuCatalog.find((n) => n.nodeDefName === id);
              if (spec && isNodeDefinition(spec)) add(spec, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
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
                const chosen = changes.find((c) => c.type === 'select' && c.selected);
                if (chosen?.type === 'select') setSelected(chosen.id);
                else if (changes.some((c) => c.type === 'select' && !c.selected && c.id === selected))
                  setSelected(null);
                const positions = Object.fromEntries(
                  changes.flatMap((c) =>
                    c.type === 'position' && c.dragging === false && c.position ? [[c.id, c.position]] : [],
                  ),
                );
                if (Object.keys(positions).length) commit(() => session.layout.moveNodes(positions, scope));
                setInteraction((current) => ({
                  projection: projectedNodes,
                  nodes: applyNodeChanges(
                    changes.filter((c) => c.type !== 'remove'),
                    current.projection === projectedNodes ? current.nodes : projectedNodes,
                  ),
                }));
              }}
              onNodeClick={(_, n) => setSelected(n.id)}
              onPaneClick={() => setSelected(null)}
              isValidConnection={(c) => {
                const wire = asConnection(c);
                return !operations.checkConnection(
                  { node: wire.source, output: wire.sourceHandle },
                  { node: wire.target, input: wire.targetHandle },
                );
              }}
              onConnect={(c) =>
                commit(() => {
                  const wire = asConnection(c);
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
        </GraphContextMenu>
      </div>
      <ParameterResourcesContext.Provider value={resources ?? EMPTY_RESOURCES}>
        <NodeParameterEditor
          key={`${scope}/${node?.id ?? ''}`}
          graph={operations}
          node={node}
          projection={projection}
          editable={editable}
          commit={commit}
          onRename={(name) =>
            commit(() => {
              operations.renameNode(node!.id, name);
              setSelected(name);
            })
          }
        />
      </ParameterResourcesContext.Provider>
    </section>
  );
}
export function MaterialXNodeGraph(props: MaterialXNodeGraphProps) {
  const session = useMemo(
    () => props.session ?? createEditorSession({ document: props.document!, catalog: props.catalog }),
    [props.session, props.document, props.catalog],
  );
  const onChange = props.onChange;
  useEffect(() => {
    if (!onChange) return;
    return session.subscribe(() => onChange(session.getDocument() as MaterialXDocument));
  }, [session, onChange]);
  return (
    <SessionNodeGraph
      {...props}
      session={session}
      mode={props.session || props.onChange ? (props.mode ?? 'edit') : 'view'}
    />
  );
}

function SessionNodeGraph(props: GraphViewProps & { session: EditorSession }) {
  const snapshot = useEditorSession(props.session);
  // Legacy projection utilities read MaterialXDocument; the session freezes its entire tree.
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
