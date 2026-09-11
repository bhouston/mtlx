import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { processMaterialX } from './processing.js';

let dir: string;
const xml = '<materialx version="1.39"><standard_surface name="surface" type="surfaceshader"/></materialx>';
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'mtlx-process-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('staged material processing', () => {
  it('reports a transform that leaves serialized package content unchanged', async () => {
    const input = path.join(dir, 'input.mtlx');
    await writeFile(input, xml);
    const result = await processMaterialX(input, path.join(dir, 'out.mtlx'), {
      dryRun: true,
      transforms: [function identity() {}],
    });
    expect(result.success).toBe(true);
    expect(result.operations).toEqual([{ name: 'identity', status: 'unchanged' }]);
    expect(result.skippedOperations).toContainEqual({
      operation: 'identity',
      reason: 'No serialized document or resource bytes changed',
    });
  });

  it('plans a transformed archive without changing input or creating any output directory', async () => {
    const input = path.join(dir, 'input.mtlx');
    await writeFile(input, xml);
    const result = await processMaterialX(input, path.join(dir, 'absent', 'output.mtlx.zip'), {
      dryRun: true,
      transforms: [
        (pkg) => {
          pkg.document.attributes.doc = 'transformed in memory';
        },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.bytesWritten).toBe(0);
    expect(result.afterBytes).toBeGreaterThan(result.beforeBytes!);
    expect(result.changes).toHaveLength(1);
    expect(result.stages.find((stage) => stage.name === 'commit')?.status).toBe('skipped');
    expect(await readdir(dir)).toEqual(['input.mtlx']);
    expect(await readFile(input, 'utf8')).toBe(xml);
  });

  it('commits the same pipeline when dryRun is omitted', async () => {
    const input = path.join(dir, 'input.mtlx');
    const output = path.join(dir, 'out.mtlx');
    await writeFile(input, xml);
    const result = await processMaterialX(input, output);
    expect(result.success).toBe(true);
    expect(result.bytesWritten).toBeGreaterThan(0);
    expect(await readFile(output, 'utf8')).toContain('standard_surface');
    expect(result.skippedOperations).toContainEqual({ operation: 'transform', reason: 'No transforms requested' });
  });

  it('reports malformed XML at parse and skips all following stages', async () => {
    const input = path.join(dir, 'input.mtlx');
    await writeFile(input, '<materialx>');
    const result = await processMaterialX(input, path.join(dir, 'out.mtlx'));
    expect(result.success).toBe(false);
    expect(result.errors[0].stage).toBe('parse');
    expect(result.stages.slice(1).every((stage) => stage.status === 'skipped')).toBe(true);
    expect(await readdir(dir)).toEqual(['input.mtlx']);
  });

  it('reports missing dependencies at resolve without creating output', async () => {
    const input = path.join(dir, 'input.mtlx');
    await writeFile(
      input,
      '<materialx version="1.39"><image name="image" type="color3"><input name="file" type="filename" value="missing.png"/></image></materialx>',
    );
    const result = await processMaterialX(input, path.join(dir, 'out.mtlx'));
    expect(result.errors[0].stage).toBe('resolve');
    expect(await readdir(dir)).toEqual(['input.mtlx']);
  });

  it('rejects invalid transformed output before planning or commit', async () => {
    const input = path.join(dir, 'input.mtlx');
    await writeFile(input, xml);
    const result = await processMaterialX(input, path.join(dir, 'out.mtlx'), {
      transforms: [
        (pkg) => {
          pkg.document.elements.push({
            name: 'standard_surface',
            attributes: { name: 'surface', type: 'surfaceshader' },
            children: [],
          });
        },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.errors[0].stage).toBe('validate-output');
    expect(result.changes).toEqual([]);
    expect(await readdir(dir)).toEqual(['input.mtlx']);
  });

  it('reports transformation failures and leaves inputs intact', async () => {
    const input = path.join(dir, 'input.mtlx');
    await writeFile(input, xml);
    const result = await processMaterialX(input, path.join(dir, 'out.mtlx'), {
      transforms: [
        () => {
          throw new Error('unsupported encoding');
        },
      ],
    });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ stage: 'transform', message: 'unsupported encoding' }),
    );
    expect(await readdir(dir)).toEqual(['input.mtlx']);
  });
});
