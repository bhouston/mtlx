import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import UTIF from 'three/addons/libs/utif.module.js';

const fixture = fileURLToPath(new URL('../../../assets/wood_grain_tiff/textures/wood_color.tif', import.meta.url));

it('decodes a real VFX-style TIFF texture to RGBA8 without throwing', () => {
  const buffer = readFileSync(fixture).buffer;
  const [ifd] = UTIF.decode(buffer);
  expect(ifd).toBeDefined();
  UTIF.decodeImage(buffer, ifd!);
  const rgba = UTIF.toRGBA8(ifd!);
  expect(rgba.length).toBe(ifd!.width * ifd!.height * 4);
});
