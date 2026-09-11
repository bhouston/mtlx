import type { MaterialXReadLimits } from './limits.js';
import { materialXNodeRegistry } from './registry.js';
import type {
  MaterialXDocument,
  MaterialXElement,
  MaterialXNode,
  MaterialXNodeSpec,
  MaterialXValidationIssue,
} from './types.js';
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
  const rules = new Set(options.rules ?? ['basic']);
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
  const checkNode = (node: MaterialXNode, location: string) => {
    if (
      [
        'nodedef',
        'implementation',
        'typedef',
        'unitdef',
        'unittypedef',
        'geominfo',
        'look',
        'lookgroup',
        'collection',
        'propertyset',
        'variantset',
        'include',
        'xi:include',
      ].includes(node.category)
    )
      return;
    if (rules.has('basic')) {
      if (!knownCategories.has(node.category.toLowerCase()))
        issue('basic', 'UNKNOWN_NODE_CATEGORY', location, `Unknown node category "${node.category}"`, 'warning');
      for (const port of [...node.inputs, ...node.outputs]) {
        if (!port.name)
          issue(
            'basic',
            'MISSING_PORT_NAME',
            location,
            `Node has an ${node.inputs.includes(port) ? 'input' : 'output'} with no name`,
          );
      }
    }
    if (rules.has('types')) {
      const explicit = node.attributes.nodedef;
      const local = customDefinitions.filter((entry) =>
        explicit
          ? entry.attributes.name === explicit
          : entry.attributes.node === node.category && entry.attributes.type === node.type,
      );
      const definitions: MaterialXNodeSpec[] = local.length
        ? local.map((entry) => ({
            category: entry.attributes.node!,
            type: entry.attributes.type,
            inputs: entry.children
              .filter((child) => child.name === 'input')
              .map((child) => ({ name: child.attributes.name!, type: child.attributes.type })),
            outputs: [],
            parameters: [],
          }))
        : registry.filter((entry) =>
            explicit ? entry.nodeDefName === explicit : entry.category === node.category && entry.type === node.type,
          );
      // Ambiguous overloads are deliberately not guessed. Custom definitions override built-ins.
      for (const input of node.inputs) {
        const candidates = definitions.map(
          (definition) => definition.inputs.find((port) => port.name === input.name)?.type,
        );
        const expected = candidates[0];
        if (expected && candidates.every((type) => type === expected) && input.type && input.type !== expected) {
          issue(
            'types',
            'PORT_TYPE_MISMATCH',
            `${location}/input:${input.name}`,
            `Input type "${input.type}" does not match declared type "${expected}"`,
          );
        }
      }
    }
    if (
      rules.has('renderer-support') &&
      options.supportedCategories &&
      !options.supportedCategories.includes(node.category)
    ) {
      issue(
        'renderer-support',
        'RENDERER_CATEGORY_UNSUPPORTED',
        location,
        `Renderer does not declare support for "${node.category}"`,
        'warning',
      );
    }
  };
  for (const node of document.nodes) checkNode(node, `materialx/${node.category}:${node.name ?? 'unnamed'}`);
  for (const graph of document.nodeGraphs) {
    for (const node of graph.nodes)
      checkNode(node, `materialx/nodegraph:${graph.name ?? 'unnamed'}/${node.category}:${node.name ?? 'unnamed'}`);
  }

  const graphByName = new Map(
    document.elements.filter((element) => element.name === 'nodegraph').map((graph) => [graph.attributes.name, graph]),
  );
  const walkScope = (elements: MaterialXElement[], location: string) => {
    const names = new Set<string>();
    const nodes = new Map(
      elements
        .filter((element) => !['input', 'output', 'parameter'].includes(element.name))
        .map((element) => [element.attributes.name, element]),
    );
    const visit = (element: MaterialXElement, path: string) => {
      const attributes = element.attributes;
      if ((rules.has('structure') || rules.has('types')) && (attributes.nodename || attributes.nodegraph)) {
        const target = attributes.nodename ? nodes.get(attributes.nodename) : graphByName.get(attributes.nodegraph);
        if (!target && rules.has('structure'))
          issue(
            'structure',
            'UNRESOLVED_CONNECTION',
            path,
            `Cannot resolve ${attributes.nodename ? 'node' : 'nodegraph'} "${attributes.nodename ?? attributes.nodegraph}"`,
          );
        else if (target) {
          const outputs = target.children.filter((child) => child.name === 'output');
          if (
            rules.has('structure') &&
            attributes.output &&
            outputs.length !== 1 &&
            (target.name === 'nodegraph' || outputs.length > 1) &&
            !outputs.some((output) => output.attributes.name === attributes.output)
          ) {
            issue('structure', 'UNRESOLVED_OUTPUT', path, `Cannot resolve output "${attributes.output}"`);
          }
          const connectedType =
            outputs.length === 1
              ? outputs[0]!.attributes.type
              : attributes.output && outputs.length > 1
                ? outputs.find((output) => output.attributes.name === attributes.output)?.attributes.type
                : target.attributes.type;
          if (
            rules.has('types') &&
            connectedType &&
            connectedType !== 'multioutput' &&
            attributes.type &&
            connectedType !== attributes.type &&
            !(connectedType === 'string' && attributes.type === 'filename')
          ) {
            issue(
              'types',
              'CONNECTION_TYPE_MISMATCH',
              path,
              `Connection type "${connectedType}" does not match port type "${attributes.type}"`,
            );
          }
        }
      }
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
      if (element.name === 'nodegraph' || element.name === 'nodedef') walkScope(element.children, path);
      else {
        const childNames = new Set<string>();
        for (const child of element.children) {
          const childName = child.attributes.name;
          const childPath = `${path}/${child.name}:${childName ?? 'unnamed'}`;
          if (rules.has('structure') && childName && childNames.has(childName))
            issue('structure', 'DUPLICATE_NAME', childPath, `Duplicate name "${childName}" in this scope`);
          if (childName) childNames.add(childName);
          visit(child, childPath);
        }
      }
    };
    for (const element of elements) {
      const name = element.attributes.name;
      const path = `${location}/${element.name}:${name ?? 'unnamed'}`;
      if (rules.has('structure') && name) {
        if (names.has(name)) issue('structure', 'DUPLICATE_NAME', path, `Duplicate name "${name}" in this scope`);
        names.add(name);
      }
      visit(element, path);
    }
  };
  walkScope(document.elements, 'materialx');
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
