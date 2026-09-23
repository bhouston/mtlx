import { createElement, useState } from 'react';
import type { EditorSession } from 'mtlx-core/session';
import { NodeNameField } from './NodeNameField.js';
import {
  ConnectedParameterEditor,
  GeometryParameterEditor,
  getParameterEditor,
  ParameterResourcesContext,
  type ParameterResources,
} from './parameter-editors.js';
import { nodeType, type MaterialXNodeSpec } from './model.js';
import { attempt, useCommandContext } from './commands.js';
import { socketColor, socketTypeNames } from './socket-colors.js';
import { categoryColor } from './node-category-colors.js';

const EMPTY_RESOURCES: ParameterResources = { files: [] };
export interface NodeParameterEditorProps {
  session: EditorSession;
  editable?: boolean;
  /** Package files offered by filename inputs, and an optional upload hook. */
  resources?: ParameterResources;
  className?: string;
  /** Shown in place of the panel when no single node is selected; without it the panel unmounts. */
  placeholder?: string;
}

/** The selected node's typed parameter editors, connections and reset actions. Follows the session's selection. */
export function NodeParameterEditor({
  session,
  editable = true,
  resources,
  className = '',
  placeholder,
}: NodeParameterEditorProps) {
  const { snapshot, projection } = useCommandContext(session, { editable });
  const [view, setView] = useState<{ node: string; definition: string }>();
  // The inspector edits one node; a multi-selection has nothing sensible to show.
  const node =
    snapshot.selection.length === 1 ? projection.nodes.find((n) => n.id === snapshot.selection[0]) : undefined;
  const viewKey = node ? `${snapshot.scope}/${node.id}` : '';
  // A docked inspector stays mounted; a temporary type choice belongs only to the current selection.
  if (view && view.node !== viewKey) setView(undefined);
  if (!node)
    return placeholder ? (
      <aside className={`mtlx-editor mtlx-inspector ${className}`} aria-label="Node parameters">
        <p className="mtlx-inspector-empty">{placeholder}</p>
      </aside>
    ) : null;
  const graph = session.graph(snapshot.scope);
  const commit = (operation: () => unknown) => {
    if (editable) attempt(session, operation);
  };
  const onRename = (name: string) =>
    commit(() => {
      graph.renameNode(node.id, name);
      session.select([name]);
    });
  // Same header as the node on the canvas, so the inspector reads as the node it edits.
  const accent = categoryColor(node.definition?.nodeGroup);
  const header = (
    <div
      className="mtlx-node-header"
      style={accent ? { backgroundColor: `${accent}2e`, borderBottom: `1px solid ${accent}` } : undefined}
    >
      <strong>
        {editable ? <NodeNameField key={node.id} name={node.id} onRename={onRename} /> : node.id}
        {node.type && <span className="mtlx-node-type"> ({node.type})</span>}
      </strong>
    </div>
  );
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
      <aside className={`mtlx-editor mtlx-inspector mtlx-selected ${className}`} aria-label="Node parameters">
        {header}
        <small>{node.element.name === 'input' ? 'Graph input' : 'Graph output'}</small>
        <div className="mtlx-inspector-fields">
          <div className="mtlx-field">
            <label>
              <span className="mtlx-parameter-label">
                <span className="mtlx-socket-dot" style={{ background: socketColor(type) }} />
                Type
              </span>
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
        </div>
      </aside>
    );
  }
  return (
    <ParameterResourcesContext.Provider value={resources ?? EMPTY_RESOURCES}>
      <aside className={`mtlx-editor mtlx-inspector mtlx-selected ${className}`} aria-label="Node parameters">
        {header}
        {node.id !== node.element.name && <small>{node.element.name}</small>}
        <div className="mtlx-inspector-fields">
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
                    onReset={
                      editable && explicit ? () => commit(() => graph.resetInput(node.id, input.name)) : undefined
                    }
                    onChange={(nextValue, options) =>
                      commit(() =>
                        graph.setInputValue(node.id, input.name, nextValue, { type: input.type, ...options }),
                      )
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </ParameterResourcesContext.Provider>
  );
}
