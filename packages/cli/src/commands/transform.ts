import { mergeMaterialXPackages, transform } from 'mtlx-core';
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
  [`Wrote ${result.outputPath}`, `Root ${result.rootPath}`, `Entries ${result.entries.length}`].join('\n');

export const command = defineCommand({
  command: 'transform <inputs..>',
  aliases: ['x'],
  describe:
    'Convert, combine, or resize/reformat textures across one or more .mtlx / .mtlx.zip files, writing --output',
  builder: (yargs) =>
    yargs
      .option('output', {
        alias: 'o',
        describe: 'Output path; the extension picks the format (a .mtlx path unpacks resources beside it)',
        type: 'string',
        demandOption: true,
      })
      .options(textureTransformOptions)
      .group(TEXTURE_OPTION_KEYS, TEXTURE_OPTION_GROUP)
      .options(formatOption),
  handler: async (argv) => {
    try {
      // `inputs` isn't declared via `.positional()`: yargs-file-commands' positional validator
      // can't match a variadic `<inputs..>` command-string token to a `.positional('inputs', …)`
      // registration, so it's typed only through the `<inputs..>` command string itself.
      const inputs = argv.inputs as string[];
      const packages = await Promise.all(inputs.map((input) => loadMaterialXPackage(input)));
      const pkg = mergeMaterialXPackages(packages);
      await transform(pkg, ...textureTransforms(argv));
      const result = await writeMaterialXPackage(pkg, argv.output);
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
