import { inspectMaterialXZipArchive } from 'mtlx-core';

// three.js's MaterialXLoader handles .mtlz/.mtlx.zip natively for 3D preview (see
// MaterialViewer.tsx), so this only pulls the raw .mtlx text back out for the validator.
export const extractMaterialXText = (bytes: ArrayBuffer): string => {
  const archive = inspectMaterialXZipArchive(new Uint8Array(bytes));
  if (!archive.rootEntry) {
    throw new Error(archive.issues[0]?.message ?? 'Archive does not contain a .mtlx file');
  }
  return new TextDecoder().decode(archive.rootEntry.data);
};
