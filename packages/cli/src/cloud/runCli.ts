import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { infoFromPackageJson, type OpenCliDocument } from '@clidoc/core';
import { createDocgenCommand, fromYargs } from '@clidoc/yargs';
import type { PackageJson } from 'type-fest';
import yargs from 'yargs';
import { fileCommands } from 'yargs-file-commands';
import { initializeConfigDefaults } from './lib/config-defaults.ts';
import { type CliDeps, setCliDeps } from './lib/deps.ts';

// Regex to extract command name from yargs error messages
const SUBCOMMAND_ERROR_REGEX = /You must specify a (\w+) subcommand/i;

/**
 * Core CLI runner that can be used programmatically from tests.
 *
 * This sets up yargs with the same commands and options as the real `mtlx-ai` CLI,
 * but does not call `process.exit` on failure; callers can decide how to
 * handle errors.
 */
export async function runCli(argv: string[], deps: CliDeps): Promise<unknown> {
  // Get the directory of the current file (dist/index.js in production, src/index.ts in tests)
  const thisDir = dirname(fileURLToPath(import.meta.url));
  const defaultCommandsDir = join(thisDir, 'commands');
  // Source-level cloud tests execute this file through Vitest, while the local
  // MaterialX commands import compiled .js siblings. Load those local commands
  // from dist in that case; the installed CLI loads both sets from dist.
  const localCommandsDir =
    basename(dirname(thisDir)) === 'src'
      ? join(thisDir, '..', '..', 'dist', 'commands')
      : join(thisDir, '..', 'commands');
  const commandDirs = [localCommandsDir, defaultCommandsDir];
  const require = createRequire(import.meta.url);
  const packageInfo = require('../../package.json') as PackageJson;

  // Pre-load config defaults before commands are registered
  await initializeConfigDefaults(deps);

  let document: OpenCliDocument;
  const y = yargs(argv)
    .scriptName('mtlx')
    .usage('$0 <command> [options]')
    .command(await fileCommands({ commandDirs }))
    .command(createDocgenCommand(() => document))
    .option('parallel', {
      type: 'number',
      description: 'Number of parallel operations to run concurrently',
      default: 4,
    })
    .middleware((parsedArgv) => {
      setCliDeps(parsedArgv, deps);
    })
    .help()
    .alias('h', 'help')
    .version()
    .alias('v', 'version')
    .strict()
    .exitProcess(false)
    .fail((msg, err) => {
      // If the error is about missing subcommand, show help instead of throwing
      // This handles cases like "mtlx-ai config" or "mtlx-ai materials" without a subcommand
      if (!err) {
        const errorMsg = msg.toLowerCase();
        if (errorMsg.includes('must specify') || errorMsg.includes('subcommand')) {
          // Extract the command name from the error message if possible
          const commandMatch = msg.match(SUBCOMMAND_ERROR_REGEX);
          const commandName = commandMatch ? commandMatch[1] : 'command';
          console.error(`Please specify a ${commandName} subcommand.\n`);
          y.showHelp();
          // Throw a special error that we'll catch and ignore
          throw new HelpShownError();
        }
      }
      // Re-throw the error so it can be caught and formatted by the caller
      // This prevents yargs from printing the full error object
      if (err) {
        throw err;
      }
      throw new Error(msg);
    });

  document = fromYargs(
    yargs()
      .scriptName('mtlx')
      .command(await fileCommands({ commandDirs: [localCommandsDir] }))
      .command(createDocgenCommand(() => document)),
    infoFromPackageJson({
      name: packageInfo.name ?? 'mtlx-cli',
      version: packageInfo.version ?? '0.0.0',
      bin: { mtlx: './bin/cli.js' },
    }),
  );

  // Check if argv is completely empty (no arguments at all)
  // If so, show help. Otherwise let yargs handle --help, --version, etc. normally
  if (argv.length === 0) {
    console.error('Please specify a command.\n');
    y.showHelp();
    return;
  }

  try {
    // `parse` returns `Promise<unknown>` in async mode
    return await y.parse();
  } catch (error) {
    // If help was shown (via HelpShownError), return normally instead of throwing
    if (error instanceof HelpShownError) {
      return;
    }
    // If the error is about missing subcommand, show help instead
    // This handles cases like "mtlx-ai config" or "mtlx-ai materials" without a subcommand
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('must specify') || errorMsg.includes('subcommand')) {
        // Extract the command name from the error message if possible
        const commandMatch = error.message.match(SUBCOMMAND_ERROR_REGEX);
        const commandName = commandMatch ? commandMatch[1] : 'command';
        console.error(`Please specify a ${commandName} subcommand.\n`);
        y.showHelp();
        return;
      }
    }
    throw error;
  }
}

// Special error class to indicate help was shown
class HelpShownError extends Error {
  constructor() {
    super('Help shown');
    this.name = 'HelpShownError';
  }
}
