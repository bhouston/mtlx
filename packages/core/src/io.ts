import { readFile, writeFile } from 'node:fs/promises';
import { parseMaterialX, serializeMaterialX } from './xml.js';
import type { MaterialXDocument } from './types.js';

export const readMaterialX = async (path: string): Promise<MaterialXDocument> => {
  const xml = await readFile(path, 'utf8');
  return parseMaterialX(xml);
};

export const writeMaterialX = async (path: string, document: MaterialXDocument): Promise<void> => {
  const xml = serializeMaterialX(document);
  await writeFile(path, xml, 'utf8');
};
