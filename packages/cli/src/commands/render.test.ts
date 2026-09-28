import { parseMaterialX, validateDocument } from 'mtlx-core';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import {
  channelDocument,
  cropPixels,
  encodeImage,
  graphComplexity,
  gridOverlay,
  imageFormatOf,
  mirrorDiff,
  parseView,
  uvScaledDocument,
} from './render.js';

const doc = `<?xml version="1.0"?>
<materialx version="1.39">
  <nodegraph name="NG">
    <texcoord name="uv" type="vector2" />
    <noise2d name="height" type="float"><input name="texcoord" type="vector2" nodename="uv" /></noise2d>
    <output name="out" type="float" nodename="height" />
  </nodegraph>
</materialx>
`;

describe('parseView', () => {
  it('sizes plane presets in meters and applies widths and centers', () => {
    expect(parseView('plane')).toMatchObject({ name: 'plane', geometry: 'plane', width: 1, elevation: 0 });
    expect(parseView('plane:0.3', [0.2, 0.8])).toMatchObject({ name: 'plane-0.3', width: 0.3, center: [0.2, 0.8] });
    expect(parseView('closeup', [0.2, 0.8]).center).toEqual([0.2, 0.8]);
    expect(parseView('totem', [0.2, 0.8]).center).toBeUndefined();
    expect(parseView('plane', [0.2, 0.8]).center).toBeUndefined();
    expect(() => parseView('fisheye')).toThrow(/Unknown view/);
    expect(() => parseView('plane:-1')).toThrow(/positive/);
  });
});

describe('channelDocument', () => {
  it('adds a valid unlit material that shows the named node', () => {
    const xml = channelDocument(doc, 'height', [-1, 1]);
    expect(xml).toContain('<surfacematerial name="__mtlx_channel"');
    expect(xml).toContain('nodegraph="NG" output="__ch_out"');
    expect(validateDocument(parseMaterialX(xml), { rules: ['basic', 'structure', 'types'] })).toEqual([]);
  });

  it('accepts a nodegraph output name', () => {
    expect(channelDocument(doc, 'out')).toContain('nodename="height" />');
  });

  it('names the problem when the node is missing', () => {
    expect(() => channelDocument(doc, 'uv_missing')).toThrow(/no node named "uv_missing"/);
  });
});

describe('uvScaledDocument', () => {
  it('scales texcoords under their original names and stays valid', () => {
    const xml = uvScaledDocument(doc, 4);
    expect(xml).toContain('<multiply name="uv" type="vector2">');
    expect(xml).toContain('value="4"');
    expect(validateDocument(parseMaterialX(xml), { rules: ['basic', 'structure', 'types'] })).toEqual([]);
  });
});

describe('graphComplexity', () => {
  it('counts the expanded tree and names re-read nodes', () => {
    const xml = `<materialx><nodegraph name="g">
      <texcoord name="uv" type="vector2" />
      <multiply name="a" type="vector2"><input name="in1" type="vector2" nodename="uv" /><input name="in2" type="float" value="2" /></multiply>
      <add name="b" type="vector2"><input name="in1" type="vector2" nodename="a" /><input name="in2" type="vector2" nodename="a" /></add>
      <output name="o" type="vector2" nodename="b" />
    </nodegraph></materialx>`;
    const c = graphComplexity(xml);
    expect(c.nodes).toBe(3);
    expect(c.expanded).toBe(5); // b + 2 × (a + uv)
    expect(c.rereads[0]).toEqual({ name: 'a', reads: 2, subtree: 2 });
  });
});

// 64 px head-on view of the whole tile: left half dark, right half light, so it mirrors about v but not u.
const halves = () => {
  const data = Buffer.alloc(64 * 64 * 4);
  for (let i = 0; i < 64 * 64; i++) {
    data.fill(i % 64 < 32 ? 40 : 200, i * 4, i * 4 + 3);
    data[i * 4 + 3] = 255;
  }
  return sharp(data, { raw: { width: 64, height: 64, channels: 4 } })
    .png()
    .toBuffer();
};

describe('image checks', () => {
  const plane = parseView('plane');

  it('measures mirror symmetry about a UV line', async () => {
    expect((await mirrorDiff(await halves(), plane, 'v', 0.5)).max).toBe(0);
    expect((await mirrorDiff(await halves(), plane, 'u', 0.5)).mean).toBeCloseTo(160 / 255, 3);
  });

  it('overlays a grid and crops at native pixels', async () => {
    const grid = await gridOverlay(await halves(), plane, 0.25);
    expect((await sharp(grid).metadata()).width).toBe(64);
    const crop = await cropPixels(await halves(), [30, 0, 4], 32);
    const { data } = await sharp(crop).raw().toBuffer({ resolveWithObject: true });
    expect([data[0], data[(32 - 1) * 3]]).toEqual([40, 200]); // nearest neighbour keeps the hard edge
  });
});

describe('render image output', () => {
  it('picks the format from the output extension', () => {
    expect(imageFormatOf('a/b.PNG')).toBe('png');
    expect(imageFormatOf('b.jpeg')).toBe('jpg');
    expect(imageFormatOf('b.webp')).toBe('webp');
    expect(imageFormatOf('b.avif')).toBe('avif');
    expect(imageFormatOf('out/')).toBeUndefined();
  });

  it('encodes a render in each format', async () => {
    const png = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#808080' } })
      .png()
      .toBuffer();
    const formats = { png: 'png', jpg: 'jpeg', webp: 'webp', avif: 'heif' } as const;
    for (const [format, decoded] of Object.entries(formats)) {
      const meta = await sharp(await encodeImage(png, format as keyof typeof formats)).metadata();
      expect(meta.format).toBe(decoded);
      expect(meta.width).toBe(8);
    }
  });
});
