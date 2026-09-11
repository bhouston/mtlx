import * as path from 'node:path';
import { open, rm } from 'node:fs/promises';
import { detectFormat, type MaterialXFormat } from 'mtlx-core';
import { loadMaterialXPackage, writeMaterialXPackage } from 'mtlx-core/node';

// Deliberately vscode-free (unlike mtlxOperations.ts) so it's plain-Node testable with vitest —
// the VS Code extension host module can't be resolved outside a running extension.

export type TargetFormat = MaterialXFormat;

export const outputPathFor = (fsPath: string, target: TargetFormat): string => {
  const dir = path.dirname(fsPath);
  const base = path
    .basename(fsPath)
    .replace(/\.mtlx\.zip$/i, '')
    .replace(/\.mtlx$/i, '');
  const extension = target === 'mtlx' ? '.mtlx' : '.mtlx.zip';
  return path.join(dir, `${base}${extension}`);
};

/**
 * Converts a .mtlx/.mtlx.zip file to the other format: load into a package, write back out in
 * the format the output extension implies. For a .mtlx target, resources are written beside the
 * document at their archive-relative paths.
 */
export const convertMaterialXFile = async (fsPath: string, target: TargetFormat): Promise<string> => {
  if (detectFormat(fsPath) === target) {
    throw new Error(`${path.basename(fsPath)} is already ${target}`);
  }
  const pkg = await loadMaterialXPackage(fsPath);
  const basePath = outputPathFor(fsPath, target);
  const extension = target === 'mtlx' ? '.mtlx' : '.mtlx.zip';
  let outputPath = basePath;
  for (let suffix = 2; ; suffix++) {
    try {
      // Reserve the destination atomically, including when concurrent conversions race.
      const handle = await open(outputPath, 'wx');
      await handle.close();
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      outputPath = `${basePath.slice(0, -extension.length)}-${suffix}${extension}`;
    }
  }
  try {
    return (await writeMaterialXPackage(pkg, outputPath)).outputPath;
  } catch (error) {
    await rm(outputPath, { force: true });
    throw error;
  }
};

export interface ConversionSummary {
  converted: string[];
  skipped: string[];
  failed: { path: string; message: string }[];
}

export async function convertMaterialXFiles(
  paths: string[],
  target: TargetFormat,
  onProgress: () => void = () => {},
): Promise<ConversionSummary> {
  const summary: ConversionSummary = { converted: [], skipped: [], failed: [] };
  for (const filePath of paths) {
    try {
      if (detectFormat(filePath) === target) summary.skipped.push(filePath);
      else summary.converted.push(await convertMaterialXFile(filePath, target));
    } catch (error) {
      summary.failed.push({ path: filePath, message: error instanceof Error ? error.message : String(error) });
    }
    onProgress();
  }
  return summary;
}
