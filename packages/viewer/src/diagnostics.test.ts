import { readFileSync } from 'node:fs';
import { parseMaterialX, summarizeMaterialX } from '../../core/src/index.js';
import { expect, it } from 'vitest';
import { computeChecks, summarizeInternalNodes, type DiagnosticInput } from './diagnostics';

const ready: DiagnosticInput = {
  issues: [],
  resourcesChecked: true,
  preview: { state: 'ready', resources: 'loaded', failedResources: [] },
};
it('uses the same check ordering and status precedence for every host', () => {
  const result = computeChecks(ready);
  expect(result.overall).toBe('passed');
  expect(result.checks.map((check) => check.name)).toEqual([
    'XML',
    'Nodes',
    'Structure',
    'Types',
    'Dependencies',
    'Renderer support',
    'Preview',
  ]);
  const failed = computeChecks({
    ...ready,
    issues: [{ level: 'warning', rule: 'types', location: 'node', message: 'Warning' }],
    viewerError: 'GPU failed',
  });
  expect(failed.overall).toBe('failed');
  expect(failed.checks.at(-1)?.messages).toEqual(['GPU failed']);
});
it('does not claim unrun validation passed after malformed XML', () => {
  const { checks, overall } = computeChecks({ issues: [], parseError: 'Invalid XML' });
  expect(overall).toBe('failed');
  expect(checks[0]?.state).toBe('failed');
  expect(checks.slice(1).every((check) => check.state === 'unchecked')).toBe(true);
});
const dependencyCheck = (input: DiagnosticInput) =>
  computeChecks(input).checks.find((check) => check.name === 'Dependencies')!;

it('distinguishes pending, unchecked, and failed dependencies', () => {
  expect(dependencyCheck({ ...ready, resourcesChecked: false }).state).toBe('unchecked');
  expect(
    dependencyCheck({ ...ready, preview: { state: 'loading', resources: 'loading', failedResources: [] } }).state,
  ).toBe('pending');
  const failed = dependencyCheck({
    ...ready,
    preview: { state: 'ready', resources: 'loaded', failedResources: ['texture.png'] },
  });
  expect(failed.state).toBe('failed');
  expect(failed.messages).toContain('Failed to load: texture.png');
});
it('groups internal node types and excludes materials', () => {
  expect(
    summarizeInternalNodes({
      materials: [{ category: 'custom_material' }],
      nodes: [
        { category: 'custom_material' },
        { category: 'surfacematerial' },
        { category: 'multiply' },
        { category: 'image' },
        { category: 'multiply' },
      ],
    }),
  ).toEqual({
    types: [
      ['image', 1],
      ['multiply', 2],
    ],
    count: 3,
  });
});

it('includes all Onyx subgraph nodes in the Info panel counts', () => {
  const xml = readFileSync(new URL('../../editor/src/fixtures/onyx_hextiled.mtlx', import.meta.url), 'utf8');
  expect(summarizeInternalNodes(summarizeMaterialX('onyx_hextiled.mtlx', parseMaterialX(xml)))).toEqual({
    count: 5,
    types: [
      ['convert', 1],
      ['extract', 1],
      ['hextiledimage', 2],
      ['standard_surface', 1],
    ],
  });
});

it('groups nodes across every graph depth using the same category counts', () => {
  const document = parseMaterialX(
    '<materialx><constant name="c" type="float"/><nodegraph name="outer"><constant name="c" type="float"/><nodegraph name="inner"><constant name="c" type="float"/></nodegraph></nodegraph><surfacematerial name="m" type="material"/></materialx>',
  );
  expect(summarizeInternalNodes(summarizeMaterialX('nested.mtlx', document))).toEqual({
    count: 3,
    types: [['constant', 3]],
  });
});
