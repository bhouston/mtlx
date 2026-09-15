import type { MaterialXElement, MaterialXNodeSpec } from 'mtlx-core';
import {
  getNodeFamilies as semanticFamilies,
  findNodeFamily as semanticFamily,
  type NodeFamily as SemanticNodeFamily,
} from 'mtlx-core/session';

export interface NodeFamily extends SemanticNodeFamily {
  label: string;
}
const cache = new WeakMap<MaterialXNodeSpec[], NodeFamily[]>();

/** Supply menu labels for the shared semantic node families. */
export function getNodeFamilies(catalog: MaterialXNodeSpec[]): NodeFamily[] {
  const cached = cache.get(catalog);
  if (cached) return cached;
  const families = semanticFamilies(catalog).map((family) => ({ ...family, label: family.variants[0]!.category }));
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

export function findNodeFamily(element: MaterialXElement, catalog: MaterialXNodeSpec[]): NodeFamily | undefined {
  const family = semanticFamily(element, catalog);
  return family && getNodeFamilies(catalog).find((candidate) => candidate.id === family.id);
}
