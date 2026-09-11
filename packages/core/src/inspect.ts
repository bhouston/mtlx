import { DEFAULT_MATERIALX_READ_LIMITS } from './limits.js';
import { checkMaterialXZipArchive, inspectMaterialXZipArchive } from './mtlxzip.js';
import type { MaterialXPackage, MaterialXResource, ResourceReader } from './package.js';
import { buildResourceGraph } from './resource-graph.js';
import { summarizeMaterialX, type MaterialXSummary } from './summary.js';
import type { MaterialXValidationIssue } from './types.js';
import { MATERIALX_VALIDATION_RULES, validateDocument } from './validate.js';
import { validateMaterialXPackage } from './validate-package.js';
import { parseMaterialX } from './xml.js';

/** Results of every available rule, with explicit resource coverage. @category Validation */
export interface MaterialXInspection {
  issues: MaterialXValidationIssue[];
  summary?: MaterialXSummary;
  parseError?: string;
  resourcesChecked: boolean;
  /** All attempted paths, including missing files, relative to the root document's directory. */
  resourcePaths: string[];
  /** Successfully read loose resources; hosts may reuse their bytes for rendering. */
  resources: MaterialXResource[];
}

/**
 * Inspects XML or ZIP bytes using all validation rules. A host reader enables recursive loose
 * dependency checks without mutating source bytes; archives use their own inventory. Reader
 * failures are collected so one missing file does not hide other issues. The host must bound
 * each read; this function also bounds dependency count and total retained bytes.
 * @category Validation
 */
export async function inspectMaterialX(
  raw: Uint8Array,
  fileName: string,
  options: { readResource?: ResourceReader; supportedCategories?: readonly string[] } = {},
): Promise<MaterialXInspection> {
  const result: MaterialXInspection = { issues: [], resourcesChecked: false, resourcePaths: [], resources: [] };
  const validation = { rules: MATERIALX_VALIDATION_RULES, supportedCategories: options.supportedCategories };
  try {
    if ((raw[0] === 0x50 && raw[1] === 0x4b) || /\.mtlx\.zip(?:[?#]|$)/i.test(fileName)) {
      const archive = inspectMaterialXZipArchive(raw);
      result.issues = checkMaterialXZipArchive(raw, undefined, validation);
      result.resourcesChecked = true;
      if (!archive.rootEntry)
        throw new Error(result.issues.map((issue) => issue.message).join('\n') || 'No root MaterialX document');
      result.summary = summarizeMaterialX(fileName, parseMaterialX(new TextDecoder().decode(archive.rootEntry.data)));
      return result;
    }
    const document = parseMaterialX(new TextDecoder().decode(raw));
    result.summary = summarizeMaterialX(fileName, document);
    // Keep graph identities relative to the root directory. Hosts resolve these against a URI/URL.
    const pkg: MaterialXPackage = {
      rootPath: fileName.split(/[?#]/)[0]!.split('/').at(-1) || 'material.mtlx',
      document,
      resources: result.resources,
    };
    const initialEdges = buildResourceGraph(pkg).edges;
    if (!options.readResource && initialEdges.length) {
      result.resourcePaths = [...new Set(initialEdges.map((edge) => edge.targetPath))];
      result.issues = validateDocument(document, validation);
      return result;
    }
    const attempted = new Set<string>([pkg.rootPath]);
    let totalBytes = raw.byteLength;
    while (true) {
      const targets = [...new Set(buildResourceGraph(pkg).edges.map((edge) => edge.targetPath))].filter(
        (target) => !attempted.has(target),
      );
      if (!targets.length) break;
      for (const target of targets) {
        attempted.add(target);
        result.resourcePaths.push(target);
        if (
          attempted.size > DEFAULT_MATERIALX_READ_LIMITS.maxArchiveEntries ||
          totalBytes >= DEFAULT_MATERIALX_READ_LIMITS.maxExpandedBytes
        ) {
          result.issues.push({
            level: 'error',
            rule: 'resources',
            code: 'RESOURCE_LIMIT',
            location: target,
            message: 'Dependency inspection limit exceeded; remaining resources were not read.',
          });
          result.issues.push(...validateMaterialXPackage(pkg, validation));
          return result;
        }
        try {
          const data = await options.readResource!(target);
          totalBytes += data.byteLength;
          if (
            data.byteLength > DEFAULT_MATERIALX_READ_LIMITS.maxEntryBytes ||
            totalBytes > DEFAULT_MATERIALX_READ_LIMITS.maxExpandedBytes
          )
            throw new Error('Resource byte limit exceeded');
          const resource: MaterialXResource = { id: target, archivePath: target, sourcePath: target, data };
          if (/\.mtlx(?:[?#]|$)/i.test(target)) resource.document = parseMaterialX(new TextDecoder().decode(data));
          result.resources.push(resource);
        } catch (error) {
          result.issues.push({
            level: 'error',
            rule: 'resources',
            code: 'RESOURCE_READ_FAILED',
            location: target,
            message: `Could not inspect resource: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }
    }
    result.resourcesChecked = true;
    result.issues.push(...validateMaterialXPackage(pkg, validation));
  } catch (error) {
    result.parseError = error instanceof Error ? error.message : String(error);
    result.issues.push({ level: 'error', code: 'PARSE_ERROR', location: fileName, message: result.parseError });
  }
  return result;
}
