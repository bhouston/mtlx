import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { humanizeBytes } from 'humanize-units';
import { inspectMaterialX, type MaterialXAsset, type MaterialXSummary } from 'mtlx-core';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, printOutput } from '../output.js';

export interface MaterialXInfo extends MaterialXSummary {
  assets: MaterialXAsset[];
  totalBytes: number;
}

/** Summary plus the size of every file the material is made of, read relative to `input`. */
export const loadInfo = async (input: string): Promise<MaterialXInfo> => {
  const dir = path.dirname(input);
  const result = await inspectMaterialX(await readFile(input), input, {
    readResource: (rel) => readFile(path.join(dir, ...rel.split('/'))),
  });
  if (!result.summary) throw new Error(result.parseError ?? `Could not read ${input}`);
  return { ...result.summary, path: input, assets: result.assets, totalBytes: result.totalBytes };
};

const renderText = (info: MaterialXInfo): string => {
  const width = Math.max(...info.assets.map((asset) => asset.path.length));
  return [
    `Path: ${info.path}`,
    `Version: ${info.version ?? 'unknown'}`,
    `Colorspace: ${info.colorspace ?? 'unknown'}`,
    `Node graphs: ${info.nodeGraphCount}`,
    `Top-level nodes: ${info.topLevelNodeCount}`,
    `Node categories: ${info.nodeCategories.join(', ') || '(none)'}`,
    `Materials (surfaces/volumes): ${info.materials.map((m) => `${m.name ?? '(unnamed)'} [${m.category}]`).join(', ') || '(none)'}`,
    `Referenced textures: ${info.referencedTextures.join(', ') || '(none)'}`,
    `Internal nodes: ${info.nodes.map((n) => `${n.name ?? '(unnamed)'} [${n.category}]`).join(', ') || '(none)'}`,
    `Assets (${info.assets.length}, ${humanizeBytes(info.totalBytes, { unitSeparator: ' ' })}):`,
    ...info.assets.map(
      (asset) =>
        `  ${asset.path.padEnd(width)}  ${asset.bytes === undefined ? '(missing)' : humanizeBytes(asset.bytes, { unitSeparator: ' ' })}`,
    ),
  ].join('\n');
};

export const command = defineCommand({
  command: 'info <input>',
  describe: 'Print information about a .mtlx or .mtlx.zip file',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to .mtlx or .mtlx.zip file',
        type: 'string',
        demandOption: true,
      })
      .options(formatOption),
  handler: async (argv) => {
    const info = await loadInfo(argv.input);
    printOutput(info, argv.format, () => renderText(info));
  },
});
