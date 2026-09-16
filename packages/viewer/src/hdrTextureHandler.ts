/**
 * Bridges .exr/.hdr material textures into three.js's vendored MaterialXLoader.
 *
 * That loader always reads textures through `ImageBitmapLoader` (browsers' native image codecs),
 * which can't decode EXR/Radiance HDR, and its `getTexture()` only supports a handler that behaves
 * like ImageBitmapLoader (onLoad receives something assignable to `texture.image` directly) — not
 * a DataTextureLoader-style handler like three's own EXRLoader/HDRLoader (onLoad hands back a
 * whole Texture instead). There's a pending three.js PR to support real HDR textures here; until
 * that lands, MaterialXLoader can only consume standard browser-decodable raster images.
 *
 * So instead of decoding via three's EXRLoader/HDRLoader, we decode directly with hdrify (which
 * also covers every OpenEXR/Radiance HDR compression variant, not just what three's addons
 * support) and linearly convert down to SDR ourselves — no tone mapping, just scale-and-clip, per
 * clipHdrToSdr in mtlx-core/textures. Blown-out highlights are expected; this is a stopgap for
 * roughness/normal/height inputs, not a substitute for real HDR texture support.
 */
import { readExr, readHdr, type HdrifyImage } from 'hdrify';
import * as THREE from 'three/webgpu';

const EXR_MAGIC = [0x76, 0x2f, 0x31, 0x01];
const isExrMagic = (bytes: Uint8Array): boolean => EXR_MAGIC.every((byte, i) => bytes[i] === byte);

/** Linearly scales and clips (no tone mapping) a decoded HDR/EXR image down to 8-bit RGBA. */
export function clipToRgba(image: Pick<HdrifyImage, 'width' | 'height' | 'data'>): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(image.width * image.height * 4);
  for (let i = 0; i < rgba.length; i++) rgba[i] = Math.round(image.data[i]! * 255);
  return rgba;
}

async function decodeToImageBitmap(manager: THREE.LoadingManager, url: string): Promise<ImageBitmap> {
  const response = await fetch(manager.resolveURL(url));
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const image = isExrMagic(bytes) ? readExr(bytes) : readHdr(bytes);
  const rgba = clipToRgba(image);
  const canvas = new OffscreenCanvas(image.width, image.height);
  canvas.getContext('2d')!.putImageData(new ImageData(rgba.slice(), image.width, image.height), 0, 0);
  // imageOrientation: 'none' to match the ImageBitmapLoader options MaterialXDocument uses for
  // every other texture format, so flipY stays consistent across formats.
  return createImageBitmap(canvas, { imageOrientation: 'none' });
}

/** Registers an .exr/.hdr handler on the manager MaterialXLoader parses material textures with. */
export function registerHdrTextureHandler(manager: THREE.LoadingManager): void {
  const handler: Pick<THREE.Loader, 'load'> = {
    load(url, onLoad, _onProgress, onError) {
      decodeToImageBitmap(manager, url).then(onLoad as (data: unknown) => void, onError);
    },
  };
  manager.addHandler(/\.(exr|hdr)(\?|#|$)/i, handler as THREE.Loader);
}
