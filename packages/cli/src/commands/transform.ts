import path from 'node:path';
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

const renderText = (result: { outputPath: string; entries: string[] }): string =>
  [`Transformed ${result.outputPath}`, `Entries ${result.entries.length}`].join('\n');

/** `<dir>/<name>-transformed/<name>.mtlx` beside the input. */
const defaultOutputPath = (inputPath: string): string => {
  const base = path.basename(inputPath).replace(/\.(mtlx\.zip|mtlz|mtlx)$/i, '');
  return path.join(path.dirname(inputPath), `${base}-transformed`, `${base}.mtlx`);
};

export const command = defineCommand({
  command: 'transform <input> [output]',
  describe: 'Resize and/or reformat textures, writing to any of .mtlx, .mtlz, or .mtlx.zip',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to .mtlx, .mtlz, or .mtlx.zip file',
        type: 'string',
        demandOption: true,
      })
      .positional('output', {
        describe: 'Output path; format follows the extension (default: <name>-transformed/<name>.mtlx)',
        type: 'string',
      })
      .options(textureTransformOptions)
      .group(TEXTURE_OPTION_KEYS, TEXTURE_OPTION_GROUP)
      .options(formatOption),
  handler: async (argv) => {
    try {
      const transforms = textureTransforms(argv);
      if (transforms.length === 0) {
        throw new Error('Specify --max-image-size and/or --image-format');
      }
      const pkg = await loadMaterialXPackage(argv.input);
      await transform(pkg, ...transforms);
      const result = await writeMaterialXPackage(pkg, argv.output ?? defaultOutputPath(argv.input));
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
