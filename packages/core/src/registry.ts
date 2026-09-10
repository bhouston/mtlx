import { generatedNodeRegistry } from './generated/node-registry.generated.js';
import type { MaterialXNodeSpec } from './types.js';

const builtInNodeSpecs: MaterialXNodeSpec[] = [
  { category: 'surfacematerial', inputs: [], outputs: [], parameters: [] },
  { category: 'nodegraph', inputs: [], outputs: [], parameters: [] },
  { category: 'output', inputs: [], outputs: [], parameters: [] },
  { category: 'image', inputs: [], outputs: [], parameters: [] },
  { category: 'tiledimage', inputs: [], outputs: [], parameters: [] },
  { category: 'open_pbr_surface', inputs: [], outputs: [], parameters: [] },
  { category: 'multiply', inputs: [], outputs: [], parameters: [] },
  { category: 'mix', inputs: [], outputs: [], parameters: [] },
  { category: 'normalmap', inputs: [], outputs: [], parameters: [] },
  { category: 'convert', inputs: [], outputs: [], parameters: [] },
];

/**
 * *Every node category {@link validateDocument} recognizes: the standard library generated from
 * the MaterialX node definitions plus a few built-in structural elements.*
 *
 * @category Validation
 */
export const materialXNodeRegistry: MaterialXNodeSpec[] = [...builtInNodeSpecs, ...generatedNodeRegistry];
