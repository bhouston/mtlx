/**
 * Parse, validate, package, and transform MaterialX documents. Pure: runs in Node, browsers, and
 * workers alike. Filesystem helpers live in `mtlx-core/node`; texture processing (which needs
 * sharp) lives in `mtlx-core/textures`.
 *
 * @module mtlx-core
 */
export { checkMaterialXZipArchive, createMaterialXZipArchive, inspectMaterialXZipArchive } from './mtlxzip.js';
export type { MaterialXZipArchive, MaterialXZipEntry } from './mtlxzip.js';
export {
  detectFormat,
  mergeMaterialXPackages,
  packageFromArchive,
  packageToEntries,
  resolveMaterialXResources,
  rewriteResourcePath,
  transform,
} from './package.js';
export type {
  MaterialXFormat,
  MaterialXPackage,
  MaterialXPackageEntry,
  MaterialXResource,
  ResourceReader,
  Transform,
} from './package.js';
export { materialXNodeRegistry } from './registry.js';
export { summarizeMaterialX } from './summary.js';
export type { MaterialInfo, MaterialXSummary } from './summary.js';
export type {
  MaterialXDocument,
  MaterialXElement,
  MaterialXInput,
  MaterialXNode,
  MaterialXNodeGraph,
  MaterialXNodePortSpec,
  MaterialXNodeSpec,
  MaterialXOutput,
  MaterialXParameter,
  MaterialXValidationIssue,
  MaterialXValueType,
} from './types.js';
export { checkMaterialXText, validateDocument } from './validate.js';
export { parseMaterialX, serializeMaterialX } from './xml.js';
