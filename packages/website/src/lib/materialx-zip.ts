import { unzipSync } from 'fflate';

// three.js's MaterialXLoader handles .mtlz/.mtlx.zip natively for 3D preview (see
// MaterialViewer.tsx), so this is only used to pull the raw .mtlx text back out for
// mtlx-core's validator, which needs the XML text rather than a rendered material.
export const extractMaterialXText = (bytes: ArrayBuffer): string => {
  const unzipped = unzipSync(new Uint8Array(bytes));
  const entries = Object.entries(unzipped).filter(([entryPath]) => !entryPath.endsWith('/'));
  const mtlxEntries = entries.filter(([entryPath]) => entryPath.toLowerCase().endsWith('.mtlx'));
  const root = mtlxEntries.find(([entryPath]) => !entryPath.includes('/')) ?? mtlxEntries[0];

  if (!root) {
    throw new Error('Archive does not contain a .mtlx file');
  }

  return new TextDecoder().decode(root[1]);
};
