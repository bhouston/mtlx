import type { MaterialXReadLimits } from './limits.js';
import { materialXNodeRegistry } from './registry.js';
import type { MaterialXDocument, MaterialXNode, MaterialXNodeSpec, MaterialXValidationIssue } from './types.js';
import { parseMaterialX } from './xml.js';

const buildRegistrySet = (registry: MaterialXNodeSpec[]): Set<string> =>
  new Set(registry.map((entry) => entry.category.toLowerCase()));

const validateNode = (
  node: MaterialXNode,
  location: string,
  knownCategories: Set<string>,
  issues: MaterialXValidationIssue[],
): void => {
  if (!node.category || !knownCategories.has(node.category.toLowerCase())) {
    issues.push({
      level: 'warning',
      location,
      message: `Unknown node category "${node.category}"`,
    });
  }

  for (const input of node.inputs) {
    if (!input.name) {
      issues.push({
        level: 'error',
        location,
        message: 'Node has an input with no name',
      });
    }
  }

  for (const output of node.outputs) {
    if (!output.name) {
      issues.push({
        level: 'error',
        location,
        message: 'Node has an output with no name',
      });
    }
  }
};

/**
 * *Checks a parsed document against the node registry and returns issues rather than throwing.*
 *
 * Unknown node categories are warnings; unnamed inputs or outputs are errors. Pass a custom
 * `registry` to validate against your own node definitions.
 *
 * Example:
 *
 * ```ts
 * const issues = validateDocument(parseMaterialX(xml, limits));
 * const ok = !issues.some((issue) => issue.level === 'error');
 * ```
 *
 * @category Validation
 */
export const validateDocument = (
  document: MaterialXDocument,
  registry: MaterialXNodeSpec[] = materialXNodeRegistry,
): MaterialXValidationIssue[] => {
  const issues: MaterialXValidationIssue[] = [];
  const knownCategories = buildRegistrySet(registry);

  for (const node of document.nodes) {
    validateNode(node, `materialx/${node.category}:${node.name ?? 'unnamed'}`, knownCategories, issues);
  }

  for (const nodeGraph of document.nodeGraphs) {
    for (const node of nodeGraph.nodes) {
      validateNode(
        node,
        `materialx/nodegraph:${nodeGraph.name ?? 'unnamed'}/${node.category}:${node.name ?? 'unnamed'}`,
        knownCategories,
        issues,
      );
    }
  }

  return issues;
};

/**
 * *Parses and validates MaterialX XML text, reporting a parse failure as an error issue instead
 * of throwing.* The building block behind every `check*` function.
 *
 * @category Validation
 */
export const checkMaterialXText = (
  xml: string,
  location = '',
  limits?: Partial<MaterialXReadLimits>,
): MaterialXValidationIssue[] => {
  try {
    return validateDocument(parseMaterialX(xml, limits));
  } catch (error) {
    return [{ level: 'error', location, message: error instanceof Error ? error.message : String(error) }];
  }
};
