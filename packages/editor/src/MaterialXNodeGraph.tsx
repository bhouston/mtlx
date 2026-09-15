import { NodeParameterEditor } from './NodeParameterEditor.js';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Maximize2 } from 'lucide-react';
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
  useReactFlow,
  type ConnectionLineComponentProps,
  type Node,
  type NodeProps,
  type Connection,
  type Edge,
} from '@xyflow/react';
import {
  addNode,
  cloneNode,
  connectNodes,
  connectionError,
  disconnectInput,
  getNodeCatalog,
  graphScopes,
  moveNodes,
  projectGraph,
  removeNodes,
  type EditorMode,
  type GraphConnection,
  type GraphNode,
  type MaterialXDocument,
  type MaterialXNodeSpec,
} from './model.js';
import { validateGraph } from './validation.js';
import { socketColor, socketTypes } from './socket-colors.js';
import { MATERIALX_NODE_MIME } from './MaterialXNodeLib.js';
import { GraphContextMenu } from './GraphContextMenu.js';

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
  },
  'materialx'
>;
function MaterialNode({ data, selected }: NodeProps<FlowNode>) {
  const { graph, mode, portType } = data;
  return (
    <div
      className={`mtlx-node ${selected ? 'mtlx-selected' : ''} ${data.errors.length ? 'mtlx-node-error' : ''}`}
      title={data.errors.join('\n') || undefined}
    >
      {data.errors.length > 0 && <span className="mtlx-node-error-label">Error</span>}
      <div className="mtlx-node-header">
        <strong>{graph.id}</strong>
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
      <small>
        {graph.element.name} · {graph.element.attributes.type}
      </small>
      <div className="mtlx-ports">
        <div>
          {graph.inputs.map((port) => (
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
export interface MaterialXNodeGraphProps {
  document: MaterialXDocument;
  /** Material file name or path, shown at the root of the breadcrumbs. */
  fileName?: string;
  onChange?: (document: MaterialXDocument) => void;
  mode?: EditorMode;
  scope?: string;
  onScopeChange?: (scope: string) => void;
  catalog?: MaterialXNodeSpec[];
  className?: string;
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
  onChange,
  mode = 'edit',
  scope = '',
  catalog: suppliedCatalog,
  className = '',
  path,
  onNavigate,
}: MaterialXNodeGraphProps & { path: string[]; onNavigate: (path: string[]) => void }) {
  const catalog = useMemo(() => suppliedCatalog ?? getNodeCatalog(document), [suppliedCatalog, document]);
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
  const [error, setError] = useState('');
  const [context, setContext] = useState<{ nodeId?: string; position: { x: number; y: number } }>({
    position: { x: 0, y: 0 },
  });
  const editable = mode === 'edit' && !!onChange;
  const { screenToFlowPosition, fitView } = useReactFlow();
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
            onExpand:
              graph.compoundScope !== undefined && !path.includes(graph.compoundScope)
                ? () => onNavigate([...path, graph.compoundScope!])
                : undefined,
          },
          selected: graph.id === selected,
        }),
      ),
    [projection, portType, diagnostics, editable, selected, path, onNavigate],
  );
  const [interaction, setInteraction] = useState({ projection: projectedNodes, nodes: projectedNodes });
  const nodes = interaction.projection === projectedNodes ? interaction.nodes : projectedNodes;
  const commit = (operation: () => MaterialXDocument) => {
    if (!editable) return;
    try {
      onChange?.(operation());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const node = projection.nodes.find((n) => n.id === selected);
  const rootLabel = fileName?.split(/[\\/]/).at(-1) || 'material.mtlx';
  return (
    <section className={`mtlx-editor mtlx-graph ${className}`} aria-label="MaterialX node graph">
      <div className="mtlx-graph-main">
        <Breadcrumb aria-label="Graph breadcrumb">
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
        <GraphContextMenu
          catalog={catalog}
          editable={editable}
          nodeId={context.nodeId}
          onAdd={(spec) => commit(() => addNode(document, spec, context.position, scope))}
          onClone={() => {
            const source = projection.nodes.find((n) => n.id === context.nodeId);
            if (source)
              commit(() =>
                cloneNode(document, source.id, { x: source.position.x + 40, y: source.position.y + 40 }, scope),
              );
          }}
          onDelete={() => {
            if (context.nodeId) commit(() => removeNodes(document, [context.nodeId!], scope));
          }}
        >
          <div
            className="mtlx-canvas"
            onContextMenuCapture={(event) => {
              if (!editable) return;
              const nodeId =
                (event.target as Element).closest('.react-flow__node')?.getAttribute('data-id') ?? undefined;
              setContext({ nodeId, position: screenToFlowPosition({ x: event.clientX, y: event.clientY }) });
              setSelected(nodeId ?? null);
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
              const spec = catalog.find((n) => n.nodeDefName === id);
              if (spec)
                commit(() => addNode(document, spec, screenToFlowPosition({ x: e.clientX, y: e.clientY }), scope));
            }}
          >
            <ReactFlow<FlowNode>
              nodes={nodes}
              edges={edges}
              connectionLineComponent={MaterialConnectionLine}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              minZoom={0.08}
              nodesDraggable={editable}
              nodesConnectable={editable}
              edgesReconnectable={false}
              deleteKeyCode={null}
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
                if (Object.keys(positions).length) commit(() => moveNodes(document, positions, scope));
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
              isValidConnection={(c) => !connectionError(document, asConnection(c), scope)}
              onConnect={(c) => commit(() => connectNodes(document, asConnection(c), scope))}
              onEdgeDoubleClick={(_, edge) =>
                commit(() => disconnectInput(document, edge.target, edge.targetHandle ?? 'in', scope))
              }
            >
              <Background />
              <Controls showInteractive={false} />
            </ReactFlow>
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
      <NodeParameterEditor
        key={`${scope}/${node?.id ?? ''}`}
        document={document}
        node={node}
        projection={projection}
        editable={editable}
        scope={scope}
        commit={commit}
      />
    </section>
  );
}
export function MaterialXNodeGraph(props: MaterialXNodeGraphProps) {
  const scopes = graphScopes(props.document);
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
      <Graph {...props} scope={scope} path={path} onNavigate={onNavigate} />
    </ReactFlowProvider>
  );
}
