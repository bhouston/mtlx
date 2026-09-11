import { inspectMaterialX, type ResourceReader } from 'mtlx-core';
import { supportedMaterialXCategories } from 'mtlx-viewer/capabilities';

/** Analyze the exact source bytes, including every rule and any host-readable dependencies. */
export const analyze = (fileName: string, raw: Uint8Array, readResource?: ResourceReader) =>
  inspectMaterialX(raw, fileName, { readResource, supportedCategories: supportedMaterialXCategories });
