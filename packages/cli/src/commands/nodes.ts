import { materialXNodeRegistry } from 'mtlx-core';
import { defineCommand } from 'yargs-file-commands';

/**
 * How the preview renderer (three.js MaterialXLoader) actually behaves for nodes whose behavior
 * surprises authors, keyed by node category. Verified by rendering; see the library AUTHORING.md.
 */
export const RENDERER_NOTES: Record<string, string> = {
  noise2d:
    'Signed: std 0.32, 90% of area within ±0.54, extremes ±0.97, exactly 0 at integer texcoords (offset each layer). Remap with 0.5 + 0.8·n for full contrast (0.5 + 0.5·n only spans ~0.23..0.77). Blobs ~0.7/f across, ~2/f apart. Only vector3/color3 variants have independent channels: vector2/vector4/color4 repeat one value (renderer bug), so for a 2D warp use vector3 and convert to vector2.',
  noise3d:
    'Signed like noise2d. vector2/vector4 variants repeat one value in every channel (renderer bug); use vector3.',
  fractal2d:
    'Signed plain octave sum: std 0.37 with defaults, 90% within ±0.61. Remap with 0.5 + 0.6·n. No pivot input. Diminish sets contrast; octaves past 3 add detail, not range; each octave adds equal slope, so the finest octave dominates shading. Only vector3/color3 have independent channels (vector2/vector4 repeat one value, renderer bug).',
  fractal3d: 'Signed like fractal2d; vector2/vector4 variants repeat one value (renderer bug), use vector3.',
  worleynoise2d:
    'Euclidean. style 0: float = F1 (distance to nearest feature point; max 1.16 and median 0.43 at jitter 1, so F1 does not locate borders), vector2 = (F1, F2), vector3 = (F1, F2, F3); F2 - F1 is 0 on cell borders (cracks, joints). All variants share the same feature points. style 1: a uniform 0..1 random per Voronoi cell, constant over the cell and matching the style-0 cells (per-stone id); on vector3, .xy are the point jitter offsets, so use .z or the float id. A disk of radius r <= (1 - jitter)/2 cells never clips at cell borders.',
  worleynoise3d: 'Same outputs and styles as worleynoise2d.',
  cellnoise2d:
    'Random 0..1 per integer cell (floor of texcoord). It does not line up with jittered worley cells, so use worleynoise2d style 1 for per-feature randoms. cellnoise2d(combine2(floor(v * n), 0)) gives a random per band.',
  unifiednoise2d:
    'type 0 = 0.5 + 0.5·noise2d, 1 = cell, 2 = worley F1 (same as worleynoise2d), 3 = fractal but signed and NOT remapped, so with default clampoutput=true half the area clamps to 0: use outmin 0.5, outmax 1, clampoutput false. For types 0/1/3, jitter rotates or re-slices the pattern rather than jittering; style only affects type 2.',
  heighttonormal:
    'Uses screen-space derivatives and treats |n|^2 < 1e-12 as degenerate, so with meter-scale UVs the normal comes out flat. Feed millimeters: texcoord = uv * 1000, in = height_m * 1000, scale 16 gives physical slopes.',
  bump: 'Same flat-normal problem as heighttonormal, and has no texcoord input. Use heighttonormal plus normalmap instead.',
  smoothstep: 'low > high does not invert (returns ~1). Use 1 - smoothstep(x, low, high) instead.',
  ifgreater: 'Inputs are value1, value2, in1, in2: in1 when value1 > value2, otherwise in2.',
  separate2: 'Outputs are outx, outy (separate3: outx, outy, outz for vectors; outr, outg, outb for color3).',
  modulo:
    'Floor-based like GLSL mod: modulo(-0.25, 1) = 0.75, never negative for a positive divisor. Use fract(x) for modulo(x, 1).',
  fract: 'x - floor(x), always in 0..1. Tile-local coordinates: fract(uv * tiles_per_meter).',
};

export interface NodeDefinitionSummary {
  name?: string;
  category: string;
  output?: string;
  inputs: { name: string; type?: string; default?: unknown }[];
  note?: string;
}

/** Case-insensitive substring search over definition name, category, and node group. */
export function findNodeDefinitions(
  query: string,
  limit = 40,
): { total: number; definitions: NodeDefinitionSummary[] } {
  const q = query.trim().toLowerCase();
  const exact = materialXNodeRegistry.filter((spec) => spec.category.toLowerCase() === q);
  // An exact category ("fract") wins over substring matches ("fractal2d").
  const matches = exact.length
    ? exact
    : materialXNodeRegistry.filter((spec) =>
        [spec.nodeDefName, spec.category, spec.nodeGroup].some((field) => field?.toLowerCase().includes(q)),
      );
  return {
    total: matches.length,
    definitions: matches.slice(0, limit).map((spec) => ({
      name: spec.nodeDefName,
      category: spec.category,
      output: spec.type,
      inputs: [...spec.inputs, ...spec.parameters].map((port) => ({
        name: port.name,
        type: port.type,
        ...(port.value !== undefined ? { default: port.value } : {}),
      })),
      ...(RENDERER_NOTES[spec.category] ? { note: RENDERER_NOTES[spec.category] } : {}),
    })),
  };
}

export const command = defineCommand({
  command: 'nodes <query>',
  describe: 'Search MaterialX node definitions: exact names, inputs with defaults, and preview-renderer notes',
  builder: (yargs) =>
    yargs
      .positional('query', {
        describe:
          'Substring of the definition name, category, or node group; comma-separate several (e.g. worley,smoothstep,fract)',
        type: 'string',
        demandOption: true,
      })
      .option('limit', { describe: 'Maximum definitions to list', type: 'number', default: 40 })
      .option('format', { describe: 'Output format', choices: ['text', 'json'] as const, default: 'text' }),
  handler: (argv) => {
    // Several lookups in one call (CLI startup dominates): `mtlx nodes fract,modulo,worley`.
    const queries = String(argv.query)
      .split(/[\s,]+/)
      .filter(Boolean);
    const results = queries.map((q) => findNodeDefinitions(q, argv.limit));
    if (argv.format === 'json') {
      console.log(
        JSON.stringify(
          queries.length === 1 ? results[0] : Object.fromEntries(queries.map((q, i) => [q, results[i]])),
          null,
          2,
        ),
      );
      return;
    }
    queries.forEach((query, i) => {
      const result = results[i]!;
      if (queries.length > 1) console.log(`${i ? '\n' : ''}== ${query} ==`);
      const notes = new Map<string, string>();
      for (const def of result.definitions) {
        const inputs = def.inputs.map(
          (p) => `${p.name}:${p.type}${p.default !== undefined ? `=${String(p.default)}` : ''}`,
        );
        console.log(`${def.name} -> ${def.output}  ${inputs.join('  ')}`);
        if (def.note) notes.set(def.category, def.note);
      }
      for (const [category, note] of notes) console.log(`Note (${category}): ${note}`);
      if (result.total > result.definitions.length)
        console.log(`${result.total - result.definitions.length} more; narrow the query or raise --limit.`);
    });
  },
});
