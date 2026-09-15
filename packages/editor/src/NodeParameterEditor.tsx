import { useState } from 'react';
import { ConnectedParameterEditor, GeometryParameterEditor, getParameterEditor } from './parameter-editors.js';
import {
  disconnectInput,
  nodeType,
  removeNodes,
  resetInput,
  setInputValue,
  type MaterialXDocument,
  type MaterialXNodeSpec,
  type GraphNode,
  type GraphEdge,
} from './model.js';

export interface NodeParameterEditorProps {
  document: MaterialXDocument;
  node?: GraphNode;
  projection: { nodes: GraphNode[]; edges: GraphEdge[] };
  editable: boolean;
  scope?: string;
  catalog?: MaterialXNodeSpec[];
  commit: (operation: () => MaterialXDocument) => void;
}

/** The selected node's typed parameter editors, connections and reset actions. */
export function NodeParameterEditor({
  document,
  node,
  projection,
  editable,
  scope = '',
  catalog,
  commit,
}: NodeParameterEditorProps) {
  const [view, setView] = useState<{ node: string; definition: string }>();
  if (!node) return null;
  const viewKey = `${scope}/${node.id}`;
  const candidates = node.candidates ?? [];
  const definition =
    (view?.node === viewKey && candidates.find((s) => s.nodeDefName === view.definition)) || node.definition;
  const optionLabel = (spec: MaterialXNodeSpec) => {
    const type = nodeType(spec) ?? 'unknown';
    const peers = candidates.filter((s) => nodeType(s) === type);
    const varying = [...spec.inputs, ...spec.parameters].filter((p) =>
      peers.some((s) => [...s.inputs, ...s.parameters].find((other) => other.name === p.name)?.type !== p.type),
    );
    return varying.length ? `${type} (${varying.map((p) => `${p.name}: ${p.type}`).join(', ')})` : type;
  };
  if (node.element.name === 'output')
    return (
      <aside className="mtlx-inspector" aria-label="Node parameters">
        <p>Select a node to edit its parameters.</p>
      </aside>
    );
  return (
    <aside className="mtlx-inspector" aria-label="Node parameters">
      <h2>
        {node.id}
        {node.type && <span className="mtlx-node-type"> ({node.type})</span>}
      </h2>
      {node.id !== node.element.name && <p>{node.element.name}</p>}
      {candidates.length > 0 && definition && (
        <div className="mtlx-field">
          <label>
            Parameter type
            <select
              aria-label="Parameter type"
              disabled={!editable || candidates.length < 2}
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
          <small>View only. Editing a value can determine the node’s type.</small>
        </div>
      )}
      {editable && (
        <button type="button" onClick={() => commit(() => removeNodes(document, [node.id], scope))}>
          Delete node
        </button>
      )}
      {node.inputs.map((socket) => {
        const fallback = [...(definition?.inputs ?? []), ...(definition?.parameters ?? [])].find(
          (p) => p.name === socket.name,
        );
        const explicit = node.element.children.find(
          (p) => ['input', 'parameter'].includes(p.name) && p.attributes.name === socket.name,
        );
        const attrs = explicit?.attributes;
        const input = fallback ? { ...fallback, attributes: { ...fallback.attributes, ...attrs } } : socket;
        const connection = attrs?.nodename ?? attrs?.nodegraph ?? attrs?.interfacename;
        const edge = projection.edges.find((e) => e.target === node.id && e.targetHandle === input.name);
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
                onDisconnect={() => commit(() => disconnectInput(document, node.id, input.name, scope))}
              />
            ) : (
              <Editor
                parameter={input}
                value={value}
                ariaLabel={`${node.id} ${input.name} value`}
                disabled={!editable || !!connection}
                onReset={
                  editable && explicit
                    ? () => commit(() => resetInput(document, node.id, input.name, scope))
                    : undefined
                }
                onChange={(nextValue) =>
                  commit(() => setInputValue(document, node.id, input.name, nextValue, scope, catalog, input.type))
                }
              />
            )}
          </div>
        );
      })}
    </aside>
  );
}
