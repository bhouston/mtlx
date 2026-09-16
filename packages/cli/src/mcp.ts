/**
 * `mtlx mcp`: a Model Context Protocol server over stdio so agents like Claude Code and Codex can
 * check, inspect, render, and edit materials as tools instead of shelling out. Every tool is a thin
 * wrapper over the same functions the CLI commands use.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MATERIALX_VALIDATION_RULES, materialXNodeRegistry, parseMaterialX } from 'mtlx-core';
import { createEditorSession } from 'mtlx-core/session';
import { z } from 'zod';
import { runCheck } from './commands/check.js';
import { loadInfo } from './commands/info.js';
import { GEOMETRIES, renderMaterial } from './commands/render.js';

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
toward cell borders. Thin film is a set of standard_surface inputs (thin_film_thickness, thin_film_IOR), not a node.
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
        'Search the built-in MaterialX node definitions. Returns matching definition names with their output type and inputs (name, type, default), so scripts use exact names such as ND_absval_float or ND_worleynoise3d_float.',
      inputSchema: {
        query: z
          .string()
          .describe(
            'Case-insensitive substring matched against the definition name, category, or node group (e.g. "noise3d", "absval", "procedural3d")',
          ),
        limit: z.number().int().min(1).max(200).optional().describe('Maximum results (default 40)'),
      },
    },
    (args) => {
      const query = args.query.trim().toLowerCase();
      const matches = materialXNodeRegistry.filter((spec) =>
        [spec.nodeDefName, spec.category, spec.nodeGroup].some((field) => field?.toLowerCase().includes(query)),
      );
      return json({
        total: matches.length,
        definitions: matches.slice(0, args.limit ?? 40).map((spec) => ({
          name: spec.nodeDefName,
          category: spec.category,
          output: spec.type,
          inputs: [...spec.inputs, ...spec.parameters].map((port) => ({
            name: port.name,
            type: port.type,
            ...(port.value !== undefined ? { default: port.value } : {}),
          })),
        })),
      });
    },
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
        'Render a MaterialX file to a PNG image with a headless browser and return it. The backdrop is transparent by default so only the model is visible; use background "environment" to judge reflective, glossy, metallic or transmissive materials, since reflections and refraction need something to show. Lighting is the same studio IBL in both modes and is fairly dim, so bright diffuse materials read mid-grey. Fails with the compile error when the material cannot be built.',
      inputSchema: {
        file,
        geometry: z.enum(GEOMETRIES).optional().describe('Preview geometry (default totem)'),
        material: z.string().optional().describe('Material name (default: last material in the document)'),
        background: z.enum(['none', 'environment']).optional().describe('none (transparent, default) or environment'),
        size: z.number().int().min(64).max(2048).optional().describe('Image width and height in pixels (default 800)'),
      },
    },
    async (args) => {
      try {
        const png = await renderMaterial({ input: args.file, ...args });
        return {
          content: [
            { type: 'image' as const, data: png.toString('base64'), mimeType: 'image/png' },
            { type: 'text' as const, text: `Rendered ${args.file} (${args.geometry ?? 'totem'})` },
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
