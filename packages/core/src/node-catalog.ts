import { materialXNodeRegistry } from './registry.js';
import type { MaterialXDocument, MaterialXElement, MaterialXNodeSpec, MaterialXNodePortSpec } from './types.js';

export const nodeType = (spec: MaterialXNodeSpec) =>
  spec.type ?? (spec.outputs.length === 1 ? spec.outputs[0]?.type : 'multioutput');

/** Catalog also accepts definitions embedded in the document; source XML remains untouched. */
export function getNodeCatalog(document?: MaterialXDocument, registry = materialXNodeRegistry): MaterialXNodeSpec[] {
  const specs = registry;
  const local = document?.elements.filter((e) => e.name === 'nodedef') ?? [];
  const resolved = new Map<string, MaterialXNodeSpec>();
  function resolve(element: MaterialXElement, seen = new Set<string>()): MaterialXNodeSpec {
    const a = element.attributes;
    if (resolved.has(a.name!)) return resolved.get(a.name!)!;
    if (seen.has(a.name!)) throw new Error('Cyclic node definition inheritance');
    seen.add(a.name!);
    const parentElement = local.find((e) => e.attributes.name === a.inherit);
    const parent = parentElement ? resolve(parentElement, seen) : specs.find((s) => s.nodeDefName === a.inherit);
    const ports = (tag: 'input' | 'output' | 'parameter', inherited: MaterialXNodePortSpec[] = []) => {
      const values = new Map(inherited.map((p) => [p.name, p]));
      for (const child of element.children.filter((e) => e.name === tag))
        values.set(child.attributes.name!, {
          ...child.attributes,
          name: child.attributes.name!,
          attributes: child.attributes,
        });
      return [...values.values()];
    };
    const outputs = ports('output', parent?.outputs);
    const result: MaterialXNodeSpec = {
      category: a.node ?? parent?.category ?? '',
      nodeDefName: a.name,
      type: a.type ?? (outputs.length === 1 ? outputs[0]?.type : 'multioutput'),
      nodeGroup: a.nodegroup ?? parent?.nodeGroup ?? 'Custom',
      attributes: { ...parent?.attributes, ...a },
      inputs: ports('input', parent?.inputs),
      outputs,
      parameters: ports('parameter', parent?.parameters),
    };
    resolved.set(a.name!, result);
    return result;
  }
  local.forEach((e) => resolve(e));
  return [...specs.filter((s) => !resolved.has(s.nodeDefName!)), ...resolved.values()];
}
export function findNodeSpec(element: MaterialXElement, catalog: MaterialXNodeSpec[]): MaterialXNodeSpec | undefined {
  const explicit = element.attributes.nodedef;
  if (explicit) return catalog.find((s) => s.nodeDefName === explicit);
  const candidates = catalog.filter(
    (s) =>
      s.category === element.name &&
      nodeType(s) === element.attributes.type &&
      s.attributes?.isdefaultversion !== 'false',
  );
  // Output types alone cannot distinguish overloads such as float -> vector2
  // and boolean -> vector2. Use authored input types before selecting a definition.
  const matching = candidates.filter((s) =>
    element.children
      .filter((p) => p.name === 'input' || p.name === 'parameter')
      .every((p) => {
        const declared = [...s.inputs, ...s.parameters].find((input) => input.name === p.attributes.name);
        return !p.attributes.type || declared?.type === p.attributes.type;
      }),
  );
  // Keep an unambiguous definition so validation can report incorrect input types.
  return matching[0] ?? (candidates.length === 1 ? candidates[0] : undefined);
}

/** Expand only implementations whose contents are present in this document. */
export function getNodeGraphScope(
  document: MaterialXDocument,
  element: MaterialXElement,
  scope: string,
  spec?: MaterialXNodeSpec,
) {
  if (element.name === 'nodegraph') return scope ? `${scope}/${element.attributes.name}` : element.attributes.name;
  const definition = element.attributes.nodedef ?? spec?.nodeDefName;
  if (!definition) return undefined;
  const implementation = document.elements.find(
    (e) => e.name === 'implementation' && e.attributes.nodedef === definition && e.attributes.nodegraph,
  );
  return document.elements.find(
    (e) =>
      e.name === 'nodegraph' &&
      (e.attributes.nodedef === definition || e.attributes.name === implementation?.attributes.nodegraph),
  )?.attributes.name;
}
