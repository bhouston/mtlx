import { parseMaterialX } from './xml.js';
import { readMaterialX } from './io.js';
import { readMaterialXZipArchive } from './mtlxzip.js';
import { readMaterialZArchive } from './mtlz.js';
import type { MaterialXDocument } from './types.js';

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

/** Loads the MaterialX document out of a .mtlx, .mtlz, or .mtlx.zip path — the single place
 * every consumer (CLI, VS Code extension) should go through rather than re-implementing the
 * per-format dispatch. */
export const loadMaterialXDocument = async (
  inputPath: string,
): Promise<{ document: MaterialXDocument; rootPath: string; format: MaterialXInputFormat }> => {
  const format = detectFormat(inputPath);

  if (format === 'mtlx') {
    return { document: await readMaterialX(inputPath), rootPath: inputPath, format };
  }

  const archive = format === 'mtlz' ? await readMaterialZArchive(inputPath) : await readMaterialXZipArchive(inputPath);
  if (!archive.rootEntry) {
    throw new Error(`No root .mtlx entry found in ${inputPath}`);
  }
  return {
    document: parseMaterialX(textDecoder.decode(archive.rootEntry.data)),
    rootPath: archive.rootEntry.path,
    format,
  };
};
