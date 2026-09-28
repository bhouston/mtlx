// Decode the measurement renders (run set1/set2/set3.mjs, render each m*.mtlx with
// `-g plane -s 1024` and no --background, then run this from the same directory).
import { decode } from './dec.mjs';
import { TS, TU } from './set1.mjs';
import { TD } from './set2.mjs';
import { TP } from './set3.mjs';
const S = [TS, TS, TS, TS];
const D = [TD, TD, TD, TD];
await decode('m1.png', S, ['noise2d float', 'noise2d vector3 .y', 'fractal2d float (3 oct)', 'fractal2d vector3 .z']);
await decode('m2.png', S, ['noise3d(u,v,0)', 'fractal3d(u,v,0)', 'fractal2d oct6', 'fractal2d dim0.7']);
await decode('m3.png', [TU, TU, TU, TU], ['unified type0', 'unified type1', 'unified type2', 'unified type3']);
await decode(
  'm4.png',
  [TU, TS, TU, TS],
  ['unified t3 noclamp', 'unified t3 oct1 noclamp', 'unified t0 jitter.5', 'unified t3 jitter.5 noclamp'],
);
await decode('m5.png', D, ['noise2d vec2 x-y', 'fractal2d vec2 x-y', 'noise2d float - vec3.x', 'noise2d vec3 x-y']);
await decode(
  'm6.png',
  [TP, TP, TP, TP],
  ['noise2d amp.5 pivot.5', 'fractal2d amp.5', 'noise2d v3 .z amp(1,1,.5) piv.25', 'fractal2d v3 .z amp(1,1,2)'],
);
await decode('m7.png', D, ['noise3d vec2 x-y', 'fractal3d vec2 x-y', 'noise3d vec3 x-y', 'fractal3d vec3 y-z']);
await decode('m8.png', D, ['noise2d vec4 x-y', 'noise2d vec4 x-w', 'fractal2d vec4 x-w', 'noise2d color4 g-b']);
