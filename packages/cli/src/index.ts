import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { infoFromPackageJson } from '@clidoc/core';
import type { OpenCliDocument } from '@clidoc/core';
import { createDocgenCommand, fromYargs } from '@clidoc/yargs';
import type { PackageJson } from 'type-fest';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileCommands } from 'yargs-file-commands';

const require = createRequire(import.meta.url);
const packageInfo = require('../package.json') as PackageJson;
const distDir = path.dirname(fileURLToPath(import.meta.url));

export const main = async () => {
  const commandsDir = path.join(distDir, 'commands');
  const { name, version } = packageInfo;
  if (!name || !version) {
    throw new Error('Package info is not valid, name and version required');
  }
  const parser = yargs(hideBin(process.argv))
    .scriptName('mtlx')
    .version(version)
    .command(await fileCommands({ commandDirs: [commandsDir] }));

  let document: OpenCliDocument;
  parser
    .command(createDocgenCommand(() => document))
    .demandCommand(1, 'No command specified - use --help for available commands')
    .showHelpOnFail(true)
    .epilogue('Documentation: https://www.npmjs.com/package/mtlx-cli')
    .wrap(100)
    .help();
  // Build the OpenCLI document once every command, including docgen, is registered.
  document = fromYargs(parser, infoFromPackageJson({ name, version, bin: { mtlx: './bin/cli.js' } }));

  return parser.argv;
};
