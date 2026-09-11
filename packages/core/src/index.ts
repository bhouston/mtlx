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
  relocateTextureResources,
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
export type { MaterialXValidationOptions, MaterialXValidationRule } from './validate.js';
export { MATERIALX_VALIDATION_RULES, checkMaterialXText, validateDocument } from './validate.js';
export { createMaterialXDocument, cloneMaterialXDocument, parseMaterialX, serializeMaterialX } from './xml.js';

export {
  buildResourceGraph,
  cloneMaterialXPackage,
  planResourceDestinations,
  applyResourceDestinations,
} from './resource-graph.js';
export type { MaterialXResourceGraph, MaterialXDependencyEdge } from './resource-graph.js';

export { DEFAULT_MATERIALX_READ_LIMITS } from './limits.js';
export type { MaterialXReadLimits } from './limits.js';

export { validateMaterialXPackage } from './validate-package.js';

export { inspectMaterialX } from './inspect.js';
export type { MaterialXInspection } from './inspect.js';
