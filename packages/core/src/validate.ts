import { getNodeCatalog, findNodeSpec, getNodeGraphScope } from './node-catalog.js';
import { validateGraphScope, nonGraphNodes } from './validate-graph.js';
import type { MaterialXReadLimits } from './limits.js';
import { materialXNodeRegistry } from './registry.js';
import type { MaterialXDocument, MaterialXElement, MaterialXNodeSpec, MaterialXValidationIssue } from './types.js';
import { parseMaterialX } from './xml.js';

export const MATERIALX_VALIDATION_RULES = ['basic', 'structure', 'types', 'resources', 'renderer-support'] as const;
export type MaterialXValidationRule = (typeof MATERIALX_VALIDATION_RULES)[number];
export interface MaterialXValidationOptions {
  registry?: MaterialXNodeSpec[];
  /** Defaults to basic. These checks do not establish full MaterialX conformance. */
  rules?: readonly MaterialXValidationRule[];
  /** Resolved document-relative resource names, provided by the host. */
  availableResources?: readonly string[];
  /** Categories explicitly supported by the host renderer; omission reports unassessed. */
  supportedCategories?: readonly string[];
}

/** Validates selected independent rules. The legacy custom-registry argument remains supported. */
export const validateDocument = (
  document: MaterialXDocument,
  registryOrOptions: MaterialXNodeSpec[] | MaterialXValidationOptions = materialXNodeRegistry,
): MaterialXValidationIssue[] => {
  const options = Array.isArray(registryOrOptions) ? { registry: registryOrOptions } : registryOrOptions;
  const registry = options.registry ?? materialXNodeRegistry;
  const rules = new Set<MaterialXValidationRule>(options.rules ?? ['basic']);
  const issues: MaterialXValidationIssue[] = [];
  const issue = (
    rule: MaterialXValidationRule,
    code: string,
    location: string,
    message: string,
    level: 'error' | 'warning' = 'error',
  ) => {
    issues.push({ rule, code, location, message, level });
  };
  const customDefinitions = document.elements.filter((element) => element.name === 'nodedef');
  const knownCategories = new Set([
    ...registry.map((entry) => entry.category.toLowerCase()),
    ...customDefinitions.map((element) => element.attributes.node?.toLowerCase()),
  ]);
  const checkNode = (node: MaterialXElement, location: string) => {
    if (
      nonGraphNodes.has(node.name) ||
      ['nodegraph', 'input', 'output'].includes(node.name) ||
      node.name.startsWith('#')
    )
      return;
    if (rules.has('basic')) {
      if (!knownCategories.has(node.name.toLowerCase()))
        issue('basic', 'UNKNOWN_NODE_CATEGORY', location, `Unknown node category "${node.name}"`, 'warning');
      for (const port of node.children.filter((p) => p.name === 'input' || p.name === 'output')) {
        if (!port.attributes.name)
          issue('basic', 'MISSING_PORT_NAME', location, `Node has an ${port.name} with no name`);
      }
    }
    if (
      rules.has('renderer-support') &&
      options.supportedCategories &&
      !options.supportedCategories.includes(node.name)
    ) {
      issue(
        'renderer-support',
        'RENDERER_CATEGORY_UNSUPPORTED',
        location,
        `Renderer does not declare support for "${node.name}"`,
        'warning',
      );
    }
  };
  let catalog = registry;
  if (rules.has('structure') || rules.has('types')) {
    try {
      catalog = getNodeCatalog(document, registry);
    } catch (error) {
      issue(
        rules.has('structure') ? 'structure' : 'types',
        'NODEDEF_INHERITANCE_CYCLE',
        'materialx',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  const containersByGraph = new Map<string, { scope: string; nodeId: string }[]>();
  const walkScope = (elements: MaterialXElement[], location: string, scope = '', graphScope = true) => {
    if (graphScope && (rules.has('structure') || rules.has('types')))
      issues.push(
        ...validateGraphScope(
          elements,
          scope,
          location,
          catalog,
          rules,
          document.elements.filter((e) => e.name === 'nodegraph'),
        ),
      );
    const names = new Set<string>();
    const visit = (element: MaterialXElement, path: string) => {
      const attributes = element.attributes;
      if (rules.has('resources') && options.availableResources) {
        const reference =
          attributes.type === 'filename'
            ? attributes.value
            : element.name === 'include' || element.name === 'xi:include'
              ? attributes.href
              : undefined;
        if (reference && !options.availableResources.includes(reference))
          issue('resources', 'RESOURCE_MISSING', path, `Resource "${reference}" is unavailable`);
      }
      if (element.name === 'nodegraph')
        walkScope(element.children, path, scope ? `${scope}/${attributes.name}` : (attributes.name ?? 'unnamed'));
      else if (element.name === 'nodedef') walkScope(element.children, path, scope, false);
      else {
        const childNames = new Set<string>();
        for (const child of element.children) {
          const childName = child.attributes.name;
          const childPath = `${path}/${child.name}:${childName ?? 'unnamed'}`;
          if (rules.has('structure') && childName && childNames.has(childName)) {
            issue('structure', 'DUPLICATE_NAME', childPath, `Duplicate name "${childName}" in this scope`);
            if (graphScope && element.attributes.name && !nonGraphNodes.has(element.name))
              issues[issues.length - 1]!.graph = { scope, nodeIds: [element.attributes.name], input: childName };
          }
          if (childName) childNames.add(childName);
          visit(child, childPath);
        }
      }
    };
    for (const element of elements) {
      const name = element.attributes.name;
      const path = `${location}/${element.name}:${name ?? 'unnamed'}`;
      if (rules.has('structure') && name) {
        if (names.has(name)) {
          issue('structure', 'DUPLICATE_NAME', path, `Duplicate name "${name}" in this scope`);
          if (graphScope && !nonGraphNodes.has(element.name))
            issues[issues.length - 1]!.graph = { scope, nodeIds: [name] };
        }
        names.add(name);
      }
      if (graphScope) {
        checkNode(element, path);
        const implementation = nonGraphNodes.has(element.name)
          ? undefined
          : getNodeGraphScope(document, element, scope, findNodeSpec(element, catalog));
        if (implementation !== undefined && name) {
          const containers = containersByGraph.get(implementation) ?? [];
          containers.push({ scope, nodeId: name });
          containersByGraph.set(implementation, containers);
        }
      }
      visit(element, path);
    }
  };
  walkScope(document.elements, 'materialx');
  // Keep one finding at its source and attach every containing instance. A visited
  // scope set also bounds recursive implementation references and shared graphs.
  for (const finding of issues) {
    if (!finding.graph) continue;
    const pending = [finding.graph.scope];
    const visited = new Set<string>();
    const containers: { scope: string; nodeId: string }[] = [];
    while (pending.length) {
      const scope = pending.pop()!;
      if (visited.has(scope)) continue;
      visited.add(scope);
      for (const container of containersByGraph.get(scope) ?? []) {
        if (!containers.some((entry) => entry.scope === container.scope && entry.nodeId === container.nodeId))
          containers.push(container);
        pending.push(container.scope);
      }
    }
    if (containers.length) finding.graph.containers = containers;
  }
  if (rules.has('resources') && !options.availableResources)
    issue(
      'resources',
      'RESOURCES_UNASSESSED',
      'materialx',
      'Resource completeness was not assessed: no resolved resource inventory supplied',
      'warning',
    );
  if (rules.has('renderer-support') && !options.supportedCategories)
    issue(
      'renderer-support',
      'RENDERER_SUPPORT_UNASSESSED',
      'materialx',
      'Renderer support was not assessed: no renderer capability inventory supplied; shaders were not compiled',
      'warning',
    );
  return issues;
};

/** Parse failures are reported as issues, rather than thrown. */
export const checkMaterialXText = (
  xml: string,
  location = '',
  limits?: Partial<MaterialXReadLimits>,
  options?: MaterialXValidationOptions,
): MaterialXValidationIssue[] => {
  try {
    return validateDocument(parseMaterialX(xml, limits), options);
  } catch (error) {
    return [
      {
        code: 'PARSE_ERROR',
        rule: 'basic',
        level: 'error',
        location,
        message: error instanceof Error ? error.message : String(error),
      },
    ];
  }
};
