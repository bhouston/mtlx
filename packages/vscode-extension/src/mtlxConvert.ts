import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
  detectFormat,
  packMaterialX,
  packMaterialXZip,
  unpackMaterialXZip,
  unpackMaterialZ,
  type MaterialXInputFormat,
} from 'mtlx-core';

// Deliberately vscode-free (unlike mtlxOperations.ts) so it's plain-Node testable with vitest —
// the VS Code extension host module can't be resolved outside a running extension.

export type TargetFormat = MaterialXInputFormat;

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
 * Converts a .mtlx/.mtlz/.mtlx.zip file to one of the other two formats. Archive-to-archive
 * conversions round-trip through a temp directory rather than duplicating pack/unpack logic —
 * mtlx-core owns all pack/unpack behavior, this just sequences its existing primitives.
 */
export const convertMaterialXFile = async (fsPath: string, target: TargetFormat): Promise<string> => {
  const source = detectFormat(fsPath);
  if (source === target) {
    throw new Error(`${path.basename(fsPath)} is already ${target}`);
  }

  const outputPath = outputPathFor(fsPath, target);

  if (target === 'mtlx') {
    const result = source === 'mtlz' ? await unpackMaterialZ(fsPath) : await unpackMaterialXZip(fsPath);
    return result.rootPath;
  }

  if (source === 'mtlx') {
    const result =
      target === 'mtlz' ? await packMaterialX(fsPath, { outputPath }) : await packMaterialXZip(fsPath, { outputPath });
    return result.outputPath;
  }

  // Archive -> archive (.mtlz <-> .mtlx.zip): unpack to a temp dir, then pack from there.
  const tempDir = await mkdtemp(path.join(tmpdir(), 'mtlx-convert-'));
  try {
    const unpacked =
      source === 'mtlz'
        ? await unpackMaterialZ(fsPath, { outputDir: tempDir })
        : await unpackMaterialXZip(fsPath, { outputDir: tempDir });
    const result =
      target === 'mtlz'
        ? await packMaterialX(unpacked.rootPath, { outputPath })
        : await packMaterialXZip(unpacked.rootPath, { outputPath });
    return result.outputPath;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};
