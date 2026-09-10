import type { MaterialXDocument, MaterialXNode } from './types.js';

export interface MaterialInfo {
  name?: string;
  category: string;
}

export interface MaterialXSummary {
  path: string;
  version?: string;
  colorspace?: string;
  nodeGraphCount: number;
  topLevelNodeCount: number;
  nodeCategories: string[];
  materials: MaterialInfo[];
  referencedTextures: string[];
  nodes: MaterialInfo[];
}

const allNodes = (document: MaterialXDocument): MaterialXNode[] => [
  ...document.nodes,
  ...document.nodeGraphs.flatMap((graph) => graph.nodes),
];

/** Version/colorspace/materials(surfaces+volumes)/referenced-textures/node-list summary of a
 * parsed document — shared by the CLI's `info` command and the VS Code extension's stats panel. */
export const summarizeMaterialX = (path: string, document: MaterialXDocument): MaterialXSummary => {
  const nodes = allNodes(document);

  const referencedTextures = new Set<string>();
  for (const node of nodes) {
    for (const input of node.inputs) {
      if (input.name === 'file' && input.value) {
        referencedTextures.add(input.value);
      }
    }
  }

  return {
    path,
    version: document.attributes.version,
    colorspace: document.attributes.colorspace,
    nodeGraphCount: document.nodeGraphs.length,
    topLevelNodeCount: document.nodes.length,
    nodeCategories: [...new Set(nodes.map((node) => node.category))].toSorted(),
    materials: nodes
      .filter((node) => node.category.toLowerCase().endsWith('material'))
      .map((node) => ({ name: node.name, category: node.category })),
    referencedTextures: [...referencedTextures].toSorted(),
    nodes: nodes.map((node) => ({ name: node.name, category: node.category })),
  };
};
