import {
  cloneMaterialXDocument,
  nodeType,
  getNodeCatalog,
  getNodeGraphScope,
  findNodeSpec,
  parseMaterialX,
  serializeMaterialX,
  inspectMaterialXZipArchive,
  packageFromArchive,
  createMaterialXZipArchive,
  packageToEntries,
  type MaterialXDocument,
  type MaterialXElement,
  type MaterialXNodeSpec,
  type MaterialXNodePortSpec,
  type MaterialXPackage,
} from 'mtlx-core';

export type { MaterialXDocument, MaterialXNodeSpec, MaterialXNodePortSpec } from 'mtlx-core';
export type EditorMode = 'view' | 'edit';
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
export interface GraphNode {
  id: string;
  element: MaterialXElement;
  inputs: MaterialXNodePortSpec[];
  outputs: MaterialXNodePortSpec[];
  position: Point;
  /** Document scope containing this compound node’s implementation, when available. */
  compoundScope?: string;
}
export interface GraphEdge extends GraphConnection {
  id: string;
}
const nonNodes = new Set([
  'nodedef',
  'implementation',
  'look',
  'lookgroup',
  'collection',
  'geominfo',
  'geompropdef',
  'typedef',
  'unitdef',
  'unittypedef',
  'propertyset',
  'variantset',
  'xi:include',
  'include',
  'parameter',
]);
export { nodeType, getNodeCatalog, findNodeSpec } from 'mtlx-core';
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
    const graph = elements.find((e) => e.name === 'nodegraph' && e.attributes.name === name);
    if (!graph) throw new Error(`Unknown graph: ${scope}`);
    elements = graph.children;
  }
  return elements;
}
function elementAt(document: MaterialXDocument, scope: string, id: string) {
  const element = children(document, scope).find((e) => e.attributes.name === id);
  if (!element) throw new Error(`Unknown node: ${id}`);
  return element;
}
const port = (e: MaterialXElement): MaterialXNodePortSpec => ({
  name: e.attributes.name!,
  type: e.attributes.type,
  value: e.attributes.value,
  attributes: e.attributes,
});
export function projectGraph(
  document: MaterialXDocument,
  scope = '',
  catalog = getNodeCatalog(document),
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = children(document, scope)
    .filter((e) => e.attributes.name && !nonNodes.has(e.name) && !e.name.startsWith('#'))
    .map((element, index): GraphNode => {
      const spec = findNodeSpec(element, catalog);
      const inputs = new Map([...(spec?.inputs ?? []), ...(spec?.parameters ?? [])].map((p) => [p.name, p]));
      for (const child of element.children.filter((e) => e.name === 'input' || e.name === 'parameter')) {
        const existing = inputs.get(child.attributes.name!);
        inputs.set(child.attributes.name!, {
          ...existing,
          ...port(child),
          type: child.attributes.type ?? existing?.type,
          value: child.attributes.value ?? existing?.value,
          attributes: { ...existing?.attributes, ...child.attributes },
        });
      }
      let outputs = spec?.outputs ?? [{ name: 'out', type: element.attributes.type }];
      if (element.name === 'nodegraph') outputs = element.children.filter((e) => e.name === 'output').map(port);
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
        compoundScope: getNodeGraphScope(document, element, scope, spec),
        inputs: [...inputs.values()],
        outputs,
        position: {
          x: Number.isFinite(Number(element.attributes.xpos)) ? Number(element.attributes.xpos) : (index % 3) * 310,
          y: Number.isFinite(Number(element.attributes.ypos))
            ? Number(element.attributes.ypos)
            : Math.floor(index / 3) * 320,
        },
      };
    });
  const edges: GraphEdge[] = [];
  for (const node of nodes) {
    const ports =
      node.element.name === 'output' ? [node.element] : node.element.children.filter((e) => e.name === 'input');
    for (const p of ports) {
      const a = p.attributes;
      const source = a.nodename ?? a.nodegraph ?? a.interfacename;
      if (!source || !nodes.some((n) => n.id === source)) continue;
      const targetHandle = node.element.name === 'output' ? 'in' : a.name!;
      edges.push({
        id: `${node.id}/${targetHandle}`,
        source,
        sourceHandle: a.output ?? 'out',
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
  return copy;
}
function clearConnection(attributes: Record<string, string>) {
  for (const key of ['nodename', 'nodegraph', 'output', 'interfacename', 'channels']) delete attributes[key];
}
function inputElement(document: MaterialXDocument, scope: string, id: string, name: string): MaterialXElement {
  const node = elementAt(document, scope, id);
  if (node.name === 'output' && name === 'in') return node;
  let input = node.children.find((e) => (e.name === 'input' || e.name === 'parameter') && e.attributes.name === name);
  if (!input) {
    const spec = projectGraph(document, scope)
      .nodes.find((n) => n.id === id)
      ?.inputs.find((p) => p.name === name);
    if (!spec) throw new Error(`Unknown input: ${name}`);
    input = { name: 'input', attributes: { name, ...(spec.type ? { type: spec.type } : {}) }, children: [] };
    node.children.push(input);
  }
  return input;
}
export function addNode(
  document: MaterialXDocument,
  spec: MaterialXNodeSpec,
  position: Point,
  scope = '',
): MaterialXDocument {
  return edit(document, (copy) => {
    const siblings = children(copy, scope);
    let id = spec.category.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z_]/.test(id)) id = `node_${id}`;
    const base = id;
    for (let i = 2; siblings.some((e) => e.attributes.name === id); i++) id = `${base}_${i}`;
    siblings.push({
      name: spec.category,
      attributes: {
        name: id,
        type: nodeType(spec) ?? 'float',
        ...(spec.nodeDefName ? { nodedef: spec.nodeDefName } : {}),
        xpos: String(position.x),
        ypos: String(position.y),
      },
      children: [...spec.inputs, ...spec.parameters]
        .filter((p) => p.value !== undefined && p.value !== '')
        .map((p) => ({
          name: spec.parameters.includes(p) ? 'parameter' : 'input',
          attributes: { name: p.name, type: p.type ?? 'float', value: p.value! },
          children: [],
        })),
    });
  });
}
/** Copy a node's values and incoming connections, leaving downstream connections unchanged. */
export function cloneNode(document: MaterialXDocument, id: string, position: Point, scope = ''): MaterialXDocument {
  return edit(document, (copy) => {
    const siblings = children(copy, scope);
    const cloned = structuredClone(elementAt(copy, scope, id));
    const base = `${id}_copy`;
    let name = base;
    for (let i = 2; siblings.some((element) => element.attributes.name === name); i++) name = `${base}_${i}`;
    Object.assign(cloned.attributes, { name, xpos: String(position.x), ypos: String(position.y) });
    siblings.push(cloned);
  });
}
export function setInputValue(
  document: MaterialXDocument,
  node: string,
  input: string,
  value: string,
  scope = '',
): MaterialXDocument {
  return edit(document, (copy) => {
    const p = inputElement(copy, scope, node, input);
    clearConnection(p.attributes);
    p.attributes.value = value;
  });
}
export function resetInput(document: MaterialXDocument, node: string, input: string, scope = ''): MaterialXDocument {
  return edit(document, (copy) => {
    const target = elementAt(copy, scope, node);
    if (target.name === 'output') {
      clearConnection(target.attributes);
      delete target.attributes.value;
    } else
      target.children = target.children.filter(
        (e) => !(['input', 'parameter'].includes(e.name) && e.attributes.name === input),
      );
  });
}
export function connectionError(
  document: MaterialXDocument,
  connection: GraphConnection,
  scope = '',
): string | undefined {
  const { nodes, edges } = projectGraph(document, scope);
  const from = nodes.find((n) => n.id === connection.source)?.outputs.find((p) => p.name === connection.sourceHandle);
  const to = nodes.find((n) => n.id === connection.target)?.inputs.find((p) => p.name === connection.targetHandle);
  if (!from || !to) return 'Choose an output and an input in this graph.';
  if (!from.type || from.type !== to.type)
    return `Cannot connect ${from.type ?? 'unknown'} to ${to.type ?? 'unknown'}. Add a conversion node.`;
  const visited = new Set<string>();
  function reaches(id: string): boolean {
    if (id === connection.source) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return edges
      .filter((e) => e.source === id && !(e.target === connection.target && e.targetHandle === connection.targetHandle))
      .some((e) => reaches(e.target));
  }
  if (reaches(connection.target)) return 'This connection would create a cycle.';
  return undefined;
}
export function connectNodes(document: MaterialXDocument, connection: GraphConnection, scope = ''): MaterialXDocument {
  const error = connectionError(document, connection, scope);
  if (error) throw new Error(error);
  return edit(document, (copy) => {
    const source = elementAt(copy, scope, connection.source);
    const input = inputElement(copy, scope, connection.target, connection.targetHandle);
    clearConnection(input.attributes);
    delete input.attributes.value;
    input.attributes[
      source.name === 'nodegraph' ? 'nodegraph' : source.name === 'input' ? 'interfacename' : 'nodename'
    ] = connection.source;
    if (source.name === 'nodegraph' || source.attributes.type === 'multioutput' || connection.sourceHandle !== 'out')
      input.attributes.output = connection.sourceHandle;
  });
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
      for (const e of elements) {
        const a = e.attributes;
        if (
          (graphScope === scope && ids.includes(a.nodename ?? a.interfacename ?? '')) ||
          ids.some(
            (id) => a.nodegraph === (scope ? `${scope}/${id}` : id) || (graphScope === scope && a.nodegraph === id),
          )
        )
          clearConnection(a);
        clean(e.children, e.name === 'nodegraph' ? (graphScope ? `${graphScope}/${a.name}` : a.name!) : graphScope);
      }
    };
    clean(copy.elements, '');
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
function stripPositions(elements: MaterialXElement[]) {
  for (const e of elements) {
    delete e.attributes.xpos;
    delete e.attributes.ypos;
    stripPositions(e.children);
  }
}
export function previewXml(document: MaterialXDocument): string {
  const copy = cloneMaterialXDocument(document);
  stripPositions(copy.elements);
  return serializeMaterialX(copy);
}
export function createDefaultDocument(): MaterialXDocument {
  return parseMaterialX(
    '<materialx version="1.39"><standard_surface name="surface" type="surfaceshader" xpos="0" ypos="0"><input name="base_color" type="color3" value="0.8, 0.25, 0.08"/><input name="specular_roughness" type="float" value="0.3"/></standard_surface><surfacematerial name="material" type="material" xpos="350" ypos="0"><input name="surfaceshader" type="surfaceshader" nodename="surface"/></surfacematerial></materialx>',
  );
}
export function importMaterial(data: Uint8Array, name: string): MaterialXPackage {
  if (/\.mtlx\.zip$/i.test(name)) return packageFromArchive(inspectMaterialXZipArchive(data));
  if (!/\.mtlx$/i.test(name)) throw new Error('Choose a .mtlx or .mtlx.zip file.');
  return { rootPath: name, document: parseMaterialX(new TextDecoder().decode(data)), resources: [] };
}
export function exportMaterial(pkg: MaterialXPackage, zip: boolean): Uint8Array {
  return zip
    ? createMaterialXZipArchive(packageToEntries(pkg))
    : new TextEncoder().encode(serializeMaterialX(pkg.document));
}
