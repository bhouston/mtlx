import { cloneMaterialXDocument } from './xml.js';
import {
  nodeType,
  getNodeCatalog as coreNodeCatalog,
  getNodeGraphScope,
  findNodeSpec,
  nonNodes,
} from './node-catalog.js';
export { nonNodes } from './node-catalog.js';
import type { MaterialXDocument, MaterialXElement, MaterialXNodeSpec, MaterialXNodePortSpec } from './types.js';

import { invalidateTypeResolution, resolveTypes, resolutionKey } from './type-resolution.js';
export { materializeDocument, resolveTypes } from './type-resolution.js';

const catalogs = new WeakMap<MaterialXDocument, MaterialXNodeSpec[]>();
const defaultCatalog = coreNodeCatalog();
export function getNodeCatalog(document?: MaterialXDocument, registry?: MaterialXNodeSpec[]): MaterialXNodeSpec[] {
  if (registry) return coreNodeCatalog(document, registry);
  if (!document) return defaultCatalog;
  let catalog = catalogs.get(document);
  if (!catalog) {
    catalog = coreNodeCatalog(document);
    catalogs.set(document, catalog);
  }
  return catalog;
}

export type { MaterialXDocument, MaterialXNodeSpec, MaterialXNodePortSpec } from './types.js';
/** Persisted node coordinates; default placement belongs to the viewer. */
export interface Point {
  x: number;
  y: number;
}
export interface GraphConnection {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}
/** Semantic graph node. Contains authored XML metadata, without canvas placement or interaction state. */
export interface GraphNode {
  id: string;
  element: MaterialXElement;
  inputs: MaterialXNodePortSpec[];
  outputs: MaterialXNodePortSpec[];
  /** Inferred output type; absent while the family is ambiguous. */
  type?: string;
  /** Concrete fallback for implicit defaults. Does not constrain the inferred type. */
  definition?: MaterialXNodeSpec;
  /** Compatible definition variants for this node. */
  candidates?: MaterialXNodeSpec[];
  /** Document scope containing this compound node’s implementation, when available. */
  compoundScope?: string;
}
export interface GraphEdge extends GraphConnection {
  id: string;
}
export { nodeType, findNodeSpec } from './node-catalog.js';
export function graphScopes(document: MaterialXDocument): string[] {
  const scopes = [''];
  const visit = (elements: MaterialXElement[], parent: string) => {
    for (const element of elements) {
      if (element.name !== 'nodegraph' || !element.attributes.name) continue;
      const scope = parent ? `${parent}/${element.attributes.name}` : element.attributes.name;
      scopes.push(scope);
      visit(element.children, scope);
    }
  };
  visit(document.elements, '');
  return scopes;
}
function children(document: MaterialXDocument, scope: string): MaterialXElement[] {
  let elements = document.elements;
  for (const name of scope ? scope.split('/') : []) {
    const graph = elements.find((element) => element.name === 'nodegraph' && element.attributes.name === name);
    if (!graph) throw new Error(`Unknown graph: ${scope}`);
    elements = graph.children;
  }
  return elements;
}
function elementAt(document: MaterialXDocument, scope: string, id: string) {
  const element = children(document, scope).find((element) => element.attributes.name === id);
  if (!element) throw new Error(`Unknown node: ${id}`);
  return element;
}
const port = (e: MaterialXElement): MaterialXNodePortSpec => ({
  name: e.attributes.name!,
  type: e.attributes.type,
  value: e.attributes.value,
  attributes: e.attributes,
});
/** Resolve the nodes and connections in a scope without adding viewer state or default positions. */
export function readGraph(
  document: MaterialXDocument,
  scope = '',
  catalog = getNodeCatalog(document),
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const resolution = resolveTypes(document, catalog);
  const nodes = children(document, scope)
    .filter((element) => element.attributes.name && !nonNodes.has(element.name) && !element.name.startsWith('#'))
    .map((element): GraphNode => {
      const resolved = resolution.nodes.get(resolutionKey(scope, element.attributes.name!));
      const spec = resolved?.definition ?? findNodeSpec(element, catalog);
      const inputs = new Map(
        (resolved?.inputs ?? [...(spec?.inputs ?? []), ...(spec?.parameters ?? [])]).map((port) => [port.name, port]),
      );
      for (const child of element.children.filter(
        (element) => element.name === 'input' || element.name === 'parameter',
      )) {
        const existing = inputs.get(child.attributes.name!);
        inputs.set(child.attributes.name!, {
          ...existing,
          ...port(child),
          type: resolved?.family ? existing?.type : (child.attributes.type ?? existing?.type),
          value: child.attributes.value ?? existing?.value,
          attributes: { ...existing?.attributes, ...child.attributes },
        });
      }
      let outputs = resolved?.outputs ?? spec?.outputs ?? [{ name: 'out', type: element.attributes.type }];
      if (element.name === 'nodegraph')
        outputs = element.children.filter((element) => element.name === 'output').map(port);
      if (element.name === 'output') {
        inputs.clear();
        inputs.set('in', { name: 'in', type: element.attributes.type });
        outputs = [];
      }
      if (element.name === 'input') {
        inputs.clear();
        outputs = [{ name: 'out', type: element.attributes.type }];
      }
      return {
        id: element.attributes.name!,
        element,
        type: resolved?.type,
        definition: resolved?.definition,
        candidates: resolved?.family ? resolved.candidates : undefined,
        compoundScope: getNodeGraphScope(document, element, scope, spec),
        inputs: [...inputs.values()],
        outputs,
      };
    });
  const edges: GraphEdge[] = [];
  for (const node of nodes) {
    const ports =
      node.element.name === 'output'
        ? [node.element]
        : node.element.children.filter((element) => element.name === 'input' || element.name === 'parameter');
    for (const port of ports) {
      const attributes = port.attributes;
      const source = attributes.nodename ?? attributes.nodegraph ?? attributes.interfacename;
      if (!source || !nodes.some((candidate) => candidate.id === source)) continue;
      const targetHandle = node.element.name === 'output' ? 'in' : attributes.name!;
      edges.push({
        id: `${node.id}/${targetHandle}`,
        source,
        sourceHandle: attributes.output ?? 'out',
        target: node.id,
        targetHandle,
      });
    }
  }
  return { nodes, edges };
}
function edit(document: MaterialXDocument, mutate: (copy: MaterialXDocument) => void): MaterialXDocument {
  const copy = cloneMaterialXDocument(document);
  mutate(copy);
  invalidateTypeResolution(copy);
  return copy;
}
function clearConnection(attributes: Record<string, string>) {
  for (const key of ['nodename', 'nodegraph', 'output', 'interfacename', 'channels']) delete attributes[key];
}
function inputElement(
  document: MaterialXDocument,
  scope: string,
  id: string,
  name: string,
  catalog = getNodeCatalog(document),
): MaterialXElement {
  const node = elementAt(document, scope, id);
  if (node.name === 'output' && name === 'in') return node;
  let input = node.children.find(
    (element) => (element.name === 'input' || element.name === 'parameter') && element.attributes.name === name,
  );
  if (!input) {
    const graphNode = readGraph(document, scope, catalog).nodes.find((candidate) => candidate.id === id);
    const spec = graphNode?.inputs.find((port) => port.name === name);
    if (!spec) throw new Error(`Unknown input: ${name}`);
    input = {
      name: graphNode?.definition?.parameters.some((port) => port.name === name) ? 'parameter' : 'input',
      attributes: { name, ...(spec.type ? { type: spec.type } : {}) },
      children: [],
    };
    node.children.push(input);
  }
  return input;
}
/** Compound-graph structure the editor adds without a nodedef: a node graph and its interface ports. Ports are untyped until placed. */
export const structuralSpecs: readonly MaterialXNodeSpec[] = Object.freeze([
  { category: 'nodegraph', nodeDefName: 'ND_nodegraph', nodeGroup: 'graph', inputs: [], outputs: [], parameters: [] },
  {
    category: 'input',
    nodeDefName: 'ND_input',
    nodeGroup: 'graph',
    inputs: [],
    outputs: [{ name: 'out' }],
    parameters: [],
  },
  {
    category: 'output',
    nodeDefName: 'ND_output',
    nodeGroup: 'graph',
    inputs: [{ name: 'in' }],
    outputs: [],
    parameters: [],
  },
]);
export const isStructural = (spec: MaterialXNodeSpec) =>
  structuralSpecs.some((s) => s.nodeDefName === spec.nodeDefName);
export function addNode(
  document: MaterialXDocument,
  spec: MaterialXNodeSpec,
  position: Point | undefined = undefined,
  scope = '',
): MaterialXDocument {
  const structural = isStructural(spec);
  if (structural && (spec.category === 'nodegraph') === !!scope)
    throw new Error(
      spec.category === 'nodegraph'
        ? 'Node graphs cannot be nested inside another node graph.'
        : 'Interface inputs and outputs belong inside a node graph.',
    );
  return edit(document, (copy) => {
    const siblings = children(copy, scope);
    let id = spec.category.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z_]/.test(id)) id = `node_${id}`;
    const base = id;
    for (let i = 2; siblings.some((element) => element.attributes.name === id); i++) id = `${base}_${i}`;
    siblings.push({
      name: spec.category,
      attributes: {
        name: id,
        ...(spec.category === 'nodegraph' ? {} : { type: nodeType(spec) ?? 'float' }),
        ...(spec.nodeDefName && !structural ? { nodedef: spec.nodeDefName } : {}),
        ...(position ? { xpos: String(position.x), ypos: String(position.y) } : {}),
      },
      children: [],
    });
  });
}
/** Retype an interface input or output of a node graph, or set the input's default value. A new type drops the old value. */
export function setInterfacePort(
  document: MaterialXDocument,
  id: string,
  changes: { type?: string; value?: string },
  scope = '',
): MaterialXDocument {
  return edit(document, (copy) => {
    const element = elementAt(copy, scope, id);
    if (!['input', 'output'].includes(element.name)) throw new Error(`${id} is not an interface input or output.`);
    if (changes.type !== undefined && changes.type !== element.attributes.type) {
      element.attributes.type = changes.type;
      delete element.attributes.value;
    }
    if (changes.value !== undefined && element.name === 'input') element.attributes.value = changes.value;
  });
}
/** Copy a node's values and incoming connections, leaving downstream connections unchanged. */
export function cloneNode(
  document: MaterialXDocument,
  id: string,
  position: Point | undefined = undefined,
  scope = '',
): MaterialXDocument {
  return edit(document, (copy) => {
    const siblings = children(copy, scope);
    const cloned = structuredClone(elementAt(copy, scope, id));
    const base = `${id}_copy`;
    let name = base;
    for (let i = 2; siblings.some((element) => element.attributes.name === name); i++) name = `${base}_${i}`;
    delete cloned.attributes.xpos;
    delete cloned.attributes.ypos;
    Object.assign(cloned.attributes, {
      name,
      ...(position ? { xpos: String(position.x), ypos: String(position.y) } : {}),
    });
    siblings.push(cloned);
  });
}
export function setInputValue(
  document: MaterialXDocument,
  node: string,
  input: string,
  value: string,
  scope = '',
  catalog = getNodeCatalog(document),
  valueType?: string,
): MaterialXDocument {
  const resolved = resolveTypes(document, catalog).nodes.get(resolutionKey(scope, node));
  const portType = (spec?: MaterialXNodeSpec) =>
    [...(spec?.inputs ?? []), ...(spec?.parameters ?? [])].find((port) => port.name === input)?.type;
  // Explicit type, then the type every surviving candidate agrees on, then the node's own authored
  // nodedef (a node added as ND_multiply_float means float), and only then the arbitrary fallback.
  const type =
    valueType ??
    resolved?.inputs.find((port) => port.name === input)?.type ??
    (resolved && portType(findNodeSpec(resolved.element, catalog))) ??
    portType(resolved?.definition);
  const edited = edit(document, (copy) => {
    const port = inputElement(copy, scope, node, input, catalog);
    if (type) port.attributes.type = type;
    clearConnection(port.attributes);
    port.attributes.value = value;
  });
  if (valueType && !resolved?.conflict && resolveTypes(edited, catalog).nodes.get(resolutionKey(scope, node))?.conflict)
    throw new Error('This value type conflicts with the node’s connections or other authored values.');
  return edited;
}
export function resetInput(document: MaterialXDocument, node: string, input: string, scope = ''): MaterialXDocument {
  return edit(document, (copy) => {
    const target = elementAt(copy, scope, node);
    if (target.name === 'output') {
      clearConnection(target.attributes);
      delete target.attributes.value;
    } else
      target.children = target.children.filter(
        (element) => !(['input', 'parameter'].includes(element.name) && element.attributes.name === input),
      );
  });
}
export function connectionError(
  document: MaterialXDocument,
  connection: GraphConnection,
  scope = '',
  catalog = getNodeCatalog(document),
): string | undefined {
  const { nodes, edges } = readGraph(document, scope, catalog);
  const from = nodes
    .find((candidate) => candidate.id === connection.source)
    ?.outputs.find((port) => port.name === connection.sourceHandle);
  const to = nodes
    .find((candidate) => candidate.id === connection.target)
    ?.inputs.find((port) => port.name === connection.targetHandle);
  if (!from || !to) return 'Choose an output and an input in this graph.';
  const visited = new Set<string>();
  function reaches(id: string): boolean {
    if (id === connection.source) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return edges
      .filter(
        (element) =>
          element.source === id &&
          !(element.target === connection.target && element.targetHandle === connection.targetHandle),
      )
      .some((element) => reaches(element.target));
  }
  if (reaches(connection.target)) return 'This connection would create a cycle.';
  const proposed = edit(document, (copy) => writeConnection(copy, connection, scope, catalog));
  const resolution = resolveTypes(proposed, catalog);
  if ([connection.source, connection.target].some((id) => resolution.nodes.get(resolutionKey(scope, id))?.conflict))
    return `Cannot connect ${connection.source}.${connection.sourceHandle} to ${connection.target}.${connection.targetHandle}: no compatible node definitions satisfy the connections and authored values. Add a conversion node.`;
  return undefined;
}
function writeConnection(
  document: MaterialXDocument,
  connection: GraphConnection,
  scope: string,
  catalog: MaterialXNodeSpec[],
) {
  const source = elementAt(document, scope, connection.source);
  const input = inputElement(document, scope, connection.target, connection.targetHandle, catalog);
  clearConnection(input.attributes);
  delete input.attributes.value;
  input.attributes[source.name === 'nodegraph' ? 'nodegraph' : source.name === 'input' ? 'interfacename' : 'nodename'] =
    connection.source;
  if (source.name === 'nodegraph' || source.attributes.type === 'multioutput' || connection.sourceHandle !== 'out')
    input.attributes.output = connection.sourceHandle;
}
export function connectNodes(
  document: MaterialXDocument,
  connection: GraphConnection,
  scope = '',
  catalog = getNodeCatalog(document),
): MaterialXDocument {
  const error = connectionError(document, connection, scope, catalog);
  if (error) throw new Error(error);
  return edit(document, (copy) => writeConnection(copy, connection, scope, catalog));
}

export function disconnectInput(
  document: MaterialXDocument,
  target: string,
  input: string,
  scope = '',
): MaterialXDocument {
  return resetInput(document, target, input, scope);
}
export function removeNodes(document: MaterialXDocument, ids: string[], scope = ''): MaterialXDocument {
  return edit(document, (copy) => {
    const siblings = children(copy, scope);
    for (let i = siblings.length - 1; i >= 0; i--)
      if (ids.includes(siblings[i]!.attributes.name!)) siblings.splice(i, 1);
    const clean = (elements: MaterialXElement[], graphScope: string) => {
      for (const element of elements) {
        const attributes = element.attributes;
        if (
          (graphScope === scope && ids.includes(attributes.nodename ?? attributes.interfacename ?? '')) ||
          ids.some(
            (id) =>
              attributes.nodegraph === (scope ? `${scope}/${id}` : id) ||
              (graphScope === scope && attributes.nodegraph === id),
          )
        )
          clearConnection(attributes);
        clean(
          element.children,
          element.name === 'nodegraph'
            ? graphScope
              ? `${graphScope}/${attributes.name}`
              : attributes.name!
            : graphScope,
        );
      }
    };
    clean(copy.elements, '');
  });
}
/** Collapse root-scope nodes into a new node graph. Wires crossing the boundary become interface inputs and outputs. */
export function groupNodes(
  document: MaterialXDocument,
  ids: string[],
  catalog = getNodeCatalog(document),
): MaterialXDocument {
  if (!ids.length) throw new Error('Select at least one node to group.');
  const { nodes, edges } = readGraph(document, '', catalog);
  const chosen = new Set(ids);
  for (const id of ids) {
    const node = nodes.find((candidate) => candidate.id === id);
    if (!node) throw new Error(`Unknown node: ${id}`);
    if (['nodegraph', 'input', 'output'].includes(node.element.name) || node.element.attributes.type === 'material')
      throw new Error(`${id} cannot be grouped: node graphs hold only ordinary nodes.`);
  }
  const inbound = edges.filter((element) => chosen.has(element.target) && !chosen.has(element.source));
  const outbound = edges.filter((element) => chosen.has(element.source) && !chosen.has(element.target));
  // A path from an outbound target back to an inbound source would loop through the new graph.
  const downstream = new Set<string>();
  const visit = (id: string) => {
    if (downstream.has(id)) return;
    downstream.add(id);
    for (const edge of edges) if (edge.source === id && !chosen.has(edge.target)) visit(edge.target);
  };
  for (const edge of outbound) visit(edge.target);
  if (inbound.some((element) => downstream.has(element.source)))
    throw new Error('Grouping these nodes would create a cycle.');
  const portType = (id: string, side: 'inputs' | 'outputs', name: string) =>
    nodes.find((candidate) => candidate.id === id)?.[side].find((port) => port.name === name)?.type;
  return edit(document, (copy) => {
    const root = copy.elements;
    let name = 'nodegraph';
    for (let i = 2; root.some((element) => element.attributes.name === name); i++) name = `nodegraph_${i}`;
    const members = ids.map((id) => elementAt(copy, '', id));
    const xs = members.map((element) => Number(element.attributes.xpos)).filter(Number.isFinite);
    const ys = members.map((element) => Number(element.attributes.ypos)).filter(Number.isFinite);
    const graph: MaterialXElement = {
      name: 'nodegraph',
      attributes: {
        name,
        ...(xs.length && ys.length ? { xpos: String(Math.min(...xs)), ypos: String(Math.min(...ys)) } : {}),
      },
      children: [],
    };
    // Interface ports share the graph's namespace with the moved nodes.
    const unique = (base: string) => {
      let port = base;
      for (let i = 2; [...graph.children, ...members].some((element) => element.attributes.name === port); i++)
        port = `${base}_${i}`;
      return port;
    };
    const ports = new Map<string, string>();
    for (const edge of inbound) {
      // One interface input per external source port, shared by every inner input it feeds.
      const key = `in:${edge.source}/${edge.sourceHandle}`;
      let port = ports.get(key);
      if (!port) {
        port = unique(edge.targetHandle);
        ports.set(key, port);
        const source = elementAt(copy, '', edge.source);
        graph.children.push({
          name: 'input',
          attributes: {
            name: port,
            type:
              portType(edge.target, 'inputs', edge.targetHandle) ??
              portType(edge.source, 'outputs', edge.sourceHandle) ??
              'float',
            [source.name === 'nodegraph' ? 'nodegraph' : 'nodename']: edge.source,
            ...(source.name === 'nodegraph' || edge.sourceHandle !== 'out' ? { output: edge.sourceHandle } : {}),
          },
          children: [],
        });
      }
      const input = inputElement(copy, '', edge.target, edge.targetHandle, catalog);
      clearConnection(input.attributes);
      input.attributes.interfacename = port;
    }
    for (const edge of outbound) {
      const key = `out:${edge.source}/${edge.sourceHandle}`;
      let port = ports.get(key);
      if (!port) {
        port = unique(edge.sourceHandle);
        ports.set(key, port);
        graph.children.push({
          name: 'output',
          attributes: {
            name: port,
            type: portType(edge.source, 'outputs', edge.sourceHandle) ?? 'float',
            nodename: edge.source,
            ...(edge.sourceHandle !== 'out' ? { output: edge.sourceHandle } : {}),
          },
          children: [],
        });
      }
      const input = inputElement(copy, '', edge.target, edge.targetHandle, catalog);
      clearConnection(input.attributes);
      input.attributes.nodegraph = name;
      input.attributes.output = port;
    }
    for (const member of members) root.splice(root.indexOf(member), 1);
    graph.children.push(...members);
    root.push(graph);
  });
}
export function moveNodes(
  document: MaterialXDocument,
  positions: Record<string, Point>,
  scope = '',
): MaterialXDocument {
  return edit(document, (copy) => {
    for (const [id, point] of Object.entries(positions))
      Object.assign(elementAt(copy, scope, id).attributes, { xpos: String(point.x), ypos: String(point.y) });
  });
}
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** Rename a node and every reference to it: sibling wires, interface names, nested graph paths, and material assignments. */
export function renameNode(document: MaterialXDocument, id: string, name: string, scope = ''): MaterialXDocument {
  if (!NAME.test(name)) throw new Error(`Invalid node name: ${name}. Use letters, digits and underscores.`);
  if (name === id) return document;
  return edit(document, (copy) => {
    const siblings = children(copy, scope);
    if (siblings.some((element) => element.attributes.name === name))
      throw new Error(`A node named ${name} already exists in this graph.`);
    elementAt(copy, scope, id).attributes.name = name;
    const qualified = (node: string) => (scope ? `${scope}/${node}` : node);
    const rewrite = (elements: MaterialXElement[], graphScope: string) => {
      for (const element of elements) {
        const attributes = element.attributes;
        if (graphScope === scope) {
          for (const key of ['nodename', 'interfacename', 'nodegraph'] as const)
            if (attributes[key] === id) attributes[key] = name;
          if (!scope && element.name === 'materialassign' && attributes.material === id) attributes.material = name;
        }
        if (attributes.nodegraph === qualified(id)) attributes.nodegraph = qualified(name);
        rewrite(
          element.children,
          element.name === 'nodegraph'
            ? graphScope
              ? `${graphScope}/${attributes.name}`
              : attributes.name!
            : graphScope,
        );
      }
    };
    rewrite(copy.elements, '');
  });
}
