import { ConnectedParameterEditor, GeometryParameterEditor, getParameterEditor } from './parameter-editors.js';
import {
  disconnectInput,
  removeNodes,
  resetInput,
  setInputValue,
  type MaterialXDocument,
  type GraphNode,
  type GraphEdge,
} from './model.js';

export interface NodeParameterEditorProps {
  document: MaterialXDocument;
  node?: GraphNode;
  projection: { nodes: GraphNode[]; edges: GraphEdge[] };
  editable: boolean;
  scope?: string;
  commit: (operation: () => MaterialXDocument) => void;
}

/** The selected node's typed parameter editors, connections and reset actions. */
export function NodeParameterEditor({
  document,
  node,
  projection,
  editable,
  scope = '',
  commit,
}: NodeParameterEditorProps) {
  if (!node) return null;
  if (node.element.name === 'output')
    return (
      <aside className="mtlx-inspector" aria-label="Node parameters">
        <p>Select a node to edit its parameters.</p>
      </aside>
    );
  return (
    <aside className="mtlx-inspector" aria-label="Node parameters">
      <h2>{node.id}</h2>
      <p>
        {node.element.name} · {node.element.attributes.type}
      </p>
      {editable && (
        <button type="button" onClick={() => commit(() => removeNodes(document, [node.id], scope))}>
          Delete node
        </button>
      )}
      {node.inputs.map((input) => {
        const explicit = node.element.children.find(
          (p) => ['input', 'parameter'].includes(p.name) && p.attributes.name === input.name,
        );
        const attrs = explicit?.attributes;
        const connection = attrs?.nodename ?? attrs?.nodegraph ?? attrs?.interfacename;
        const edge = projection.edges.find((e) => e.target === node.id && e.targetHandle === input.name);
        const value = attrs?.value ?? input.value ?? '';
        const Editor =
          input.attributes?.defaultgeomprop && attrs?.value === undefined && input.value === undefined
            ? GeometryParameterEditor
            : getParameterEditor(input);
        return (
          <div className="mtlx-field" key={input.name}>
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
                onChange={(nextValue) => commit(() => setInputValue(document, node.id, input.name, nextValue, scope))}
              />
            )}
          </div>
        );
      })}
    </aside>
  );
}
