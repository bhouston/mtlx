import { glob, stat } from 'node:fs/promises';
import path from 'node:path';
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

/** Expands each token as a glob pattern (a plain path matches itself), preserving first-seen
 * order and dropping duplicates matched by more than one pattern. */
const expandInputs = async (patterns: string[]): Promise<string[]> => {
  const seen = new Set<string>();
  for (const pattern of patterns) {
    let matched = false;
    for await (const match of glob(pattern)) {
      matched = true;
      seen.add(match);
    }
    if (!matched) {
      throw new Error(`No files matched: ${pattern}`);
    }
  }
  return [...seen];
};

/** An `--output` is a directory (batch mode) if it already exists as one, or, when it doesn't
 * exist yet, if its path has neither a `.mtlx` nor a `.mtlx.zip` extension. */
const isDirectoryOutput = async (outputPath: string): Promise<boolean> => {
  try {
    return (await stat(outputPath)).isDirectory();
  } catch {
    const lower = outputPath.toLowerCase();
    return !lower.endsWith('.mtlx') && !lower.endsWith('.mtlx.zip');
  }
};

export const command = defineCommand({
  command: 'transform <inputs..>',
  aliases: ['x'],
  describe:
    'Convert, combine, or resize/reformat textures across one or more .mtlx / .mtlx.zip files (glob patterns ' +
    'accepted), writing --output. A directory --output batch-converts each input separately instead of combining.',
  builder: (yargs) =>
    yargs
      .option('output', {
        alias: 'o',
        describe:
          'Output path; a .mtlx/.mtlx.zip path combines every input into one file, a directory converts each ' +
          'input separately (same basename, same format) into that directory',
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
      const inputs = await expandInputs(argv.inputs as string[]);
      const textureLibrary = argv.textureLibrary as string | undefined;
      const writeOptions = { textureLibrary };
      let warnedTextureLibraryIgnored = false;
      const warnIfZip = (outputPath: string) => {
        if (textureLibrary && !warnedTextureLibraryIgnored && outputPath.toLowerCase().endsWith('.mtlx.zip')) {
          warnedTextureLibraryIgnored = true;
          console.error('NOTE --texture-library is ignored for .mtlx.zip output (always uses ./textures)');
        }
      };

      if (await isDirectoryOutput(argv.output)) {
        // Batch mode: each input is converted independently (not combined) and keeps its own
        // basename and format. Only the top-level output filename is checked for collisions;
        // ponytail: two *different* loose .mtlx inputs that both reference e.g.
        // "textures/albedo.png" would still clobber each other's texture in the shared output
        // directory — route those through .mtlx.zip outputs (self-contained per input) if that
        // matters, or combine them into one archive instead of batching.
        const usedOutputPaths = new Set<string>();
        const results: Awaited<ReturnType<typeof writeMaterialXPackage>>[] = [];
        for (const input of inputs) {
          const outputPath = path.join(argv.output, path.basename(input));
          if (usedOutputPaths.has(outputPath)) {
            throw new Error(`Two inputs would both write ${outputPath}; rename one of them`);
          }
          usedOutputPaths.add(outputPath);
          warnIfZip(outputPath);

          const pkg = await loadMaterialXPackage(input);
          await transform(pkg, ...textureTransforms(argv));
          results.push(await writeMaterialXPackage(pkg, outputPath, writeOptions));
        }
        printOutput(results, argv.format, () => results.map(renderText).join('\n\n'));
        return;
      }

      warnIfZip(argv.output);
      const packages = await Promise.all(inputs.map((input) => loadMaterialXPackage(input)));
      const pkg = mergeMaterialXPackages(packages);
      await transform(pkg, ...textureTransforms(argv));
      const result = await writeMaterialXPackage(pkg, argv.output, writeOptions);
      printOutput(result, argv.format, () => renderText(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
