import type { GraphEdge, GraphNode, MaterialXNodePortSpec } from './model.js';

// Blender's standard socket palette (RGB values rounded to 8-bit):
// https://github.com/blender/blender/blob/main/source/blender/editors/space_node/drawnode.cc
// Material uses muted teal instead of Blender's red to reserve red for errors.
const colors: Record<string, string> = {
  float: '#a1a1a1',
  integer: '#598c5c',
  boolean: '#cca6d6',
  color3: '#c7c729',
  color4: '#c7c729',
  vector2: '#6363c7',
  vector3: '#6363c7',
  vector4: '#6363c7',
  string: '#70b3ff',
  filename: '#70b3ff',
  geomname: '#70b3ff',
  matrix33: '#b83385',
  matrix44: '#b83385',
  BSDF: '#63c763',
  EDF: '#63c763',
  VDF: '#63c763',
  surfaceshader: '#63c763',
  volumeshader: '#63c763',
  displacementshader: '#63c763',
  lightshader: '#63c763',
  material: '#4d9e99',
};

export function socketColor(type?: string): string {
  return colors[type?.replace(/array$/, '') ?? ''] ?? '#a1a1a1';
}

const key = (node: string, side: string, port: string) => JSON.stringify([node, side, port]);
const concrete = (type?: string) => (type && !['any', 'unknown', 'multioutput'].includes(type) ? type : undefined);

/** Infer missing display types from wires only; never change document types or connection validation. */
export function socketTypes(nodes: GraphNode[], edges: GraphEdge[]) {
  const ports = new Map<string, MaterialXNodePortSpec>();
  const neighbors = new Map<string, string[]>();
  for (const node of nodes) {
    for (const port of node.inputs) ports.set(key(node.id, 'input', port.name), port);
    for (const port of node.outputs) ports.set(key(node.id, 'output', port.name), port);
  }
  for (const edge of edges) {
    const source = key(edge.source, 'output', edge.sourceHandle);
    const target = key(edge.target, 'input', edge.targetHandle);
    if (!ports.has(source) || !ports.has(target)) continue;
    neighbors.set(source, [...(neighbors.get(source) ?? []), target]);
    neighbors.set(target, [...(neighbors.get(target) ?? []), source]);
  }
  const resolved = new Map<string, string | undefined>();
  for (const [id, port] of ports) {
    const types = new Set<string>();
    const visited = new Set<string>();
    const visit = (current: string) => {
      if (visited.has(current)) return;
      visited.add(current);
      const type = concrete(ports.get(current)?.type);
      if (type) types.add(type);
      else for (const neighbor of neighbors.get(current) ?? []) visit(neighbor);
    };
    visit(id);
    resolved.set(id, concrete(port.type) ?? (types.size === 1 ? [...types][0] : undefined));
  }
  return (node: string, side: 'input' | 'output', port: string) => resolved.get(key(node, side, port));
}
