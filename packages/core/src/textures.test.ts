import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { transformImage } from './textures.js';

const makePng = async (width: number, height: number): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp({ create: { width, height, channels: 3, background: { r: 200, g: 100, b: 50 } } })
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

  it('converts format when imageFormat is given', async () => {
    const data = await makePng(16, 16);
    const result = await transformImage(data, '.png', { imageFormat: 'webp' });
    expect(result.changed).toBe(true);
    expect(result.extension).toBe('.webp');
    const metadata = await sharp(result.data).metadata();
    expect(metadata.format).toBe('webp');
  });

  it('defaults non-web sources (tiff) to webp when no imageFormat is given', async () => {
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
    const high = await transformImage(new Uint8Array(data), '.jpg', { imageFormat: 'jpg', imageQuality: 95 });
    const low = await transformImage(new Uint8Array(data), '.jpg', { imageFormat: 'jpg', imageQuality: 10 });
    expect(low.data.byteLength).toBeLessThan(high.data.byteLength);
  });
});

describe('resizeTextures', () => {
  it.each(['png', 'webp', 'avif'] as const)(
    'keeps colliding texture identities through %s conversion and archive roundtrip',
    async (imageFormat) => {
      const { parseMaterialX } = await import('./xml.js');
      const { packageToEntries, packageFromArchive } = await import('./package.js');
      const { createMaterialXZipArchive, inspectMaterialXZipArchive } = await import('./mtlxzip.js');
      const { resizeTextures } = await import('./textures.js');
      const make = async (color: string) =>
        new Uint8Array(
          await sharp({ create: { width: 8, height: 8, channels: 3, background: color } })
            .png()
            .toBuffer(),
        );
      const pkg = {
        rootPath: 'm.mtlx',
        document: parseMaterialX(
          '<materialx><image name="red"><input name="file" type="filename" value="a.png"/></image><image name="blue"><input name="file" type="filename" value="a.webp"/></image></materialx>',
        ),
        resources: [
          { archivePath: 'a.png', sourcePath: 'a.png', data: await make('red') },
          {
            archivePath: 'a.webp',
            sourcePath: 'a.webp',
            data: new Uint8Array(
              await sharp(await make('blue'))
                .webp()
                .toBuffer(),
            ),
          },
        ],
      };
      await resizeTextures({ imageFormat })(pkg);
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

    await transform(pkg, resizeTextures({ maxImageSize: 32, imageFormat: 'webp' }));

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
