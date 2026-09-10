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
