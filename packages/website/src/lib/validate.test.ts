import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateMaterialXText } from './validate.js';

// Real material-samples.com materials, shared with the cli's and vscode-extension's tests via
// the repo-root /assets rather than duplicated per package.
const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../../assets');

describe('validateMaterialXText', () => {
  it('passes on the procedural copper fixture (no textures)', async () => {
    const text = await readFile(path.join(assetsDir, 'copper/copper.mtlx'), 'utf8');
    const issues = validateMaterialXText(text);
    expect(issues.filter((issue) => issue.level === 'error')).toHaveLength(0);
  });

  it('passes on the textured wood_grain fixture', async () => {
    const text = await readFile(path.join(assetsDir, 'wood_grain/wood_grain.mtlx'), 'utf8');
    const issues = validateMaterialXText(text);
    expect(issues.filter((issue) => issue.level === 'error')).toHaveLength(0);
  });
});
