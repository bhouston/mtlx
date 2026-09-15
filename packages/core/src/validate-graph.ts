import { findNodeSpec } from './node-catalog.js';
import type { MaterialXElement, MaterialXNodeSpec, MaterialXValidationIssue } from './types.js';
import type { MaterialXValidationRule } from './validate.js';

export const nonGraphNodes = new Set([
  'nodedef',
  'implementation',
  'look',
  'lookgroup',
  'collection',
  'geominfo',
  'geompropdef',
  'typedef',
  'unitdef',
  'unittypedef',
  'propertyset',
  'variantset',
  'xi:include',
  'include',
  'parameter',
]);

/** Semantic checks for one scope. Document validation visits all scopes, including unconnected graphs. */
export function validateGraphScope(
  elements: MaterialXElement[],
  scope: string,
  location: string,
  catalog: MaterialXNodeSpec[],
  rules: Set<MaterialXValidationRule>,
  documentGraphs: MaterialXElement[],
): MaterialXValidationIssue[] {
  const nodes = elements
    .filter((e) => e.attributes.name && !nonGraphNodes.has(e.name) && !e.name.startsWith('#'))
    .map((element) => {
      const spec = findNodeSpec(element, catalog);
      const authoredOutputs = element.children
        .filter((p) => p.name === 'output')
        .map((p) => ({ name: p.attributes.name!, type: p.attributes.type }));
      const outputs =
        element.name === 'output'
          ? []
          : element.name === 'input'
            ? [{ name: 'out', type: element.attributes.type }]
            : authoredOutputs.length || element.name === 'nodegraph'
              ? authoredOutputs
              : spec?.outputs.length
                ? spec.outputs
                : [{ name: 'out', type: element.attributes.type }];
      return { id: element.attributes.name!, element, outputs };
    });
  const edges = nodes.flatMap((node) => {
    const ports =
      node.element.name === 'output'
        ? [node.element]
        : node.element.children.filter((p) => p.name === 'input' || p.name === 'parameter');
    return ports.flatMap((p) => {
      const source = p.attributes.nodename ?? p.attributes.nodegraph ?? p.attributes.interfacename;
      return source && nodes.some((n) => n.id === source)
        ? [
            {
              source,
              target: node.id,
              sourceHandle: p.attributes.output ?? 'out',
              targetHandle: node.element.name === 'output' ? 'in' : p.attributes.name!,
            },
          ]
        : [];
    });
  });
  const projection = { nodes, edges };
  const issues: MaterialXValidationIssue[] = [];
  const byId = new Map(projection.nodes.map((node) => [node.id, node]));
  for (const node of projection.nodes) {
    const report = (rule: 'structure' | 'types', code: string, message: string, input?: string, source?: string) => {
      if (!rules.has(rule)) return;
      const port =
        node.element.name === 'output' ? node.element : node.element.children.find((p) => p.attributes.name === input);
      issues.push({
        rule,
        code,
        level: 'error',
        location: `${location}/${node.element.name}:${node.id}${input && node.element.name !== 'output' ? `/${port?.name ?? 'input'}:${input}` : ''}`,
        message,
        graph: {
          scope,
          nodeIds: source && byId.has(source) ? [node.id, source] : [node.id],
          input,
          source,
          output: port?.attributes.output ?? (source ? 'out' : undefined),
        },
      });
    };
    const spec = findNodeSpec(node.element, catalog);
    if (node.element.attributes.nodedef && !catalog.some((s) => s.nodeDefName === node.element.attributes.nodedef))
      report('structure', 'UNRESOLVED_NODEDEF', `Cannot resolve node definition "${node.element.attributes.nodedef}".`);
    const ports =
      node.element.name === 'output'
        ? [node.element]
        : node.element.children.filter((p) => p.name === 'input' || p.name === 'parameter');
    for (const port of ports) {
      const a = port.attributes;
      const input = node.element.name === 'output' ? 'in' : a.name;
      const declared = [...(spec?.inputs ?? []), ...(spec?.parameters ?? [])].find((p) => p.name === input);
      const type = declared?.type ?? a.type;
      if (declared?.type && a.type && declared.type !== a.type)
        report(
          'types',
          'PORT_TYPE_MISMATCH',
          `Input type "${a.type}" does not match declared type "${declared.type}".`,
          input,
        );
      const sourceId = a.nodename ?? a.nodegraph ?? a.interfacename;
      if (sourceId) {
        const graph = a.nodegraph ? documentGraphs.find((e) => e.attributes.name === a.nodegraph) : undefined;
        const source =
          byId.get(sourceId) ??
          (graph
            ? {
                outputs: graph.children
                  .filter((p) => p.name === 'output')
                  .map((p) => ({ name: p.attributes.name!, type: p.attributes.type })),
              }
            : undefined);
        if (!source) {
          report('structure', 'UNRESOLVED_CONNECTION', `Cannot resolve connection source "${sourceId}".`, input);
          continue;
        }
        const output =
          source.outputs.length === 1 ? source.outputs[0] : source.outputs.find((p) => p.name === a.output);
        if (!output)
          report(
            'structure',
            'UNRESOLVED_OUTPUT',
            `Cannot resolve output "${a.output ?? 'out'}" on "${sourceId}".`,
            input,
            sourceId,
          );
        else if (
          output.type &&
          output.type !== 'multioutput' &&
          type &&
          output.type !== type &&
          !(output.type === 'string' && type === 'filename')
        )
          report(
            'types',
            'CONNECTION_TYPE_MISMATCH',
            `Connection from ${sourceId}.${output.name} has type "${output.type}"; expected "${type}".`,
            input,
            sourceId,
          );
      } else if (a.value !== undefined && type) {
        const count = (
          {
            float: 1,
            integer: 1,
            color3: 3,
            color4: 4,
            vector2: 2,
            vector3: 3,
            vector4: 4,
            matrix33: 9,
            matrix44: 16,
          } as Record<string, number>
        )[type];
        if (count) {
          const values = a.value.split(',').map((v) => v.trim());
          const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
          if (
            values.length !== count ||
            values.some(
              (v) =>
                !numeric.test(v) || !Number.isFinite(Number(v)) || (type === 'integer' && !Number.isInteger(Number(v))),
            )
          )
            report(
              'types',
              'INVALID_VALUE',
              `Invalid ${type} value "${a.value}". Expected ${count === 1 ? 'one number' : count + ' comma-separated numbers'}${type === 'integer' ? ' (an integer)' : ''}.`,
              input,
            );
        } else if (type === 'boolean' && !['true', 'false', '0', '1'].includes(a.value))
          report('types', 'INVALID_VALUE', `Invalid boolean value "${a.value}". Expected true, false, 0, or 1.`, input);
      }
    }
  }
  const outgoing = new Map<string, string[]>();
  for (const edge of projection.edges) outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  for (const edge of rules.has('structure') ? projection.edges : []) {
    const visited = new Set<string>();
    const pending = [edge.target];
    while (pending.length) {
      const id = pending.pop()!;
      if (id === edge.source) {
        const target = byId.get(edge.target)!;
        issues.push({
          rule: 'structure',
          code: 'CONNECTION_CYCLE',
          level: 'error',
          location: `${location}/${target.element.name}:${edge.target}${target.element.name === 'output' ? '' : `/input:${edge.targetHandle}`}`,
          message: `Connection from ${edge.source}.${edge.sourceHandle} forms a cycle.`,
          graph: {
            scope,
            nodeIds: [edge.target, edge.source],
            input: edge.targetHandle,
            source: edge.source,
            output: edge.sourceHandle,
          },
        });
        break;
      }
      if (visited.has(id)) continue;
      visited.add(id);
      pending.push(...(outgoing.get(id) ?? []));
    }
  }
  return issues;
}
