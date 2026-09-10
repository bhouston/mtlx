import type { MaterialXValidationIssue } from 'mtlx-core';
import { checkMaterialX } from 'mtlx-core/node';
import { defineCommand } from 'yargs-file-commands';
import { formatOption, printOutput } from '../output.js';

interface CheckResult {
  path: string;
  format: string;
  ok: boolean;
  issues: MaterialXValidationIssue[];
}

export const runCheck = async (inputPath: string): Promise<CheckResult> => {
  const result = await checkMaterialX(inputPath);
  return { ...result, ok: !result.issues.some((issue) => issue.level === 'error') };
};

const renderText = (result: CheckResult): string => {
  if (result.issues.length === 0) {
    return `Check passed: ${result.path}`;
  }
  const lines = result.issues.map((issue) => `${issue.level.toUpperCase()} ${issue.location}: ${issue.message}`);
  if (result.ok) {
    lines.push(`Check passed: ${result.path}`);
  }
  return lines.join('\n');
};

export const command = defineCommand({
  command: 'check <input>',
  describe: 'Validate a .mtlx, .mtlz, or .mtlx.zip file',
  builder: (yargs) =>
    yargs
      .positional('input', {
        describe: 'Path to .mtlx, .mtlz, or .mtlx.zip file',
        type: 'string',
        demandOption: true,
      })
      .options(formatOption),
  handler: async (argv) => {
    const result = await runCheck(argv.input);
    printOutput(result, argv.format, () => renderText(result));
    if (!result.ok) {
      process.exitCode = 1;
    }
  },
});
