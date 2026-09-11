import process from 'node:process';
import { defineCommand } from 'yargs-file-commands';
import { openInBrowser } from '../view/openBrowser.js';
import { startViewServer } from '../view/server.js';

export const command = defineCommand({
  command: 'view <input>',
  describe: 'Open a local 3D preview of a .mtlx or .mtlx.zip file in your browser',
  builder: (yargs) =>
    yargs.positional('input', {
      describe: 'Path to .mtlx or .mtlx.zip file',
      type: 'string',
      demandOption: true,
    }),
  handler: async (argv) => {
    try {
      const server = await startViewServer(argv.input);
      console.log(`Serving preview at ${server.url}`);
      console.log('Press Ctrl+C to stop.');
      openInBrowser(server.url);

      const shutdown = () => {
        void server.close().then(() => process.exit(0));
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`ERROR ${message}`);
      process.exitCode = 1;
    }
  },
});
