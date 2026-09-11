import type { MaterialXPackage } from './package.js';
import { buildResourceGraph, resolveResourcePath } from './resource-graph.js';
import { createMaterialXDocument } from './xml.js';
import { validateDocument, type MaterialXValidationOptions } from './validate.js';
import type { MaterialXDocument, MaterialXElement, MaterialXValidationIssue } from './types.js';

/** Checks package dependencies by identity/base path, and document rules in resolved include scope. */
export const validateMaterialXPackage = (
  pkg: MaterialXPackage,
  options: MaterialXValidationOptions = {},
): MaterialXValidationIssue[] => {
  const rules = options.rules ?? ['basic', 'structure', 'resources'];
  const issues: MaterialXValidationIssue[] = [];
  const graph = buildResourceGraph(pkg);
  if (rules.includes('resources')) {
    for (const edge of graph.edges) {
      if (!edge.resourceId && edge.targetPath !== pkg.rootPath)
        issues.push({
          code: 'RESOURCE_MISSING',
          rule: 'resources',
          level: 'error',
          location: `${edge.documentPath}/${edge.element.name}:${edge.element.attributes.name ?? ''}`,
          message: `Resource "${edge.value}" is unavailable (resolved as "${edge.targetPath}")`,
        });
    }
  }
  const documents = new Map<string, MaterialXDocument>([[pkg.rootPath, pkg.document]]);
  for (const resource of pkg.resources) if (resource.document) documents.set(resource.archivePath, resource.document);
  const seen = new Set<string>();
  const active = new Set<string>();
  const elements: MaterialXElement[] = [];
  const visit = (name: string) => {
    if (active.has(name)) {
      issues.push({
        code: 'DEPENDENCY_CYCLE',
        rule: 'resources',
        level: 'error',
        location: name,
        message: 'MaterialX include cycle',
      });
      return;
    }
    if (seen.has(name)) return;
    seen.add(name);
    active.add(name);
    for (const element of documents.get(name)?.elements ?? []) {
      if (['include', 'xi:include'].includes(element.name) && element.attributes.href) {
        visit(resolveResourcePath(name, element.attributes.href));
      } else elements.push(element);
    }
    active.delete(name);
  };
  visit(pkg.rootPath);
  issues.push(
    ...validateDocument(createMaterialXDocument(pkg.document.attributes, elements), {
      ...options,
      rules: rules.filter((rule) => rule !== 'resources'),
    }),
  );
  return issues;
};
