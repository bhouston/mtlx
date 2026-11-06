import { expect, it } from 'vitest';
import { normalizeEnvironmentRotation, parseViewerSettings } from './renderingSettings.js';

it('wraps finite degree inputs and ignores invalid values', () => {
  for (const [input, expected] of [
    [0, 0],
    [360, 0],
    [725, 5],
    [-90, 270],
    ['-450', 270],
    [' 45.5 ', 45.5],
  ] as const) {
    expect(normalizeEnvironmentRotation(input)).toBe(expected);
    expect(parseViewerSettings({ environmentRotation: input })).toEqual({ environmentRotation: expected });
  }
  for (const input of [undefined, null, '', ' ', 'banana', NaN, Infinity, -Infinity, {}, true]) {
    expect(normalizeEnvironmentRotation(input)).toBeUndefined();
    expect(parseViewerSettings({ environmentRotation: input })).toEqual({});
  }
});
