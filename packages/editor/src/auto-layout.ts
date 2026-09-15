import type { GraphEdge, GraphNode, Point } from './model.js';

const COLUMN = 340;
const ROW_GAP = 40;
const HEADER = 60;
const PORT = 22;

/** Inputs shown on a collapsed node body: connected or authored ones. */
export function visibleInputs(node: Pick<GraphNode, 'element' | 'inputs'>) {
  const authored = new Set(
    node.element.children
      .filter((child) => child.name === 'input' || child.name === 'parameter')
      .map((child) => child.attributes.name),
  );
  return node.inputs.filter((port) => authored.has(port.name));
}
const height = (node: Pick<GraphNode, 'element' | 'inputs' | 'outputs'>) =>
  HEADER + Math.max(visibleInputs(node).length, node.outputs.length) * PORT;

/** Layered left-to-right placement by data flow. Sources sit in the first column, sinks in the last. */
// ponytail: longest-path layering with one barycenter pass; swap for elk/dagre if crossings matter.
export function autoLayout(
  nodes: Pick<GraphNode, 'id' | 'element' | 'inputs' | 'outputs'>[],
  edges: GraphEdge[],
): Record<string, Point> {
  const ids = new Set(nodes.map((node) => node.id));
  const incoming = new Map<string, string[]>();
  for (const edge of edges)
    if (ids.has(edge.source) && ids.has(edge.target))
      incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
  const layer = new Map<string, number>();
  const depth = (id: string, trail: Set<string>): number => {
    const known = layer.get(id);
    if (known !== undefined) return known;
    if (trail.has(id)) return 0;
    trail.add(id);
    const value = Math.max(-1, ...(incoming.get(id) ?? []).map((source) => depth(source, trail))) + 1;
    layer.set(id, value);
    return value;
  };
  for (const node of nodes) depth(node.id, new Set());
  const columns = new Map<number, typeof nodes>();
  for (const node of nodes) columns.set(layer.get(node.id)!, [...(columns.get(layer.get(node.id)!) ?? []), node]);
  const positions: Record<string, Point> = {};
  for (const [column, members] of [...columns.entries()].toSorted(([a], [b]) => a - b)) {
    const rank = (node: (typeof nodes)[number]) => {
      const sources = (incoming.get(node.id) ?? [])
        .map((source) => positions[source]?.y)
        .filter((y) => y !== undefined);
      return sources.length ? sources.reduce((sum, y) => sum + y, 0) / sources.length : Number.MAX_SAFE_INTEGER;
    };
    let y = 0;
    for (const node of members.toSorted((a, b) => rank(a) - rank(b))) {
      positions[node.id] = { x: column * COLUMN, y };
      y += height(node) + ROW_GAP;
    }
  }
  return positions;
}
