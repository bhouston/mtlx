import {
  parseMaterialX,
  serializeMaterialX,
  findNodeSpec,
  inspectMaterialXZipArchive,
  packageFromArchive,
  createMaterialXZipArchive,
  packageToEntries,
  type MaterialXDocument,
  type MaterialXElement,
  type MaterialXPackage,
} from 'mtlx-core';
import {
  readGraph,
  getNodeCatalog,
  materializeDocument,
  type GraphNode as SemanticGraphNode,
  type GraphEdge,
  type Point,
} from 'mtlx-core/session';

export {
  addNode,
  cloneNode,
  connectNodes,
  connectionError,
  disconnectInput,
  getNodeCatalog,
  graphScopes,
  moveNodes,
  removeNodes,
  resetInput,
  setInputValue,
  materializeDocument,
  resolveTypes,
  type GraphConnection,
  type GraphEdge,
  type Point,
} from 'mtlx-core/session';
export { nodeType, findNodeSpec } from 'mtlx-core';
export type { MaterialXDocument, MaterialXNodeSpec, MaterialXNodePortSpec } from 'mtlx-core';
export { getNodeFamilies } from './node-families.js';
export type EditorMode = 'view' | 'edit';
export interface GraphNode extends SemanticGraphNode {
  position: Point;
}

/** Adapt the semantic graph to the canvas, including fallback positions for unplaced nodes. */
export function projectGraph(
  document: MaterialXDocument,
  scope = '',
  catalog = getNodeCatalog(document),
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const graph = readGraph(document, scope, catalog);
  return {
    ...graph,
    nodes: graph.nodes.map((node, index) => ({
      ...node,
      position: {
        x: Number.isFinite(Number(node.element.attributes.xpos))
          ? Number(node.element.attributes.xpos)
          : (index % 3) * 310,
        y: Number.isFinite(Number(node.element.attributes.ypos))
          ? Number(node.element.attributes.ypos)
          : Math.floor(index / 3) * 320,
      },
    })),
  };
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

function stripPositions(elements: MaterialXElement[]) {
  for (const e of elements) {
    delete e.attributes.xpos;
    delete e.attributes.ypos;
    stripPositions(e.children);
  }
}
export function previewXml(document: MaterialXDocument, catalog = getNodeCatalog(document)): string {
  const copy = materializeDocument(document, catalog);
  // Three.js does not consistently consult nodedef defaults (notably for constant).
  // Supply them only to the renderer's temporary copy, never to the draft or exports.
  const defaults = (elements: MaterialXElement[]) => {
    for (const element of elements) {
      if (element.name === 'nodegraph') defaults(element.children);
      if (['input', 'output', 'nodegraph'].includes(element.name) || nonNodes.has(element.name)) continue;
      const spec = findNodeSpec(element, catalog);
      for (const parameter of [...(spec?.inputs ?? []), ...(spec?.parameters ?? [])]) {
        if (parameter.value === undefined || parameter.value === '') continue;
        let input = element.children.find(
          (p) => ['input', 'parameter'].includes(p.name) && p.attributes.name === parameter.name,
        );
        if (
          input &&
          ['value', 'nodename', 'nodegraph', 'interfacename'].some((key) => input!.attributes[key] !== undefined)
        )
          continue;
        if (!input) {
          input = {
            name: spec!.parameters.includes(parameter) ? 'parameter' : 'input',
            attributes: { name: parameter.name },
            children: [],
          };
          element.children.push(input);
        }
        if (parameter.type) input.attributes.type = parameter.type;
        input.attributes.value = parameter.value;
      }
    }
  };
  defaults(copy.elements);
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
export function exportMaterial(
  pkg: MaterialXPackage,
  zip: boolean,
  catalog = getNodeCatalog(pkg.document),
): Uint8Array {
  const resolved = { ...pkg, document: materializeDocument(pkg.document, catalog) };
  return zip
    ? createMaterialXZipArchive(packageToEntries(resolved))
    : new TextEncoder().encode(serializeMaterialX(resolved.document));
}
