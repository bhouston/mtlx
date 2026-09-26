import { hideBin } from 'yargs/helpers';
import { createDefaultCliDeps } from './cloud/lib/deps.js';
import { runCli } from './cloud/runCli.js';

export * from './cloud/index.js';

/** The installed binary and in-process integration tests use the same parser. */
export const main = () => runCli(hideBin(process.argv), createDefaultCliDeps());
