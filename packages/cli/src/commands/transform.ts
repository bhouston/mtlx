import { glob, stat } from 'node:fs/promises';
import path from 'node:path';
import { processMaterialX, type MaterialXProcessingResult } from 'mtlx-core/node';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, printOutput } from '../output.js';
import {
  TEXTURE_OPTION_GROUP,
  TEXTURE_OPTION_KEYS,
  textureTransformOptions,
  textureTransforms,
} from '../textureOptions.js';

const renderText = (result: MaterialXProcessingResult): string =>
  [
    `${result.success ? (result.dryRun ? 'Would write' : 'Wrote') : 'Failed'} ${result.outputPath}`,
    ...(result.rootPath ? [`Root ${result.rootPath}`, `Entries ${result.entries.length}`] : []),
    ...(result.dryRun
      ? result.changes.map(
          (change) => `${change.action === 'reuse' ? 'Reuse' : 'Write'} ${change.path} (${change.bytes} bytes)`,
        )
      : []),
  ].join('\n');

/** Batch mode's default (non-`--verbose`) text output: one line, not one per input. */
const renderBatchSummary = (results: MaterialXProcessingResult[], outputDir: string, dryRun: boolean): string => {
  const count = results.filter((result) => result.success).length;
  return `${dryRun ? 'Would write' : 'Wrote'} ${count} file${count === 1 ? '' : 's'} to ${outputDir}`;
};

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

/** The deepest directory that contains every path, so batch mode can mirror each input's
 * subdirectory under `--output` instead of flattening to basename (which collides whenever a
 * glob matches same-named files, e.g. many "material.mtlx", from different directories). */
const commonAncestorDir = (absolutePaths: string[]): string => {
  const segmentsList = absolutePaths.map((p) => path.dirname(p).split(path.sep));
  let common = segmentsList[0]!;
  for (const segments of segmentsList.slice(1)) {
    let i = 0;
    while (i < common.length && i < segments.length && common[i] === segments[i]) {
      i += 1;
    }
    common = common.slice(0, i);
  }
  return common.join(path.sep) || path.sep;
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
      .option('verbose', {
        describe: 'Batch mode: print every file written instead of just a one-line summary',
        type: 'boolean',
        default: false,
      })
      .option('dry-run', {
        describe: 'Transform and validate in memory, report planned files, and create no output',
        type: 'boolean',
        default: false,
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
        // format. Its path relative to the inputs' common ancestor directory is mirrored under
        // `--output`, so a glob that matches same-named files from different directories (e.g.
        // many "material.mtlx") doesn't collide — a flat basename-only layout would. Texture
        // dedup (see mtlx-core/node's writeMaterialXPackage) still applies per output directory,
        // so pass an absolute `--texture-library` to consolidate textures across every input.
        const absoluteInputs = inputs.map((input) => path.resolve(input));
        const baseDir = commonAncestorDir(absoluteInputs);
        const usedOutputPaths = new Set<string>();
        const results: MaterialXProcessingResult[] = [];
        const plannedFiles = argv.dryRun ? new Map<string, Uint8Array>() : undefined;
        const failures: Array<{ input: string; message: string }> = [];
        for (const [index, input] of inputs.entries()) {
          const outputPath = path.join(argv.output, path.relative(baseDir, absoluteInputs[index]!));
          try {
            if (usedOutputPaths.has(outputPath)) {
              throw new Error(`Two inputs would both write ${outputPath}; rename one of them`);
            }
            usedOutputPaths.add(outputPath);
            warnIfZip(outputPath);

            const result = await processMaterialX(input, outputPath, {
              transforms: textureTransforms(argv),
              dryRun: argv.dryRun,
              writeOptions,
              plannedFiles,
            });
            results.push(result);
            if (!result.success)
              failures.push({ input, message: result.errors.map((issue) => issue.message).join('; ') });
          } catch (error) {
            // One bad input (e.g. a reference escaping its own directory) shouldn't abort an
            // otherwise-good batch of hundreds of files; report it and keep going.
            failures.push({ input, message: error instanceof Error ? error.message : String(error) });
          }
        }
        printOutput(results, argv.format, () =>
          argv.verbose ? results.map(renderText).join('\n\n') : renderBatchSummary(results, argv.output, argv.dryRun),
        );
        for (const failure of failures) {
          console.error(`ERROR ${failure.input}: ${failure.message}`);
        }
        if (failures.length > 0) {
          console.error(`${failures.length} of ${inputs.length} inputs failed`);
          process.exitCode = 1;
        }
        return;
      }

      warnIfZip(argv.output);
      const result = await processMaterialX(inputs, argv.output, {
        transforms: textureTransforms(argv),
        dryRun: argv.dryRun,
        writeOptions,
      });
      printOutput(result, argv.format, () => renderText(result));
      if (!result.success) {
        for (const issue of result.errors) console.error(`ERROR ${issue.stage}: ${issue.message}`);
        process.exitCode = 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (argv.format !== 'text')
        printOutput({ success: false, errors: [{ stage: 'inputs', message }] }, argv.format, () => '');
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
