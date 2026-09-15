import { execSync } from 'node:child_process';
import { cpSync } from 'node:fs';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const cliDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(cliDir, '../..');
const fixturesDir = path.join(repoRoot, 'assets');

type ToolResult = { isError?: boolean; content: { type: string; text?: string; data?: string; mimeType?: string }[] };
const text = (result: ToolResult) => result.content.find((c) => c.type === 'text')?.text ?? '';

describe('mtlx mcp', () => {
  let client: Client;
  let tempDir: string;
  let wood: string;

  // Drives the built binary over stdio, exactly as an agent host would (`mtlx mcp`).
  beforeAll(async () => {
    execSync('pnpm --filter mtlx-core build && pnpm --filter mtlx-cli build', { cwd: repoRoot, stdio: 'inherit' });
    client = new Client({ name: 'test', version: '0' });
    await client.connect(
      new StdioClientTransport({ command: 'node', args: [path.join(cliDir, 'bin/cli.js'), 'mcp'], cwd: cliDir }),
    );
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-mcp-'));
    cpSync(path.join(fixturesDir, 'wood_grain'), tempDir, { recursive: true });
    wood = path.join(tempDir, 'wood_grain.mtlx');
  });
  afterAll(() => client.close());

  it('lists the four tools', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).toSorted()).toEqual([
      'check_material',
      'edit_material',
      'inspect_material',
      'list_node_definitions',
      'render_material',
    ]);
  });

  it('searches node definitions by name, category, or group', async () => {
    const result = (await client.callTool({
      name: 'list_node_definitions',
      arguments: { query: 'worleynoise3d' },
    })) as ToolResult;
    const { definitions } = JSON.parse(text(result));
    const float = definitions.find((d: { name: string }) => d.name === 'ND_worleynoise3d_float');
    expect(float.output).toBe('float');
    expect(float.inputs.map((i: { name: string }) => i.name)).toContain('jitter');
  });

  it('types untyped scalars from the node definition and names accepted types on a conflict', async () => {
    const ok = (await client.callTool({
      name: 'edit_material',
      arguments: {
        file: wood,
        script: "const m = graph.addNode({ definition: 'ND_multiply_float' }); graph.setInputValue(m, 'in2', 3)",
      },
    })) as ToolResult;
    expect(ok.isError).toBeFalsy();
    expect(await readFile(wood, 'utf8')).toContain('<input name="in2" type="float" value="3"/>');
    expect(JSON.parse(text(ok)).nodes).toContainEqual({ id: 'multiply', definition: 'ND_multiply_float' });
    // color3 * float exists, but no multiply variant takes color3 and vector3 together.
    const conflict = (await client.callTool({
      name: 'edit_material',
      arguments: {
        file: wood,
        script:
          "graph.setInputValue('multiply', 'in1', [1, 0, 0], { type: 'color3' }); graph.setInputValue('multiply', 'in2', [1, 1, 1], { type: 'vector3' })",
      },
    })) as ToolResult;
    expect(conflict.isError).toBe(true);
    expect(text(conflict)).toMatch(/Type "vector3" for multiply\.in2 conflicts.*Accepted here: float/);
  });

  it('checks and inspects a material', async () => {
    const check = (await client.callTool({ name: 'check_material', arguments: { file: wood } })) as ToolResult;
    expect(JSON.parse(text(check)).ok).toBe(true);
    const info = (await client.callTool({ name: 'inspect_material', arguments: { file: wood } })) as ToolResult;
    expect(JSON.parse(text(info)).materials.map((m: { name: string }) => m.name)).toContain('Tiled_Wood');
  });

  it('reports a missing file as a failed check', async () => {
    const result = (await client.callTool({ name: 'check_material', arguments: { file: '/nope.mtlx' } })) as ToolResult;
    const parsed = JSON.parse(text(result));
    expect(parsed.ok).toBe(false);
    expect(parsed.issues[0].code).toBe('READ_OR_PARSE_ERROR');
  });

  it('edits a material through a session script and saves it', async () => {
    const result = (await client.callTool({
      name: 'edit_material',
      arguments: { file: wood, script: "graph.setInputValue('SR_wood1', 'specular_roughness', 0.75)" },
    })) as ToolResult;
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(text(result)).changed).toBe(true);
    expect(await readFile(wood, 'utf8')).toContain('name="specular_roughness" type="float" value="0.75"');
  });

  it('rejects an invalid edit and leaves the file untouched', async () => {
    const before = await readFile(wood, 'utf8');
    const result = (await client.callTool({
      name: 'edit_material',
      arguments: { file: wood, script: "graph.setInputValue('SR_wood1', 'no_such_input', 1)" },
    })) as ToolResult;
    expect(result.isError).toBe(true);
    expect(await readFile(wood, 'utf8')).toBe(before);
  });

  it('renders a material and returns a transparent PNG', async () => {
    const result = (await client.callTool(
      { name: 'render_material', arguments: { file: wood, geometry: 'sphere', size: 256 } },
      undefined,
      { timeout: 80_000 },
    )) as ToolResult;
    expect(result.isError).toBeFalsy();
    const image = result.content.find((c) => c.type === 'image')!;
    expect(image.mimeType).toBe('image/png');
    const { data, info } = await sharp(Buffer.from(image.data!, 'base64')).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height, info.channels]).toEqual([256, 256, 4]);
    expect(data[3]).toBe(0); // corner is transparent
    const center = (128 * 256 + 128) * 4;
    expect(data[center + 3]).toBe(255); // model is opaque
  }, 90_000);
});
