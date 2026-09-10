import type { MaterialXDocument, MaterialXNode } from '@mtlx/core';
import { defineCommand } from 'yargs-file-commands';
import { loadMaterialXDocument } from '../input.js';
import { formatOption, printOutput } from '../output.js';

interface MaterialInfo {
  name?: string;
  category: string;
}

interface MtlxInfo {
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

export const buildInfo = (path: string, document: MaterialXDocument): MtlxInfo => {
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

const renderText = (info: MtlxInfo): string =>
  [
    `Path: ${info.path}`,
    `Version: ${info.version ?? 'unknown'}`,
    `Colorspace: ${info.colorspace ?? 'unknown'}`,
    `Node graphs: ${info.nodeGraphCount}`,
    `Top-level nodes: ${info.topLevelNodeCount}`,
    `Node categories: ${info.nodeCategories.join(', ') || '(none)'}`,
    `Materials (surfaces/volumes): ${info.materials.map((m) => `${m.name ?? '(unnamed)'} [${m.category}]`).join(', ') || '(none)'}`,
    `Referenced textures: ${info.referencedTextures.join(', ') || '(none)'}`,
    `Internal nodes: ${info.nodes.map((n) => `${n.name ?? '(unnamed)'} [${n.category}]`).join(', ') || '(none)'}`,
  ].join('\n');

export const command = defineCommand({
  command: 'info <input>',
  describe: 'Print information about a .mtlx, .mtlz, or .mtlx.zip file',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to .mtlx, .mtlz, or .mtlx.zip file',
        type: 'string',
        demandOption: true,
      })
      .options(formatOption),
  handler: async (argv) => {
    const { document } = await loadMaterialXDocument(argv.input);
    const info = buildInfo(argv.input, document);
    printOutput(info, argv.format, () => renderText(info));
  },
});
