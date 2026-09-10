import * as path from 'node:path';
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
    .replace(/\.(mtlx|mtlz)$/i, '');
  const extension = target === 'mtlx' ? '.mtlx' : target === 'mtlz' ? '.mtlz' : '.mtlx.zip';
  return path.join(dir, `${base}${extension}`);
};

/**
 * Converts a .mtlx/.mtlz/.mtlx.zip file to one of the other two formats: load into a package,
 * write back out in the format the output extension implies. For a .mtlx target, resources are
 * written beside the document at their archive-relative paths.
 */
export const convertMaterialXFile = async (fsPath: string, target: TargetFormat): Promise<string> => {
  if (detectFormat(fsPath) === target) {
    throw new Error(`${path.basename(fsPath)} is already ${target}`);
  }
  const result = await writeMaterialXPackage(await loadMaterialXPackage(fsPath), outputPathFor(fsPath, target));
  return result.outputPath;
};
