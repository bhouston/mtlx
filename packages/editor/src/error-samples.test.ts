import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseMaterialX, validateDocument } from 'mtlx-core';
import { validateGraph } from './validation.js';

it.each([
  ['error_invalid_values', 2, 'Invalid', 0],
  ['error_connection_type', 1, 'expected "float"', 1],
  ['error_missing_source', 1, 'Cannot resolve connection source', 0],
  ['error_cycle', 2, 'forms a cycle', 2],
  ['error_missing_output', 1, 'Cannot resolve output', 1],
] as const)('%s demonstrates its intended errors', (name, count, message, wires) => {
  const xml = readFileSync(new URL(`../../website/public/materials/${name}/${name}.mtlx`, import.meta.url), 'utf8');
  const document = parseMaterialX(xml);
  const issues = validateGraph(document);
  const shared = validateDocument(document, { rules: ['structure', 'types'] });
  expect(shared).toHaveLength(count);
  expect(shared.map((issue) => issue.graph?.nodeIds)).toEqual(issues.map((issue) => issue.nodeIds));
  expect(shared.every((issue) => issues.some((display) => display.message.endsWith(issue.message)))).toBe(true);
  expect(issues).toHaveLength(count);
  expect(issues.every((issue) => issue.message.includes(message))).toBe(true);
  expect(issues.filter((issue) => issue.edgeId)).toHaveLength(wires);
});

it('error_subgraph exposes its nested connection error on both containers', () => {
  const xml = readFileSync(
    new URL('../../website/public/materials/error_subgraph/error_subgraph.mtlx', import.meta.url),
    'utf8',
  );
  const document = parseMaterialX(xml);
  const shared = validateDocument(document, { rules: ['structure', 'types'] });
  expect(shared).toHaveLength(1);
  expect(shared[0]?.code).toBe('CONNECTION_TYPE_MISMATCH');
  expect(validateGraph(document)).toEqual([
    expect.objectContaining({
      nodeIds: ['finish'],
      edgeId: undefined,
      message: expect.stringContaining('finish/roughness/amount.in1'),
    }),
  ]);
  expect(validateGraph(document, 'finish')).toEqual([
    expect.objectContaining({ nodeIds: ['roughness'], edgeId: undefined }),
  ]);
  expect(validateGraph(document, 'finish/roughness')).toEqual([
    expect.objectContaining({ nodeIds: ['amount', 'color'], edgeId: 'amount/in1' }),
  ]);
});
