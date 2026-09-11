import { describe, expect, it } from 'vitest';
import { analyze } from './mtlxAnalyze.js';

describe('preview analysis', () => {
  it.each([
    ['broken.mtlx', '<materialx>'],
    ['broken.mtlx.zip', 'not a zip archive'],
  ])('reports %s parse failures as validation errors', async (fileName, text) => {
    const result = await analyze(fileName, new TextEncoder().encode(text));
    expect(result.parseError).toBeTruthy();
    expect(result.issues).toContainEqual(expect.objectContaining({ level: 'error', location: fileName }));
    expect(result.summary).toBeUndefined();
  });
});
