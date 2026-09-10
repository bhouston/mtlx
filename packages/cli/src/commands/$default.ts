import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  describe: 'Show basic CLI help',
  builder: (yargs) => yargs,
  handler: async () => {
    console.log('Use --help to see available MaterialX commands.');
  },
});
