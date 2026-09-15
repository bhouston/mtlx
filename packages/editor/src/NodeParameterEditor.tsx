import { createElement, useState } from 'react';
import { NodeNameField } from './NodeNameField.js';
import { ConnectedParameterEditor, GeometryParameterEditor, getParameterEditor } from './parameter-editors.js';
import { nodeType, type MaterialXNodeSpec, type GraphNode, type GraphEdge } from './model.js';
import type { EditorGraph } from 'mtlx-core/session';
import { socketTypeNames } from './socket-colors.js';

export interface NodeParameterEditorProps {
  graph: EditorGraph;
  node?: GraphNode;
  projection: { nodes: GraphNode[]; edges: GraphEdge[] };
  editable: boolean;
  commit: (operation: () => unknown) => void;
  onRename?: (name: string) => void;
}

/** The selected node's typed parameter editors, connections and reset actions. */
export function NodeParameterEditor({ graph, node, projection, editable, commit, onRename }: NodeParameterEditorProps) {
  const [view, setView] = useState<{ node: string; definition: string }>();
  if (!node) return null;
  const viewKey = `${graph.scope}/${node.id}`;
  const candidates = node.candidates ?? [];
  const definition =
    (view?.node === viewKey && candidates.find((spec) => spec.nodeDefName === view.definition)) || node.definition;
  const optionLabel = (spec: MaterialXNodeSpec) => {
    const type = nodeType(spec) ?? 'unknown';
    const peers = candidates.filter((spec) => nodeType(spec) === type);
    const varying = [...spec.inputs, ...spec.parameters].filter((port) =>
      peers.some(
        (peer) => [...peer.inputs, ...peer.parameters].find((other) => other.name === port.name)?.type !== port.type,
      ),
    );
    return varying.length ? `${type} (${varying.map((port) => `${port.name}: ${port.type}`).join(', ')})` : type;
  };
  // Interface ports of a node graph: the type is the port's contract, an input also carries its default.
  if (node.element.name === 'input' || node.element.name === 'output') {
    const type = node.element.attributes.type ?? 'float';
    const value = node.element.attributes.value ?? '';
    return (
      <aside className="mtlx-inspector" aria-label="Node parameters">
        <h2>{editable && onRename ? <NodeNameField key={node.id} name={node.id} onRename={onRename} /> : node.id}</h2>
        <p>{node.element.name === 'input' ? 'Graph input' : 'Graph output'}</p>
        <div className="mtlx-field">
          <label>
            Type
            <select
              aria-label="Port type"
              disabled={!editable}
              value={type}
              onChange={(event) => commit(() => graph.setInterfacePort(node.id, { type: event.target.value }))}
            >
              {[...new Set([type, ...socketTypeNames])].map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {node.element.name === 'input' && (
          <div className="mtlx-field" key={type}>
            {createElement(getParameterEditor({ name: 'value', type }), {
              parameter: { name: 'value', type },
              value,
              ariaLabel: `${node.id} default value`,
              disabled: !editable,
              onChange: (next) => commit(() => graph.setInterfacePort(node.id, { value: next })),
            })}
          </div>
        )}
      </aside>
    );
  }
  return (
    <aside className="mtlx-inspector" aria-label="Node parameters">
      <h2>
        {editable && onRename ? <NodeNameField key={node.id} name={node.id} onRename={onRename} /> : node.id}
        {node.type && <span className="mtlx-node-type"> ({node.type})</span>}
      </h2>
      {node.id !== node.element.name && <p>{node.element.name}</p>}
      {candidates.length > 1 && definition && (
        <div className="mtlx-field">
          <label title="Chooses which variant's controls and defaults the inspector shows. The graph changes only once you edit a value.">
            Edit as
            <select
              aria-label="Edit as"
              disabled={!editable}
              value={definition.nodeDefName}
              onChange={(event) => setView({ node: viewKey, definition: event.target.value })}
            >
              {candidates.map((spec) => (
                <option key={spec.nodeDefName} value={spec.nodeDefName}>
                  {optionLabel(spec)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {node.inputs.map((socket) => {
        const fallback = [...(definition?.inputs ?? []), ...(definition?.parameters ?? [])].find(
          (port) => port.name === socket.name,
        );
        const explicit = node.element.children.find(
          (child) => ['input', 'parameter'].includes(child.name) && child.attributes.name === socket.name,
        );
        const attrs = explicit?.attributes;
        const input = fallback ? { ...fallback, attributes: { ...fallback.attributes, ...attrs } } : socket;
        const connection = attrs?.nodename ?? attrs?.nodegraph ?? attrs?.interfacename;
        const edge = projection.edges.find((edge) => edge.target === node.id && edge.targetHandle === input.name);
        const value = attrs?.value ?? input.value ?? '';
        const Editor =
          input.attributes?.defaultgeomprop && attrs?.value === undefined && input.value === undefined
            ? GeometryParameterEditor
            : getParameterEditor(input);
        return (
          <div className="mtlx-field" key={`${input.name}/${input.type}`}>
            {connection ? (
              <ConnectedParameterEditor
                parameter={input}
                value={value}
                ariaLabel={`${node.id} ${input.name} value`}
                disabled={!editable}
                onChange={() => {}}
                source={
                  edge
                    ? `${edge.source}.${edge.sourceHandle}`
                    : `${connection}${attrs?.output ? `.${attrs.output}` : ''}`
                }
                onDisconnect={() => commit(() => graph.disconnectInput(node.id, input.name))}
              />
            ) : (
              <Editor
                parameter={input}
                value={value}
                ariaLabel={`${node.id} ${input.name} value`}
                disabled={!editable || !!connection}
                onReset={editable && explicit ? () => commit(() => graph.resetInput(node.id, input.name)) : undefined}
                onChange={(nextValue, options) =>
                  commit(() => graph.setInputValue(node.id, input.name, nextValue, { type: input.type, ...options }))
                }
              />
            )}
          </div>
        );
      })}
    </aside>
  );
}
