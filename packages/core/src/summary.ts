import type { MaterialXDocument, MaterialXElement } from './types.js';
import { nonGraphNodes } from './validate-graph.js';

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
  /** Actual nodes from every graph depth, excluding graph containers, ports, and metadata. */
  nodes: MaterialInfo[];
}

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
  const nodes: MaterialXElement[] = [];
  let nodeGraphCount = 0;
  let topLevelNodeCount = 0;
  const visit = (elements: MaterialXElement[], topLevel = false) => {
    for (const element of elements) {
      if (element.name === 'nodegraph') {
        nodeGraphCount++;
        visit(element.children);
      } else if (
        !nonGraphNodes.has(element.name) &&
        !['input', 'output'].includes(element.name) &&
        !element.name.startsWith('#')
      ) {
        nodes.push(element);
        if (topLevel) topLevelNodeCount++;
      }
    }
  };
  visit(document.elements, true);

  const referencedTextures = new Set<string>();
  for (const node of nodes) {
    for (const input of node.children.filter((child) => child.name === 'input')) {
      if (input.attributes.name === 'file' && input.attributes.value) {
        referencedTextures.add(input.attributes.value);
      }
    }
  }

  return {
    path,
    version: document.attributes.version,
    colorspace: document.attributes.colorspace,
    nodeGraphCount,
    topLevelNodeCount,
    nodeCategories: [...new Set(nodes.map((node) => node.name))].toSorted(),
    materials: nodes
      .filter((node) => node.name.toLowerCase().endsWith('material'))
      .map((node) => ({ name: node.attributes.name, category: node.name })),
    referencedTextures: [...referencedTextures].toSorted(),
    nodes: nodes.map((node) => ({ name: node.attributes.name, category: node.name })),
  };
};
