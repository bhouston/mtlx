import { transform } from 'mtlx-core';
import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, printOutput } from '../output.js';
import {
  TEXTURE_OPTION_GROUP,
  TEXTURE_OPTION_KEYS,
  textureTransformOptions,
  textureTransforms,
} from '../textureOptions.js';

const renderText = (result: { outputPath: string; rootPath: string; entries: string[] }): string =>
  [`Packed ${result.outputPath}`, `Root ${result.rootPath}`, `Entries ${result.entries.length}`].join('\n');

export const command = defineCommand({
  command: 'pack <input>',
  describe: 'Pack a root .mtlx file and its resources into a .mtlz (or .mtlx.zip) archive',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to root .mtlx file',
        type: 'string',
        demandOption: true,
      })
      .option('output', {
        alias: 'o',
        describe: 'Output path; .mtlx.zip writes the relaxed container (default: <input>.mtlz)',
        type: 'string',
      })
      .options(textureTransformOptions)
      .group(TEXTURE_OPTION_KEYS, TEXTURE_OPTION_GROUP)
      .options(formatOption),
  handler: async (argv) => {
    try {
      const pkg = await loadMaterialXPackage(argv.input);
      await transform(pkg, ...textureTransforms(argv));
      const result = await writeMaterialXPackage(pkg, argv.output ?? argv.input.replace(/\.mtlx$/i, '.mtlz'));
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
