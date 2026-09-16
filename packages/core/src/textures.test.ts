import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { transformImage } from './textures.js';

const makePng = async (width: number, height: number): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: { r: 200, g: 100, b: 50 } } })
      .png()
      .toBuffer(),
  );

const makeColorTexture = async (color: string) =>
  new Uint8Array(
    await sharp({ create: { width: 8, height: 8, channels: 3, background: color } })
      .png()
      .toBuffer(),
  );

describe('transformImage', () => {
  it('leaves an already-small, already-web-format image untouched with no options', async () => {
    const data = await makePng(16, 16);
    const result = await transformImage(data, '.png', {});
    expect(result.changed).toBe(false);
    expect(result.extension).toBe('.png');
    expect(result.data).toBe(data);
  });

  it('does not resize an image already under the max size', async () => {
    const data = await makePng(32, 32);
    const result = await transformImage(data, '.png', { maxImageSize: 64 });
    expect(result.changed).toBe(false);
  });

  it('resizes an image whose longest edge exceeds maxImageSize', async () => {
    const data = await makePng(256, 128);
    const result = await transformImage(data, '.png', { maxImageSize: 64 });
    expect(result.changed).toBe(true);
    const metadata = await sharp(result.data).metadata();
    expect(metadata.width).toBe(64);
    expect(metadata.height).toBe(32);
    expect(result.extension).toBe('.png');
  });

  it('converts format when a matching target is given', async () => {
    const data = await makePng(16, 16);
    const result = await transformImage(data, '.png', { targets: [{ format: 'webp' }] });
    expect(result.changed).toBe(true);
    expect(result.extension).toBe('.webp');
    const metadata = await sharp(result.data).metadata();
    expect(metadata.format).toBe('webp');
  });

  it('defaults non-web sources (tiff) to webp when no SDR target is given', async () => {
    const tiff = await sharp({ create: { width: 16, height: 16, channels: 3, background: 'red' } })
      .tiff()
      .toBuffer();
    const result = await transformImage(new Uint8Array(tiff), '.tiff', {});
    expect(result.changed).toBe(true);
    expect(result.extension).toBe('.webp');
    const metadata = await sharp(result.data).metadata();
    expect(metadata.format).toBe('webp');
  });

  it('respects imageQuality (lower quality produces a smaller lossy file)', async () => {
    const data = await sharp({ create: { width: 128, height: 128, channels: 3, background: { r: 10, g: 200, b: 90 } } })
      .jpeg()
      .toBuffer();
    const high = await transformImage(new Uint8Array(data), '.jpg', {
      targets: [{ format: 'jpg' }],
      imageQuality: 95,
    });
    const low = await transformImage(new Uint8Array(data), '.jpg', {
      targets: [{ format: 'jpg' }],
      imageQuality: 10,
    });
    expect(low.data.byteLength).toBeLessThan(high.data.byteLength);
  });

  it('ignores an SDR target for an HDR source (dynamic-range classification keeps them apart)', async () => {
    const { writeHdr } = await import('hdrify');
    const hdr = writeHdr({
      width: 2,
      height: 2,
      data: new Float32Array([2, 2, 2, 1, 0.5, 0.5, 0.5, 1, 2, 2, 2, 1, 0.5, 0.5, 0.5, 1]),
      linearColorSpace: 'srgb-linear',
    });
    const result = await transformImage(hdr, '.hdr', { targets: [{ format: 'exr' }] });
    expect(result.changed).toBe(true);
    expect(result.extension).toBe('.exr');
  });

  it('linearly clips an HDR source to SDR (no tone mapping) when only an SDR target is requested', async () => {
    const { writeHdr } = await import('hdrify');
    const hdr = writeHdr({
      width: 1,
      height: 1,
      data: new Float32Array([2, 0.5, 0, 1]),
      linearColorSpace: 'srgb-linear',
    });
    const result = await transformImage(hdr, '.hdr', { targets: [{ format: 'png' }] });
    expect(result.changed).toBe(true);
    expect(result.extension).toBe('.png');
    const raw = await sharp(result.data).raw().toBuffer();
    expect(raw[0]).toBe(255); // 2.0 clips to 255
    expect(raw[1]).toBeGreaterThanOrEqual(126); // ~0.5 * 255; RGBE encoding loses a little precision
    expect(raw[1]).toBeLessThanOrEqual(128);
    expect(raw[2]).toBeLessThanOrEqual(1); // ~0.0; RGBE can't represent exact 0
  });

  it('re-encodes EXR only when the requested compression differs from the source', async () => {
    const { writeExr } = await import('hdrify');
    const image = {
      width: 2,
      height: 2,
      data: new Float32Array(16).fill(0.5),
      linearColorSpace: 'srgb-linear' as const,
    };
    const b44 = writeExr(image, { compression: 'b44' });
    const converted = await transformImage(b44, '.exr', { targets: [{ format: 'exr', compression: 'piz' }] });
    expect(converted.changed).toBe(true);
    expect(converted.extension).toBe('.exr');

    const piz = writeExr(image, { compression: 'piz' });
    const unchanged = await transformImage(piz, '.exr', { targets: [{ format: 'exr', compression: 'piz' }] });
    expect(unchanged.changed).toBe(false);
  });

  it('resizes an oversized EXR whose longest edge exceeds maxImageSize', async () => {
    const { readExr, writeExr } = await import('hdrify');
    const exr = writeExr({
      width: 8,
      height: 4,
      data: new Float32Array(8 * 4 * 4).fill(0.25),
      linearColorSpace: 'srgb-linear',
    });
    const result = await transformImage(exr, '.exr', { maxImageSize: 4 });
    expect(result.changed).toBe(true);
    expect(result.extension).toBe('.exr');
    const resized = readExr(result.data);
    expect(resized.width).toBe(4);
    expect(resized.height).toBe(2);
  });

  it('does not resize an EXR already under maxImageSize', async () => {
    const { writeExr } = await import('hdrify');
    const exr = writeExr({
      width: 4,
      height: 4,
      data: new Float32Array(4 * 4 * 4).fill(0.25),
      linearColorSpace: 'srgb-linear',
    });
    const result = await transformImage(exr, '.exr', { maxImageSize: 8 });
    expect(result.changed).toBe(false);
  });

  it('resizes an oversized HDR source before linearly clipping it to SDR', async () => {
    const { writeHdr } = await import('hdrify');
    const hdr = writeHdr({
      width: 8,
      height: 4,
      data: new Float32Array(8 * 4 * 4).fill(0.5),
      linearColorSpace: 'srgb-linear',
    });
    const result = await transformImage(hdr, '.hdr', { maxImageSize: 4, targets: [{ format: 'png' }] });
    expect(result.changed).toBe(true);
    const metadata = await sharp(result.data).metadata();
    expect(metadata.width).toBe(4);
    expect(metadata.height).toBe(2);
  });
});

describe('resizeTextures', () => {
  it.each(['png', 'webp', 'avif'] as const)(
    'keeps colliding texture identities through %s conversion and archive roundtrip',
    async (format) => {
      const { parseMaterialX } = await import('./xml.js');
      const { packageToEntries, packageFromArchive } = await import('./package.js');
      const { createMaterialXZipArchive, inspectMaterialXZipArchive } = await import('./mtlxzip.js');
      const { resizeTextures } = await import('./textures.js');
      const pkg = {
        rootPath: 'm.mtlx',
        document: parseMaterialX(
          '<materialx><image name="red"><input name="file" type="filename" value="a.png"/></image><image name="blue"><input name="file" type="filename" value="a.webp"/></image></materialx>',
        ),
        resources: [
          { archivePath: 'a.png', sourcePath: 'a.png', data: await makeColorTexture('red') },
          {
            archivePath: 'a.webp',
            sourcePath: 'a.webp',
            data: new Uint8Array(
              await sharp(await makeColorTexture('blue'))
                .webp()
                .toBuffer(),
            ),
          },
        ],
      };
      await resizeTextures({ targets: [{ format }] })(pkg);
      const result = packageFromArchive(inspectMaterialXZipArchive(createMaterialXZipArchive(packageToEntries(pkg))));
      expect(new Set(result.resources.map((r) => r.archivePath)).size).toBe(2);
      const colors = await Promise.all(
        result.document.nodes.map(async (node) => {
          const resource = result.resources.find((r) => r.archivePath === node.inputs[0]?.value)!;
          return sharp(resource.data).raw().toBuffer();
        }),
      );
      expect(colors[0]![0]).toBeGreaterThan(colors[0]![2]!);
      expect(colors[1]![2]).toBeGreaterThan(colors[1]![0]!);
    },
  );

  it('transforms image resources in a package and rewrites the document references', async () => {
    const { parseMaterialX, serializeMaterialX } = await import('./xml.js');
    const { transform } = await import('./package.js');
    const { resizeTextures } = await import('./textures.js');
    const document = parseMaterialX(`<?xml version="1.0"?>
<materialx version="1.39">
  <image name="albedo" type="color3"><input name="file" type="filename" value="textures/albedo.png" /></image>
</materialx>`);
    const pkg = {
      rootPath: 'material.mtlx',
      document,
      resources: [
        { archivePath: 'textures/albedo.png', sourcePath: 'textures/albedo.png', data: await makePng(128, 64) },
        { archivePath: 'resources/notes.txt', sourcePath: 'resources/notes.txt', data: new Uint8Array([1]) },
      ],
    };

    await transform(pkg, resizeTextures({ maxImageSize: 32, targets: [{ format: 'webp' }] }));

    expect(pkg.resources.map((resource) => resource.archivePath)).toEqual([
      'textures/albedo.webp',
      'resources/notes.txt',
    ]);
    expect(serializeMaterialX(pkg.document)).toContain('textures/albedo.webp');
    const metadata = await sharp(pkg.resources[0]!.data).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(32);
  });
});
