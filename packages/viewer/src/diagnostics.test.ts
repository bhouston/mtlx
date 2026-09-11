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
it('distinguishes pending, unchecked, and failed dependencies', () => {
  const state = (input: DiagnosticInput) => computeChecks(input).checks.find((check) => check.name === 'Dependencies')!;
  expect(state({ ...ready, resourcesChecked: false }).state).toBe('unchecked');
  expect(state({ ...ready, preview: { state: 'loading', resources: 'loading', failedResources: [] } }).state).toBe(
    'pending',
  );
  const failed = state({
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
