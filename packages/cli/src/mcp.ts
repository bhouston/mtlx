/**
 * `mtlx mcp`: a Model Context Protocol server over stdio so agents like Claude Code and Codex can
 * check, inspect, render, and edit materials as tools instead of shelling out. Every tool is a thin
 * wrapper over the same functions the CLI commands use.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MATERIALX_VALIDATION_RULES, parseMaterialX, summarizeMaterialX } from 'mtlx-core';
import { loadMaterialXDocument } from 'mtlx-core/node';
import { createEditorSession } from 'mtlx-core/session';
import { z } from 'zod';
import { runCheck } from './commands/check.js';
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
    'inspect_material',
    {
      description:
        'Summarize a MaterialX file: version, colorspace, materials, referenced textures, node graphs, and nodes.',
      inputSchema: { file },
    },
    async (args) => {
      try {
        const { document } = await loadMaterialXDocument(args.file);
        return json(summarizeMaterialX(args.file, document));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    'render_material',
    {
      description:
        'Render a MaterialX file to a PNG image with a headless browser and return it. The backdrop is transparent by default so only the model is visible. Fails with the compile error when the material cannot be built.',
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
          nodes: editor.graph('').listNodes(),
        });
      } catch (error) {
        return failure(error);
      }
    },
  );

  return server;
}
