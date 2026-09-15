import { findNodeSpec, type MaterialXElement, type MaterialXNodeSpec } from 'mtlx-core';

export interface NodeFamily {
  /** A representative nodedef is also the stable drag-and-drop identifier. */
  id: string;
  label: string;
  variants: MaterialXNodeSpec[];
}

const signature = (spec: MaterialXNodeSpec) =>
  JSON.stringify([
    spec.category,
    spec.attributes?.version ?? '',
    spec.attributes?.target ?? '',
    ...[spec.inputs, spec.outputs, spec.parameters].map((ports) => ports.map((p) => p.name).toSorted()),
  ]);

const cache = new WeakMap<MaterialXNodeSpec[], NodeFamily[]>();

/** Preserve catalog order: it determines the fallback definition and its implicit defaults. */
export function getNodeFamilies(catalog: MaterialXNodeSpec[]): NodeFamily[] {
  const cached = cache.get(catalog);
  if (cached) return cached;
  const groups = new Map<string, MaterialXNodeSpec[]>();
  for (const spec of catalog) {
    // Core's category-only validation placeholders are not instantiable definitions.
    if (!spec.nodeDefName && !spec.type && !spec.inputs.length && !spec.outputs.length && !spec.parameters.length)
      continue;
    const key = signature(spec);
    const variants = groups.get(key) ?? [];
    variants.push(spec);
    groups.set(key, variants);
  }
  const families = [...groups.values()].map((variants): NodeFamily => {
    const first = variants[0]!;
    return { id: first.nodeDefName ?? signature(first), label: first.category, variants };
  });
  for (const family of families) {
    const spec = family.variants[0]!;
    const siblings = families.filter((f) => f.variants[0]!.category === spec.category);
    if (siblings.length > 1) {
      const sameVersion = siblings.filter(
        (f) =>
          f.variants[0]!.attributes?.version === spec.attributes?.version &&
          f.variants[0]!.attributes?.target === spec.attributes?.target,
      );
      const ports = [...spec.inputs, ...spec.outputs];
      const distinctPorts = ports.filter(
        (p) =>
          !sameVersion.every((f) =>
            [...f.variants[0]!.inputs, ...f.variants[0]!.outputs].some((other) => other.name === p.name),
          ),
      );
      const details = [
        spec.attributes?.version && `v${spec.attributes.version}`,
        spec.attributes?.target,
        sameVersion.length > 1 &&
          (distinctPorts.length ? distinctPorts.map((p) => p.name).join(', ') : 'basic interface'),
      ].filter(Boolean);
      family.label = `${spec.category} (${details.join(' · ')})`;
    }
  }
  cache.set(catalog, families);
  return families;
}

/** Stored nodedef/type identify an interface family, never constrain its type variants. */
export function findNodeFamily(element: MaterialXElement, catalog: MaterialXNodeSpec[]): NodeFamily | undefined {
  if (['input', 'output', 'nodegraph'].includes(element.name)) return undefined;
  const families = getNodeFamilies(catalog).filter((f) => {
    const spec = f.variants[0]!;
    return (
      spec.category === element.name &&
      (!element.attributes.version || element.attributes.version === spec.attributes?.version) &&
      (!element.attributes.target || element.attributes.target === spec.attributes?.target)
    );
  });
  if (element.attributes.nodedef) {
    return families.find((f) => f.variants.some((s) => s.nodeDefName === element.attributes.nodedef));
  }
  const original = findNodeSpec(element, catalog);
  const originalFamily = original && families.find((f) => f.variants.includes(original));
  if (originalFamily) return originalFamily;
  return families.find((f) => {
    const spec = f.variants[0]!;
    return (
      (element.attributes.version || spec.attributes?.isdefaultversion !== 'false') &&
      element.children
        .filter((p) => p.name === 'input' || p.name === 'parameter')
        .every((p) => [...spec.inputs, ...spec.parameters].some((input) => input.name === p.attributes.name))
    );
  });
}
