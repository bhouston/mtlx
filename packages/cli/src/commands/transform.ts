import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { readMaterialX, resolveMaterialXResources, serializeMaterialX } from 'mtlx-core';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, printOutput } from '../output.js';
import { buildTransformResourceHook, hasTextureTransformOptions, textureTransformOptions } from '../textureOptions.js';

interface TransformResult {
  outputDir: string;
  rootPath: string;
  entries: string[];
}

const renderText = (result: TransformResult): string =>
  [`Transformed ${result.outputDir}`, `Root ${result.rootPath}`, `Entries ${result.entries.length}`].join('\n');

export const command = defineCommand({
  command: 'transform <input>',
  describe: 'Resize and/or reformat the textures referenced by a .mtlx file',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to root .mtlx file',
        type: 'string',
        demandOption: true,
      })
      .option('output', {
        alias: 'o',
        describe: 'Output directory (default: <input dir>/<basename>-transformed)',
        type: 'string',
      })
      .options(textureTransformOptions)
      .options(formatOption),
  handler: async (argv) => {
    try {
      if (!hasTextureTransformOptions(argv)) {
        throw new Error('Specify --max-image-size and/or --image-format');
      }

      const rootDir = path.dirname(argv.input);
      const rootFileName = path.basename(argv.input);
      const document = await readMaterialX(argv.input);
      const resources = await resolveMaterialXResources(document, rootDir, buildTransformResourceHook(argv));

      const outputDir =
        argv.output ?? path.join(rootDir, `${path.basename(rootFileName, path.extname(rootFileName))}-transformed`);
      await mkdir(outputDir, { recursive: true });
      await writeFile(path.join(outputDir, rootFileName), serializeMaterialX(document));
      for (const resource of resources) {
        const outputPath = path.join(outputDir, ...resource.archivePath.split('/'));
        await mkdir(path.dirname(outputPath), { recursive: true });
        await writeFile(outputPath, resource.data);
      }

      const result: TransformResult = {
        outputDir,
        rootPath: path.join(outputDir, rootFileName),
        entries: [rootFileName, ...resources.map((resource) => resource.archivePath)],
      };
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
