import { expect, it } from 'vitest';
import { clipToRgba } from './hdrTextureHandler.js';

it('linearly clips (no tone mapping): values above 1 clip to 255, values below 0 clip to 0', () => {
  const rgba = clipToRgba({ width: 1, height: 1, data: new Float32Array([2, 0.5, -1, 1]) });
  expect(Array.from(rgba)).toEqual([255, 128, 0, 255]);
});
