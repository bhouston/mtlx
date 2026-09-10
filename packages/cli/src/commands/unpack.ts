import { unpackMaterialX } from 'mtlx-core/node';
import { defineCommand } from 'yargs-file-commands';
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
      const result = await unpackMaterialX(argv.input, { outputDir: argv.outputDir, force: argv.force });
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
