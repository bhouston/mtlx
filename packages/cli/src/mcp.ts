/**
 * `mtlx mcp`: a Model Context Protocol server over stdio so agents like Claude Code and Codex can
 * check, inspect, render, and edit materials as tools instead of shelling out. Every tool is a thin
 * wrapper over the same functions the CLI commands use.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MATERIALX_VALIDATION_RULES, parseMaterialX } from 'mtlx-core';
import { createEditorSession } from 'mtlx-core/session';
import { z } from 'zod';
import { runCheck } from './commands/check.js';
import { findNodeDefinitions } from './commands/nodes.js';
import { loadInfo } from './commands/info.js';
import {
  channelStats,
  contactSheet,
  GEOMETRIES,
  gridOverlay,
  IBLS,
  mirrorDiff,
  renderViews,
} from './commands/render.js';

const file = z.string().describe('Path to a .mtlx or .mtlx.zip file');
const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] });
const failure = (error: unknown) => ({
  isError: true,
  content: [{ type: 'text' as const, text: error instanceof Error ? error.message : String(error) }],
});

const EDIT_SCRIPT_DOC = `JavaScript body run with \`editor\` (an mtlx-core/session EditorSession) and \`graph\` (editor.graph(''), the
top-level scope) in scope; \`await\` is allowed. Use editor.graph('name') for a nested node graph. Examples:
  graph.setInputValue('SR_wood1', 'specular_roughness', 0.7)
  const c = graph.addNode({ definition: 'ND_constant_color3' });
  graph.setInputValue(c, 'value', [0.8, 0.2, 0.1], { type: 'color3' });
  graph.connect({ node: c, output: 'out' }, { node: 'SR_wood1', input: 'base_color' })
Values take the type of the node's definition, so a number on an ND_multiply_float input is a float. Pass
{ type: 'color3' } or { type: 'vector3' } when a 3-number value could be either. Use list_node_definitions to find
exact definition names and their input names and types before adding nodes.
Other calls: graph.removeNodes([id, ...]) deletes nodes (there is no removeNode); graph.disconnectInput(id, input);
graph.listNodes(); graph.getInputs(id); editor.getDiagnostics(). Multioutput nodes such as separate3 expose
outputs named outx, outy, outz (separate2: outx, outy).
Procedural node outputs in this renderer: noise3d and fractal3d are roughly 0..1 centred near 0.5; cellnoise3d is a
random 0..1 value per cell; worleynoise3d is a distance field, near 0 at each cell's feature point and higher
toward cell borders. noise2d and fractal2d are signed, roughly -1..1; worleynoise2d as vector2 is (F1, F2), and
F2 - F1 is 0 on cell borders (cracks, joints). heighttonormal uses screen-space derivatives and returns a flat normal
when UV derivatives are tiny, so give it millimetre-scale units: texcoord = uv * 1000 and height (metres) * 1000,
with scale 16 for physically correct slopes when 1 UV unit = 1 m. Thin film is a set of standard_surface inputs (thin_film_thickness, thin_film_IOR), not a node.
Edits are validated as they happen and throw with a code and message on an invalid change.`;

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'mtlx', version: '0.6.0' });

  server.registerTool(
    'check_material',
    {
      description: 'Validate a MaterialX file. Returns ok plus a list of issues with level, location, and message.',
      inputSchema: {
        file,
        strict: z.boolean().optional().describe('Treat warnings as failures'),
        rules: z.array(z.enum(MATERIALX_VALIDATION_RULES)).optional().describe('Rule groups to run (default basic)'),
      },
    },
    async (args) => {
      try {
        return json(await runCheck(args.file, { strict: args.strict, rules: args.rules }));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    'list_node_definitions',
    {
      description:
        'Search the built-in MaterialX node definitions. Returns matching definition names with their output type, inputs (name, type, default), and notes on how the preview renderer behaves for surprising nodes (noise ranges, worley styles, heighttonormal), so scripts use exact names such as ND_absval_float or ND_worleynoise3d_float.',
      inputSchema: {
        query: z
          .string()
          .describe(
            'Case-insensitive substring matched against the definition name, category, or node group (e.g. "noise3d", "absval", "procedural3d")',
          ),
        limit: z.number().int().min(1).max(200).optional().describe('Maximum results (default 40)'),
      },
    },
    (args) => json(findNodeDefinitions(args.query, args.limit)),
  );

  server.registerTool(
    'inspect_material',
    {
      description:
        'Summarize a MaterialX file: version, colorspace, materials, referenced textures, node graphs, nodes, and the size of every asset.',
      inputSchema: { file },
    },
    async (args) => {
      try {
        return json(await loadInfo(args.file));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    'render_material',
    {
      description:
        'Render a MaterialX file with a headless browser and return PNG images. Several named `views` render in one browser session after a single compile (much faster than separate calls) and come back as a captioned contact sheet. Plane views are head-on and sized in meters assuming 1 UV unit = 1 m: plane (the whole 0..1 tile), closeup (20 cm), detail (5 cm), plane:<meters>; also grazing (plane at 72 degrees with the environment behind it), sphere (environment backdrop, judge gloss and reflections here), totem, cube. `channel` shows any nodegraph node unlit (floats grey, vectors as rgb) with `range` mapped to black..white and returns its value statistics, for checking masks and heights numerically. The backdrop is otherwise transparent. Fails with the compile error when the material cannot be built.',
      inputSchema: {
        file,
        views: z
          .array(z.string())
          .optional()
          .describe(
            'Named views, e.g. ["plane", "closeup", "sphere"]; when absent, one view from geometry/zoom/elevation',
          ),
        geometry: z.enum(GEOMETRIES).optional().describe('Preview geometry when views is absent (default totem)'),
        material: z.string().optional().describe('Material name (default: last material in the document)'),
        background: z.enum(['none', 'environment']).optional().describe('none (transparent, default) or environment'),
        size: z
          .number()
          .int()
          .min(64)
          .max(2048)
          .optional()
          .describe('Image width and height in pixels per view (default 800)'),
        ibl: z
          .enum(IBLS)
          .optional()
          .describe(
            'Lighting (default studio, soft and dim). bridge: outdoor, shows relief, green-yellow cast. sun: hard midday sun, strongest relief. overcast: soft medium daylight, near neutral. neutral: colorless grey studio for judging albedo. strips: dark room with sharp softbox strips, for judging gloss and roughness variation. dusk: warm medium-dark street. night: very dark.',
          ),
        exposure: z.number().min(-2).max(2).optional().describe('Exposure in stops (default 0)'),
        zoom: z.number().min(1).max(100).optional().describe('Camera zoom when views is absent (default 1)'),
        elevation: z
          .number()
          .min(0)
          .max(89)
          .optional()
          .describe('Camera elevation in degrees when views is absent (default 35; 0 is head-on)'),
        center: z
          .tuple([z.number(), z.number()])
          .optional()
          .describe('UV point plane views aim at, e.g. [0.25, 0.7], to inspect a specific feature'),
        supersample: z
          .boolean()
          .optional()
          .describe('Render at 2x and downsample: smoother thin lines and fewer normal artifacts'),
        channel: z.string().optional().describe('Name of a nodegraph node to show unlit, with value statistics'),
        range: z
          .tuple([z.number(), z.number()])
          .optional()
          .describe('Value range mapped to black..white for channel (default [0, 1])'),
        uvScale: z
          .number()
          .positive()
          .optional()
          .describe('Multiply every texcoord by N so the 1 m plane shows N x N meters'),
        grid: z
          .number()
          .positive()
          .optional()
          .describe('Overlay labelled UV grid lines every N meters on head-on plane views'),
        mirror: z
          .object({ axis: z.enum(['u', 'v']), at: z.number() })
          .optional()
          .describe('Report symmetry about a UV line on head-on plane views (book-match checks)'),
      },
    },
    async (args) => {
      try {
        const shots = await renderViews({ input: args.file, ...args });
        const lines: string[] = [];
        for (const shot of shots) {
          if (args.mirror) {
            const d = await mirrorDiff(shot.png, shot.view, args.mirror.axis, args.mirror.at, args.uvScale);
            lines.push(
              `${shot.view.name} mirror ${d.axis}=${d.at}: mean ${d.mean.toFixed(4)}, max ${d.max.toFixed(4)} (0..1)`,
            );
          }
          if (args.grid) shot.png = await gridOverlay(shot.png, shot.view, args.grid, args.uvScale);
        }
        const size = args.size ?? 800;
        const png = shots.length > 1 ? await contactSheet(shots, size) : shots[0]!.png;
        lines.unshift(`Rendered ${args.file}: ${shots.map((shot) => shot.view.name).join(', ')}`);
        if (args.channel) {
          for (const shot of shots) {
            const [r, g, b] = await channelStats(shot.png, args.range);
            const grey = r!.mean === g!.mean && r!.mean === b!.mean && r!.max === b!.max;
            lines.push(`${shot.view.name} ${args.channel}: ${JSON.stringify(grey ? r : { r, g, b })}`);
          }
        }
        return {
          content: [
            { type: 'image' as const, data: png.toString('base64'), mimeType: 'image/png' },
            { type: 'text' as const, text: lines.join('\n') },
          ],
        };
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    'edit_material',
    {
      description:
        'Edit a loose .mtlx file by running a script against the mtlx-core/session API, then save it. Returns the diagnostics and node list afterwards. Invalid edits throw and leave the file unchanged.',
      inputSchema: {
        file: z.string().describe('Path to a loose .mtlx file (not .mtlx.zip)'),
        script: z.string().describe(EDIT_SCRIPT_DOC),
      },
    },
    async (args) => {
      try {
        if (args.file.endsWith('.zip')) throw new Error('edit_material only edits loose .mtlx files');
        const editor = createEditorSession({ document: parseMaterialX(await readFile(args.file, 'utf8')) });
        const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as FunctionConstructor;
        await new AsyncFunction('editor', 'graph', args.script)(editor, editor.graph(''));
        await writeFile(args.file, editor.toXml());
        return json({
          saved: args.file,
          changed: editor.getSnapshot().dirty,
          diagnostics: editor.getDiagnostics(),
          // Ids and authored definition names only: the full node projection runs to kilobytes per
          // node, and `node.definition` is a polymorphic fallback rather than the authored nodedef.
          nodes: editor
            .graph('')
            .listNodes()
            .map((node) => ({
              id: node.id,
              definition: node.element.attributes.nodedef ?? node.definition?.nodeDefName,
            })),
        });
      } catch (error) {
        return failure(error);
      }
    },
  );

  return server;
}
