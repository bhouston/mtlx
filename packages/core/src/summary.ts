import type { MaterialXDocument, MaterialXNode } from './types.js';

/**
 * *A node's name and category.*
 *
 * @category Parsing
 */
export interface MaterialInfo {
  name?: string;
  category: string;
}

/**
 * *The result of {@link summarizeMaterialX}.*
 *
 * @category Parsing
 */
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

/**
 * *Summarizes a parsed document: version, colorspace, materials, referenced textures, and nodes.*
 * Powers the CLI's `info` command and the VS Code extension's stats panel.
 *
 * Example:
 *
 * ```ts
 * const summary = summarizeMaterialX('material.mtlx', document);
 * console.log(summary.materials.map((material) => material.name));
 * ```
 *
 * @category Parsing
 */
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
