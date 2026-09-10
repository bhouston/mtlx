import { loadMaterialXDocument, summarizeMaterialX, type MaterialXSummary } from 'mtlx-core';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, printOutput } from '../output.js';

const renderText = (info: MaterialXSummary): string =>
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
    const info = summarizeMaterialX(argv.input, document);
    printOutput(info, argv.format, () => renderText(info));
  },
});
