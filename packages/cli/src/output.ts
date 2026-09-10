import { stringify } from 'yaml';

export type OutputFormat = 'text' | 'json' | 'yaml';

/** Spread onto a command's yargs builder: `yargs.positional(...).options(formatOption)`. */
export const formatOption = {
  format: {
    choices: ['text', 'json', 'yaml'] as const,
    default: 'text' as OutputFormat,
    describe: 'Output format',
  },
} as const;

/** Every command routes its result through this so text/json/yaml stay consistent. */
export const printOutput = (data: unknown, format: OutputFormat, renderText: () => string): void => {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else if (format === 'yaml') {
    console.log(stringify(data).trimEnd());
  } else {
    console.log(renderText());
  }
};
