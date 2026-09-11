import { MATERIALX_VALIDATION_RULES, type MaterialXValidationRule, type MaterialXValidationIssue } from 'mtlx-core';
import { checkMaterialX } from 'mtlx-core/node';
import { defineCommand } from 'yargs-file-commands';
import { expandInputs } from '../inputs.js';
import { formatOption, printOutput } from '../output.js';

interface CheckResult {
  path: string;
  format: string;
  ok: boolean;
  issues: MaterialXValidationIssue[];
}

export const runCheck = async (
  inputPath: string,
  options: { strict?: boolean; rules?: readonly MaterialXValidationRule[] } = {},
): Promise<CheckResult> => {
  const result = await checkMaterialX(inputPath, { validation: { rules: options.rules ?? ['basic'] } });
  return { ...result, ok: !result.issues.some((issue) => issue.level === 'error' || options.strict) };
};

const renderText = (result: CheckResult): string => {
  if (result.issues.length === 0) {
    return `Selected document checks passed (0 warnings): ${result.path}`;
  }
  const lines = result.issues.map(
    (issue) =>
      `${issue.level.toUpperCase()}${issue.code ? ` [${issue.code}]` : ''} ${issue.location}: ${issue.message}`,
  );
  if (result.ok) {
    lines.push(
      `Selected document checks passed (${result.issues.filter((issue) => issue.level === 'warning').length} warnings): ${result.path}`,
    );
  }
  return lines.join('\n');
};

export const command = defineCommand({
  command: 'check <inputs..>',
  describe: 'Run selected document checks on one or more .mtlx or .mtlx.zip files (glob patterns accepted)',
  builder: (yargs) =>
    yargs
      .option('strict', { type: 'boolean', default: false, describe: 'Fail on warnings as well as errors' })
      .option('rules', {
        type: 'string',
        array: true,
        choices: [...MATERIALX_VALIDATION_RULES],
        default: ['basic'],
        describe: 'Rule groups to run; renderer checks require a capability inventory',
      })
      .options(formatOption),
  handler: async (argv) => {
    const inputs = await expandInputs(argv.inputs as string[]);
    const results: CheckResult[] = [];
    for (const input of inputs) {
      results.push(await runCheck(input, { strict: argv.strict, rules: argv.rules as MaterialXValidationRule[] }));
    }
    // A single input keeps the original scalar output shape; several inputs emit an array.
    const output = results.length === 1 ? results[0] : results;
    printOutput(output, argv.format, () => results.map(renderText).join('\n'));
    if (results.some((result) => !result.ok)) {
      process.exitCode = 1;
    }
  },
});
