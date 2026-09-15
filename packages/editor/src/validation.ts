import { validateDocument } from 'mtlx-core';
import { getNodeCatalog, projectGraph, materializeDocument, resolveTypes, type MaterialXDocument } from './model.js';

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
  const concrete = materializeDocument(document, catalog);
  const issues = validateDocument(concrete, { registry: catalog, rules: ['structure', 'types'] });
  const diagnostics = issues.flatMap((issue) => {
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
  for (const conflict of resolveTypes(document, catalog).conflicts) {
    // Existing concrete diagnostics usually identify the precise conflicting value or wire.
    if (
      issues.some(
        (issue) =>
          issue.graph?.scope === conflict.scope && issue.graph.nodeIds.some((id) => conflict.nodeIds.includes(id)),
      )
    )
      continue;
    const contained = conflict.scope.startsWith(scope ? `${scope}/` : '') && conflict.scope !== scope;
    if (conflict.scope !== scope && !contained) continue;
    diagnostics.push({
      message: `${conflict.scope ? conflict.scope + '/' : ''}${conflict.nodeIds.join(', ')}: No compatible node definitions satisfy the connections and authored values.`,
      nodeIds: contained ? [conflict.scope.slice(scope ? scope.length + 1 : 0).split('/')[0]!] : conflict.nodeIds,
      edgeId: undefined,
    });
  }
  return diagnostics;
}
