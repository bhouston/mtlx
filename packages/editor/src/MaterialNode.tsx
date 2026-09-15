import type React from 'react';
import { ChevronDown, ChevronRight, Maximize2 } from 'lucide-react';
import { Handle, Position, useConnection, type Node, type NodeProps } from '@xyflow/react';
import { visibleInputs, type EditorMode, type GraphNode } from './model.js';
import { socketColor, socketTypes } from './socket-colors.js';
import { categoryColor } from './node-category-colors.js';

export type FlowNode = Node<
  {
    errors: string[];
    graph: GraphNode;
    mode: EditorMode;
    portType: ReturnType<typeof socketTypes>;
    onExpand?: () => void;
    /** Whether every input shows; collapsed nodes list only connected or authored inputs. */
    showAll: boolean;
    onToggleInputs: () => void;
    onPortContextMenu?: (event: React.MouseEvent, side: 'input' | 'output', name: string) => void;
  },
  'materialx'
>;

export function MaterialNode({ data, selected }: NodeProps<FlowNode>) {
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
              onContextMenu={(event) => data.onPortContextMenu?.(event, 'input', port.name)}
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
              onContextMenu={(event) => data.onPortContextMenu?.(event, 'output', port.name)}
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
export const nodeTypes = { materialx: MaterialNode };
