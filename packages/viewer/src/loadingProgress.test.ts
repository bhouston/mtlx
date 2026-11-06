import { expect, it, vi } from 'vitest';
import { LoadingTracker } from './loadingProgress.js';
it('aggregates overlapping work without reaching completion early or regressing', () => {
  const publish = vi.fn();
  const tracker = new LoadingTracker(publish);
  const setup = tracker.start('material-load');
  setup(0.5);
  const environment = tracker.start('environment-update');
  environment(1);
  expect(publish.mock.lastCall![0].totalProgress).toBeLessThan(1);
  setup(1);
  expect(publish.mock.lastCall![0].totalProgress).toBe(1);
  const values = publish.mock.calls.map(([event]) => event.totalProgress);
  expect(values).toEqual(values.toSorted((a, b) => a - b));
  const geometry = tracker.start('geometry-update');
  expect(publish.mock.lastCall![0]).toEqual({ totalProgress: 0, reason: 'geometry-update' });
  geometry(1);
  expect(publish.mock.lastCall![0].totalProgress).toBe(1);
});

it('ignores callbacks belonging to a failed cycle after reset', () => {
  const publish = vi.fn();
  const tracker = new LoadingTracker(publish);
  const obsolete = tracker.start('material-load');
  tracker.reset();
  const current = tracker.start('material-load');
  obsolete(1);
  expect(publish.mock.lastCall![0].totalProgress).toBe(0);
  current(1);
  expect(publish.mock.lastCall![0].totalProgress).toBe(1);
});
