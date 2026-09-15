import {
  cloneMaterialXDocument,
  findNodeSpec,
  getNodeCatalog,
  nodeType,
  type MaterialXDocument,
  type MaterialXElement,
  type MaterialXNodePortSpec,
  type MaterialXNodeSpec,
} from 'mtlx-core';
import { findNodeFamily, type NodeFamily } from './node-families.js';

const nonNodes = new Set([
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
export const resolutionKey = (scope: string, id: string) => (scope ? `${scope}/${id}` : id);
const authoredPorts = (element: MaterialXElement, tag: string) => element.children.filter((p) => p.name === tag);
const asPort = (p: MaterialXElement): MaterialXNodePortSpec => ({ ...p.attributes, name: p.attributes.name! });
const inputPort = (spec: MaterialXNodeSpec, name: string) =>
  [...spec.inputs, ...spec.parameters].find((p) => p.name === name);
const outputPort = (spec: MaterialXNodeSpec, name: string) =>
  spec.outputs.length === 1 ? spec.outputs[0] : spec.outputs.find((p) => p.name === name);
const compatible = (from?: string, to?: string) =>
  !from || !to || from === to || (from === 'string' && to === 'filename');

export interface ResolvedNode {
  element: MaterialXElement;
  scope: string;
  family?: NodeFamily;
  candidates: MaterialXNodeSpec[];
  /** A jointly compatible fallback; never an inference constraint. */
  definition?: MaterialXNodeSpec;
  type?: string;
  inputs: MaterialXNodePortSpec[];
  outputs: MaterialXNodePortSpec[];
  conflict: boolean;
}
interface Entry {
  key: string;
  scope: string;
  element: MaterialXElement;
  family?: NodeFamily;
  base: MaterialXNodeSpec[];
}
interface Wire {
  from: number;
  to: number;
  output: string;
  input: string;
}
export interface TypeResolution {
  nodes: Map<string, ResolvedNode>;
  conflicts: { scope: string; nodeIds: string[] }[];
}

function fixedDefinition(element: MaterialXElement, catalog: MaterialXNodeSpec[]): MaterialXNodeSpec {
  const spec = findNodeSpec(element, catalog);
  const inputs = new Map([...(spec?.inputs ?? []), ...(spec?.parameters ?? [])].map((p) => [p.name, p]));
  for (const p of [...authoredPorts(element, 'input'), ...authoredPorts(element, 'parameter')])
    inputs.set(p.attributes.name!, { ...inputs.get(p.attributes.name!), ...asPort(p) });
  let outputs = spec?.outputs ?? [{ name: 'out', type: element.attributes.type }];
  if (element.name === 'nodegraph') outputs = authoredPorts(element, 'output').map(asPort);
  if (element.name === 'input') outputs = [{ name: 'out', type: element.attributes.type }];
  if (element.name === 'output') {
    inputs.clear();
    inputs.set('in', { name: 'in', type: element.attributes.type });
    outputs = [];
  }
  return {
    category: element.name,
    type: element.attributes.type,
    inputs: [...inputs.values()],
    outputs,
    parameters: [],
  };
}

/** Queue-based arc consistency. Domains shrink only within a solve, and restart after every edit. */
function propagate(domains: MaterialXNodeSpec[][], wires: Wire[], adjacent: number[][]): boolean {
  const queue = wires.map((_, i) => i);
  const queued = new Set(queue);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]!;
    queued.delete(index);
    const wire = wires[index]!;
    for (const forward of [true, false]) {
      const id = forward ? wire.from : wire.to;
      const other = forward ? wire.to : wire.from;
      const remaining = domains[id]!.filter((spec) =>
        domains[other]!.some((peer) => {
          const from = outputPort(forward ? spec : peer, wire.output);
          const to = inputPort(forward ? peer : spec, wire.input);
          return from && to && compatible(from.type, to.type);
        }),
      );
      if (!remaining.length) return false;
      if (remaining.length === domains[id]!.length) continue;
      domains[id] = remaining;
      for (const next of adjacent[id]!)
        if (!queued.has(next)) {
          queue.push(next);
          queued.add(next);
        }
    }
  }
  return domains.every((domain) => domain.length > 0);
}

/** Deterministic depth-first selection, with propagation after each choice (including reconvergent graphs). */
function firstAssignment(
  domains: MaterialXNodeSpec[][],
  wires: Wire[],
  adjacent: number[][],
): MaterialXNodeSpec[][] | undefined {
  if (!propagate(domains, wires, adjacent)) return undefined;
  const index = domains.findIndex((domain) => domain.length > 1);
  if (index < 0) return domains;
  for (const spec of domains[index]!) {
    const next = domains.slice();
    next[index] = [spec];
    const result = firstAssignment(next, wires, adjacent);
    if (result) return result;
  }
  return undefined;
}

function consensus(values: (string | undefined)[]): string | undefined {
  return values.length && values.every((value) => value === values[0]) ? values[0] : undefined;
}

/** Port defaults come from the fallback, but socket types come only from surviving candidates. */
function projectedPorts(spec: MaterialXNodeSpec, candidates: MaterialXNodeSpec[], side: 'inputs' | 'outputs') {
  const ports = side === 'inputs' ? [...spec.inputs, ...spec.parameters] : spec.outputs;
  return ports.map((port) => ({
    ...port,
    type: consensus(
      candidates.map(
        (candidate) => (side === 'inputs' ? inputPort(candidate, port.name) : outputPort(candidate, port.name))?.type,
      ),
    ),
  }));
}

const cache = new WeakMap<MaterialXDocument, WeakMap<MaterialXNodeSpec[], TypeResolution>>();
export function invalidateTypeResolution(document: MaterialXDocument) {
  cache.delete(document);
}

export function resolveTypes(document: MaterialXDocument, catalog = getNodeCatalog(document)): TypeResolution {
  const cached = cache.get(document)?.get(catalog);
  if (cached) return cached;
  const entries: Entry[] = [];
  const collect = (elements: MaterialXElement[], scope: string) => {
    for (const element of elements) {
      if (!element.attributes.name || nonNodes.has(element.name) || element.name.startsWith('#')) continue;
      const family = findNodeFamily(element, catalog);
      entries.push({
        key: resolutionKey(scope, element.attributes.name),
        scope,
        element,
        family,
        base: family?.variants ?? [fixedDefinition(element, catalog)],
      });
      if (element.name === 'nodegraph') collect(element.children, resolutionKey(scope, element.attributes.name));
    }
  };
  collect(document.elements, '');
  const byKey = new Map(entries.map((entry, i) => [entry.key, i]));
  const wires: Wire[] = [];
  const adjacent = entries.map((): number[] => []);
  for (const [to, entry] of entries.entries()) {
    const ports =
      entry.element.name === 'output'
        ? [entry.element]
        : [...authoredPorts(entry.element, 'input'), ...authoredPorts(entry.element, 'parameter')];
    for (const port of ports) {
      const a = port.attributes;
      const source = a.nodename ?? a.nodegraph ?? a.interfacename;
      if (!source) continue;
      const from = byKey.get(resolutionKey(entry.scope, source)) ?? (a.nodegraph ? byKey.get(source) : undefined);
      if (from === undefined) continue;
      const wire = { from, to, output: a.output ?? 'out', input: entry.element.name === 'output' ? 'in' : a.name! };
      // Missing ports are structural diagnostics, not type conflicts.
      if (!outputPort(entries[from]!.base[0]!, wire.output) || !inputPort(entry.base[0]!, wire.input)) continue;
      adjacent[from]!.push(wires.length);
      adjacent[to]!.push(wires.length);
      wires.push(wire);
    }
  }
  const initial = entries.map((entry) => {
    if (!entry.family) return entry.base;
    const original = findNodeSpec(entry.element, catalog);
    const values = entry.element.children
      .filter((p) => ['input', 'parameter'].includes(p.name) && p.attributes.value !== undefined)
      .map((p) => ({
        name: p.attributes.name!,
        type: p.attributes.type ?? (original && inputPort(original, p.attributes.name!)?.type),
      }));
    return entry.base.filter((spec) => values.every((p) => !p.type || inputPort(spec, p.name)?.type === p.type));
  });
  const candidates = initial.slice();
  const chosen = new Map<number, MaterialXNodeSpec>();
  const failed = new Set<number>();
  const visited = new Set<number>();
  const conflicts: TypeResolution['conflicts'] = [];
  for (let start = 0; start < entries.length; start++) {
    if (visited.has(start)) continue;
    const component = [start];
    visited.add(start);
    for (let cursor = 0; cursor < component.length; cursor++) {
      for (const wireIndex of adjacent[component[cursor]!]!) {
        const wire = wires[wireIndex]!;
        const peer = wire.from === component[cursor] ? wire.to : wire.from;
        if (!visited.has(peer)) {
          visited.add(peer);
          component.push(peer);
        }
      }
    }
    // Document order, then catalog order, makes fallback selection stable.
    component.sort((a, b) => a - b);
    const localIds = new Map(component.map((id, i) => [id, i]));
    const localWires = [...new Set(component.flatMap((id) => adjacent[id]!))].map((i) => ({
      ...wires[i]!,
      from: localIds.get(wires[i]!.from)!,
      to: localIds.get(wires[i]!.to)!,
    }));
    const localAdjacent = component.map((): number[] => []);
    localWires.forEach((wire, i) => {
      localAdjacent[wire.from]!.push(i);
      localAdjacent[wire.to]!.push(i);
    });
    const domains = component.map((id) => initial[id]!);
    const assignment = propagate(domains, localWires, localAdjacent)
      ? firstAssignment(domains.slice(), localWires, localAdjacent)
      : undefined;
    if (!assignment) {
      const scopes = new Map<string, string[]>();
      for (const id of component) {
        failed.add(id);
        const entry = entries[id]!;
        scopes.set(entry.scope, [...(scopes.get(entry.scope) ?? []), entry.element.attributes.name!]);
      }
      for (const [scope, nodeIds] of scopes) conflicts.push({ scope, nodeIds });
      continue;
    }
    component.forEach((id, i) => {
      candidates[id] = domains[i]!;
      chosen.set(id, assignment[i]![0]!);
    });
  }
  const nodes = new Map(
    entries.map((entry, i): [string, ResolvedNode] => {
      const definition = chosen.get(i) ?? findNodeSpec(entry.element, catalog) ?? initial[i]![0] ?? entry.base[0]!;
      const remaining = failed.has(i) ? [] : candidates[i]!;
      return [
        entry.key,
        {
          element: entry.element,
          scope: entry.scope,
          family: entry.family,
          candidates: remaining,
          definition: entry.family ? definition : undefined,
          type: entry.family ? consensus(remaining.map(nodeType)) : entry.element.attributes.type,
          inputs: projectedPorts(definition, entry.family ? remaining : [definition], 'inputs'),
          outputs: projectedPorts(definition, entry.family ? remaining : [definition], 'outputs'),
          conflict: failed.has(i),
        },
      ];
    }),
  );
  const result = { nodes, conflicts };
  if (!cache.has(document)) cache.set(document, new WeakMap());
  cache.get(document)!.set(catalog, result);
  return result;
}

/** Resolve a copy for consumers of concrete MaterialX. Never author defaults or pin inferred types. */
export function materializeDocument(
  document: MaterialXDocument,
  catalog = getNodeCatalog(document),
): MaterialXDocument {
  const resolution = resolveTypes(document, catalog);
  const copy = cloneMaterialXDocument(document);
  const visit = (elements: MaterialXElement[], scope: string) => {
    for (const element of elements) {
      const resolved = resolution.nodes.get(resolutionKey(scope, element.attributes.name!));
      if (resolved?.definition && !resolved.conflict) {
        const spec = resolved.definition;
        element.attributes.type = nodeType(spec) ?? 'multioutput';
        if (spec.nodeDefName) element.attributes.nodedef = spec.nodeDefName;
        for (const port of element.children.filter((p) => ['input', 'parameter'].includes(p.name))) {
          const type = inputPort(spec, port.attributes.name!)?.type;
          if (type) port.attributes.type = type;
        }
      }
      if (element.name === 'nodegraph') visit(element.children, resolutionKey(scope, element.attributes.name!));
    }
  };
  visit(copy.elements, '');
  return copy;
}
