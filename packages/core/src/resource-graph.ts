import type { MaterialXDocument, MaterialXElement } from './types.js';
import type { MaterialXPackage, MaterialXResource } from './package.js';
import { cloneMaterialXDocument } from './xml.js';

export const normalizeResourcePath = (value: string): string => {
  const parts: string[] = [];
  const absolute = value.startsWith('/');
  for (const part of value.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..' && parts.length && parts.at(-1) !== '..') parts.pop();
    else parts.push(part);
  }
  return `${absolute ? '/' : ''}${parts.join('/')}`;
};
export const resourceDirname = (value: string): string => value.slice(0, value.lastIndexOf('/') + 1);
export const resolveResourcePath = (documentPath: string, value: string): string =>
  value.startsWith('/') || /^[a-z]:/i.test(value)
    ? value
    : normalizeResourcePath(resourceDirname(documentPath) + value);
export const relativeResourcePath = (documentPath: string, target: string): string => {
  if (target.startsWith('/') || /^[a-z]:/i.test(target)) return target;
  const from = resourceDirname(documentPath).split('/').filter(Boolean);
  const to = target.split('/');
  while (from.length && from[0] === to[0]) {
    from.shift();
    to.shift();
  }
  return [...from.map(() => '..'), ...to].join('/');
};

/** Only fields defined as file references are rewritten, never arbitrary string values/names. */
export const isResourceReference = (element: MaterialXElement, attribute: string): boolean =>
  ['file', 'filename', 'href', 'uri', 'source'].includes(attribute.toLowerCase()) ||
  (attribute === 'value' && element.attributes.type === 'filename');

export interface ResourceReference {
  element: MaterialXElement;
  attribute: string;
  value: string;
}
export const documentResourceReferences = (document: MaterialXDocument): ResourceReference[] => {
  const refs: ResourceReference[] = [];
  const visit = (element: MaterialXElement) => {
    for (const [attribute, value] of Object.entries(element.attributes)) {
      if (value.trim() && isResourceReference(element, attribute)) refs.push({ element, attribute, value });
    }
    element.children.forEach(visit);
  };
  document.elements.forEach(visit);
  return refs;
};

export interface MaterialXDependencyEdge extends ResourceReference {
  documentPath: string;
  targetPath: string;
  resourceId?: string;
}
export interface MaterialXResourceGraph {
  resources: Array<{ id: string; sourcePath: string; destination: string; resource: MaterialXResource }>;
  edges: MaterialXDependencyEdge[];
}
/** A graph snapshot retains original reference values for a single, non-cascading rewrite. */
export const buildResourceGraph = (pkg: MaterialXPackage): MaterialXResourceGraph => {
  const resources = pkg.resources.map((resource, index) => ({
    id: resource.id ?? `resource:${index}:${resource.sourcePath}`,
    sourcePath: resource.sourcePath,
    destination: resource.archivePath,
    resource,
  }));
  const byPath = new Map(resources.map((entry) => [entry.destination, entry.id]));
  const documents = [
    { path: pkg.rootPath, document: pkg.document },
    ...pkg.resources.flatMap((r) => (r.document ? [{ path: r.archivePath, document: r.document }] : [])),
  ];
  return {
    resources,
    edges: documents.flatMap(({ path, document }) =>
      documentResourceReferences(document).map((ref) => {
        const targetPath = resolveResourcePath(path, ref.value);
        return { ...ref, documentPath: path, targetPath, resourceId: byPath.get(targetPath) };
      }),
    ),
  };
};

export const cloneMaterialXPackage = (pkg: MaterialXPackage): MaterialXPackage => ({
  rootPath: pkg.rootPath,
  document: cloneMaterialXDocument(pkg.document),
  resources: pkg.resources.map((resource) => ({
    ...resource,
    data: resource.data.slice(),
    ...(resource.document ? { document: cloneMaterialXDocument(resource.document) } : {}),
  })),
});

/** Allocate a complete mapping, reserving unchanged and incoming names before suffixing. */
export const planResourceDestinations = (
  pkg: MaterialXPackage,
  desired: (resource: MaterialXResource) => string,
  reserved: Iterable<string> = [pkg.rootPath],
): Map<string, string> => {
  const original = pkg.resources.map((resource) => resource.archivePath);
  if (new Set(original).size !== original.length) throw new Error('Duplicate resource archive path');
  const used = new Set(reserved);
  const wanted = pkg.resources.map(desired);
  const protectedNames = new Set(wanted);
  const plan = new Map<string, string>();
  pkg.resources.forEach((resource, index) => {
    const target = wanted[index]!;
    const dot = target.lastIndexOf('.');
    const ext = dot > target.lastIndexOf('/') ? target.slice(dot) : '';
    const stem = ext ? target.slice(0, -ext.length) : target;
    let destination = target;
    for (let suffix = 2; used.has(destination); suffix++) {
      destination = `${stem}-${suffix}${ext}`;
      while (protectedNames.has(destination)) destination = `${stem}-${++suffix}${ext}`;
    }
    used.add(destination);
    plan.set(resource.archivePath, destination);
  });
  return plan;
};

/** Apply one original→destination map to every dependency edge, then relocate resources/root. */
export const applyResourceDestinations = (
  pkg: MaterialXPackage,
  destinations: ReadonlyMap<string, string>,
  rootPath = pkg.rootPath,
): void => {
  const graph = buildResourceGraph(pkg);
  for (const edge of graph.edges) {
    const owner =
      edge.documentPath === pkg.rootPath ? rootPath : (destinations.get(edge.documentPath) ?? edge.documentPath);
    const target = edge.targetPath === pkg.rootPath ? rootPath : (destinations.get(edge.targetPath) ?? edge.targetPath);
    edge.element.attributes[edge.attribute] = relativeResourcePath(owner, target);
  }
  for (const resource of pkg.resources)
    resource.archivePath = destinations.get(resource.archivePath) ?? resource.archivePath;
  pkg.rootPath = rootPath;
};
