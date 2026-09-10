import { packMaterialX } from 'mtlx-core';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, printOutput } from '../output.js';
import { buildTransformResourceHook, hasTextureTransformOptions, textureTransformOptions } from '../textureOptions.js';

const renderText = (result: { outputPath: string; rootPath: string; entries: string[] }): string =>
  [`Packed ${result.outputPath}`, `Root ${result.rootPath}`, `Entries ${result.entries.length}`].join('\n');

export const command = defineCommand({
  command: 'pack <input>',
  describe: 'Pack a root .mtlx file and its resources into a .mtlz archive',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to root .mtlx file',
        type: 'string',
        demandOption: true,
      })
      .option('output', {
        alias: 'o',
        describe: 'Output .mtlz path',
        type: 'string',
      })
      .options(textureTransformOptions)
      .options(formatOption),
  handler: async (argv) => {
    try {
      const transformResource = hasTextureTransformOptions(argv) ? buildTransformResourceHook(argv) : undefined;
      const result = await packMaterialX(argv.input, { outputPath: argv.output, transformResource });
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
