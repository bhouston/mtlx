import { unpackMaterialXZip, unpackMaterialZ } from '@mtlx/core';
import { defineCommand } from 'yargs-file-commands';
import { detectFormat } from '../input.js';
import { formatOption, printOutput } from '../output.js';

const renderText = (result: { outputDir: string; rootPath: string; entries: string[] }): string =>
  [`Unpacked ${result.outputDir}`, `Root ${result.rootPath}`, `Entries ${result.entries.length}`].join('\n');

export const command = defineCommand({
  command: 'unpack <input>',
  describe: 'Unpack a .mtlz or .mtlx.zip archive into a directory',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to .mtlz or .mtlx.zip archive',
        type: 'string',
        demandOption: true,
      })
      .option('output-dir', {
        alias: 'd',
        describe: 'Output directory',
        type: 'string',
      })
      .option('force', {
        describe: 'Delete the output directory before extracting',
        type: 'boolean',
        default: false,
      })
      .options(formatOption),
  handler: async (argv) => {
    try {
      const options = { outputDir: argv.outputDir, force: argv.force };
      const result =
        detectFormat(argv.input) === 'mtlx.zip'
          ? await unpackMaterialXZip(argv.input, options)
          : await unpackMaterialZ(argv.input, options);
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
