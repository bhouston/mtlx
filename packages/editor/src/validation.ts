import { validateDocument } from 'mtlx-core';
import { getNodeCatalog, projectGraph, type MaterialXDocument } from './model.js';

export interface GraphDiagnostic {
  message: string;
  nodeIds: string[];
  edgeId?: string;
}

/** Adapt shared document diagnostics to the visible graph's nodes and wires. */
export function validateGraph(
  document: MaterialXDocument,
  scope = '',
  catalog = getNodeCatalog(document),
  projection = projectGraph(document, scope, catalog),
): GraphDiagnostic[] {
  return validateDocument(document, { registry: catalog, rules: ['structure', 'types'] }).flatMap((issue) => {
    const graph = issue.graph;
    if (!graph) return [];
    const direct = graph.scope === scope;
    const containers =
      graph.containers?.filter((container) => container.scope === scope).map((container) => container.nodeId) ?? [];
    if (!direct && !containers.length) return [];
    const node = graph.nodeIds[0]!;
    const edge = direct ? projection.edges.find((e) => e.target === node && e.targetHandle === graph.input) : undefined;
    const origin = `${graph.scope ? graph.scope + '/' : ''}${node}${graph.input ? '.' + graph.input : ''}`;
    return [
      {
        message: `${direct ? '' : 'Contained error: '}${origin}: ${issue.message}`,
        nodeIds: [...new Set([...(direct ? graph.nodeIds : []), ...containers])],
        edgeId: edge?.id,
      },
    ];
  });
}
