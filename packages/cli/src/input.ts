import { parseMaterialX, readMaterialX, readMaterialXZipArchive, readMaterialZArchive } from '@mtlx/core';
import type { MaterialXDocument } from '@mtlx/core';

export type MaterialXInputFormat = 'mtlx' | 'mtlz' | 'mtlx.zip';

const textDecoder = new TextDecoder();

export const detectFormat = (inputPath: string): MaterialXInputFormat => {
  const lower = inputPath.toLowerCase();
  if (lower.endsWith('.mtlx.zip')) {
    return 'mtlx.zip';
  }
  if (lower.endsWith('.mtlz')) {
    return 'mtlz';
  }
  return 'mtlx';
};

/** Loads the MaterialX document out of a .mtlx, .mtlz, or .mtlx.zip path. */
export const loadMaterialXDocument = async (
  inputPath: string,
): Promise<{ document: MaterialXDocument; rootPath: string }> => {
  const format = detectFormat(inputPath);

  if (format === 'mtlx') {
    return { document: await readMaterialX(inputPath), rootPath: inputPath };
  }

  const archive = format === 'mtlz' ? await readMaterialZArchive(inputPath) : await readMaterialXZipArchive(inputPath);
  if (!archive.rootEntry) {
    throw new Error(`No root .mtlx entry found in ${inputPath}`);
  }
  return {
    document: parseMaterialX(textDecoder.decode(archive.rootEntry.data)),
    rootPath: archive.rootEntry.path,
  };
};
