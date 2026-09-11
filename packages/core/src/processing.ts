import { createHash } from 'node:crypto';
import {
  loadMaterialXDocument,
  loadMaterialXPackage,
  planMaterialXPackageWrite,
  commitMaterialXPackageWrite,
} from './node.js';
import type { WriteMaterialXPackageOptions } from './node.js';
import {
  mergeMaterialXPackages,
  packageToEntries,
  type MaterialXPackage,
  type MaterialXFormat,
  type Transform,
} from './package.js';
import type { MaterialXValidationOptions } from './validate.js';
import { validateMaterialXPackage } from './validate-package.js';
import type { MaterialXValidationIssue } from './types.js';

export type MaterialXProcessingStage =
  | 'parse'
  | 'resolve'
  | 'validate-input'
  | 'plan-transforms'
  | 'transform'
  | 'validate-output'
  | 'plan-output'
  | 'commit';

export interface MaterialXProcessingOptions {
  /** Transforms must only mutate the in-memory package; dry runs execute them too. */
  transforms?: Transform[];
  dryRun?: boolean;
  writeOptions?: WriteMaterialXPackageOptions;
  validation?: MaterialXValidationOptions;
  /** Shared virtual filesystem for a sequence of dry runs; successful plans reserve their paths. */
  plannedFiles?: Map<string, Uint8Array>;
}

export interface MaterialXProcessingResult {
  success: boolean;
  dryRun: boolean;
  inputs: string[];
  outputPath: string;
  rootPath?: string;
  format?: MaterialXFormat;
  entries: string[];
  stages: Array<{
    name: MaterialXProcessingStage;
    status: 'pending' | 'completed' | 'skipped' | 'failed';
    detail?: string;
  }>;
  operations: Array<{ name: string; status: 'planned' | 'completed' | 'unchanged' }>;
  changes: Array<{ path: string; action: 'write' | 'reuse'; bytes: number }>;
  warnings: MaterialXValidationIssue[];
  errors: Array<{ stage: MaterialXProcessingStage; location: string; message: string; code?: string }>;
  skippedOperations: Array<{ operation: string; reason: string }>;
  /** Before/after refer to uncompressed XML + resource payloads, not input archive size. */
  byteBasis: 'uncompressed-package';
  beforeBytes?: number;
  afterBytes?: number;
  /** Sum of all planned output files, including files reused from disk. */
  outputBytes?: number;
  /** Bytes actually written by a successful commit; zero for dry runs. */
  bytesWritten: number;
}

const stageNames: MaterialXProcessingStage[] = [
  'parse',
  'resolve',
  'validate-input',
  'plan-transforms',
  'transform',
  'validate-output',
  'plan-output',
  'commit',
];

const payloadBytes = (pkg: MaterialXPackage): number =>
  packageToEntries(pkg).reduce((total, entry) => total + entry.data.byteLength, 0);

const packageFingerprint = (pkg: MaterialXPackage): string => {
  const hash = createHash('sha256');
  for (const entry of packageToEntries(pkg)) {
    hash.update(JSON.stringify([entry.path, entry.data.byteLength]));
    hash.update(entry.data);
  }
  return hash.digest('hex');
};

/**
 * Process one input, or combine several, with stage diagnostics and a reviewable write plan.
 * A dry run performs transforms in memory and filesystem planning but never commits output.
 * Custom transforms are responsible for honoring their in-memory-only contract.
 */
export const processMaterialX = async (
  inputPath: string | string[],
  outputPath: string,
  options: MaterialXProcessingOptions = {},
): Promise<MaterialXProcessingResult> => {
  const inputs = typeof inputPath === 'string' ? [inputPath] : [...inputPath];
  const result: MaterialXProcessingResult = {
    success: false,
    dryRun: options.dryRun ?? false,
    inputs,
    outputPath,
    entries: [],
    stages: stageNames.map((name) => ({ name, status: 'pending' })),
    operations: [],
    changes: [],
    warnings: [],
    errors: [],
    skippedOperations: [],
    byteBasis: 'uncompressed-package',
    bytesWritten: 0,
  };
  let current: MaterialXProcessingStage = 'parse';
  const run = async <T>(name: MaterialXProcessingStage, action: () => T | Promise<T>): Promise<T> => {
    current = name;
    const value = await action();
    result.stages.find((stage) => stage.name === name)!.status = 'completed';
    return value;
  };
  const skip = (name: MaterialXProcessingStage, reason: string) => {
    Object.assign(result.stages.find((stage) => stage.name === name)!, { status: 'skipped', detail: reason });
    result.skippedOperations.push({ operation: name, reason });
  };
  const validate = (pkg: MaterialXPackage) => {
    const validation = options.validation ?? { rules: ['basic', 'structure', 'types', 'resources'] as const };
    const issues = validateMaterialXPackage(pkg, validation);
    for (const issue of issues) {
      if (issue.level === 'error') {
        result.errors.push({ stage: current, location: issue.location, message: issue.message, code: issue.code });
      } else if (
        !result.warnings.some((existing) => existing.location === issue.location && existing.message === issue.message)
      ) {
        result.warnings.push(issue);
      }
    }
    if (issues.some((issue) => issue.level === 'error')) throw new Error('MaterialX validation failed');
  };

  try {
    await run('parse', async () => {
      if (inputs.length === 0) throw new Error('At least one input is required');
      if (options.plannedFiles && !result.dryRun) throw new Error('plannedFiles is only supported for dry runs');
      // Keep parse failures distinct from dependency resolution failures. Package loading
      // currently repeats this read; the public loader remains the authority on resolution.
      for (const input of inputs) await loadMaterialXDocument(input);
    });
    const packages = await run('resolve', async () => {
      const loaded: MaterialXPackage[] = [];
      for (const input of inputs) loaded.push(await loadMaterialXPackage(input));
      return loaded;
    });
    await run('validate-input', () => {
      for (const pkg of packages) validate(pkg);
    });
    let pkg!: MaterialXPackage;
    const transforms = options.transforms ?? [];
    await run('plan-transforms', () => {
      result.beforeBytes = packages.reduce((total, entry) => total + payloadBytes(entry), 0);
      pkg = mergeMaterialXPackages(packages);
      result.operations = transforms.map((entry, index) => ({
        name: entry.name || `transform-${index + 1}`,
        status: 'planned',
      }));
    });
    if (transforms.length === 0) {
      skip('transform', 'No transforms requested');
    } else {
      await run('transform', async () => {
        for (const [index, operation] of transforms.entries()) {
          const before = packageFingerprint(pkg);
          await operation(pkg);
          const unchanged = packageFingerprint(pkg) === before;
          const report = result.operations[index]!;
          report.status = unchanged ? 'unchanged' : 'completed';
          if (unchanged)
            result.skippedOperations.push({
              operation: report.name,
              reason: 'No serialized document or resource bytes changed',
            });
        }
      });
    }
    await run('validate-output', () => {
      validate(pkg);
      result.afterBytes = payloadBytes(pkg);
    });
    const plan = await run('plan-output', () =>
      planMaterialXPackageWrite(pkg, outputPath, {
        ...options.writeOptions,
        ...(options.plannedFiles ? { plannedFiles: options.plannedFiles } : {}),
      }),
    );
    result.rootPath = plan.rootPath;
    result.format = plan.format;
    result.entries = plan.entries;
    result.changes = plan.files.map((file) => ({ path: file.path, action: file.action, bytes: file.data.byteLength }));
    result.outputBytes = result.changes.reduce((total, file) => total + file.bytes, 0);
    if (result.dryRun) {
      skip('commit', 'Dry run: no output files or directories created');
      for (const file of plan.files) options.plannedFiles?.set(file.path, file.data);
    } else {
      await run('commit', () => commitMaterialXPackageWrite(plan));
      result.bytesWritten = result.changes.reduce(
        (total, file) => total + (file.action === 'write' ? file.bytes : 0),
        0,
      );
    }
    result.success = true;
  } catch (error) {
    result.stages.find((stage) => stage.name === current)!.status = 'failed';
    if (!result.errors.some((issue) => issue.stage === current)) {
      result.errors.push({
        stage: current,
        location: outputPath,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    for (const stage of result.stages) {
      if (stage.status === 'pending') skip(stage.name, `Blocked by failed ${current} stage`);
    }
  }
  return result;
};
