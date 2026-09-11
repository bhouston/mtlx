import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { runCheck } from './check.js';

it('keeps advisory warnings successful unless strict is selected', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mtlx-check-'));
  try {
    const input = join(directory, 'unknown.mtlx');
    await writeFile(input, '<materialx version="1.39"><custom_unknown name="node" type="float"/></materialx>');
    expect((await runCheck(input)).ok).toBe(true);
    const strict = await runCheck(input, { strict: true });
    expect(strict.ok).toBe(false);
    expect(strict.issues).toContainEqual(expect.objectContaining({ code: 'UNKNOWN_NODE_CATEGORY' }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it('lets CI select connection checks independently from category warnings', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'mtlx-check-'));
  try {
    const input = join(directory, 'broken.mtlx');
    await writeFile(
      input,
      '<materialx version="1.39"><add name="node" type="float"><input name="in1" type="float" nodename="missing"/></add></materialx>',
    );
    expect((await runCheck(input)).ok).toBe(true);
    const structural = await runCheck(input, { rules: ['structure'] });
    expect(structural.ok).toBe(false);
    expect(structural.issues).toContainEqual(expect.objectContaining({ code: 'UNRESOLVED_CONNECTION' }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
