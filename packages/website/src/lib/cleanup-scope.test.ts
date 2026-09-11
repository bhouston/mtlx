import { expect, it } from 'vitest';
import { CleanupScope } from './cleanup-scope';

it('releases in reverse allocation order exactly once and releases late async allocations', () => {
  const scope = new CleanupScope();
  const released: string[] = [];
  scope.own(() => released.push('renderer'));
  scope.own(() => released.push('controls'));
  scope.dispose();
  scope.own(() => released.push('late scene'));
  scope.dispose();
  expect(released).toEqual(['controls', 'renderer', 'late scene']);
});
