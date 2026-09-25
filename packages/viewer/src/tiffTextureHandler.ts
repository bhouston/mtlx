/**
 * Bridges .tif/.tiff material textures into three.js's vendored MaterialXLoader.
 *
 * Same problem as hdrTextureHandler.ts: MaterialXLoader reads textures through
 * `ImageBitmapLoader`, and browsers' native image codecs can't decode TIFF. Rather than pull in
 * a new dependency, we reuse UTIF.js — already vendored inside three/addons for its own
 * TIFFLoader — to decode to RGBA8 and hand MaterialXLoader an ImageBitmap like every other
 * format, so VFX-authored .mtlx files that reference .tif textures don't error out per texture.
 */
import UTIF from 'three/addons/libs/utif.module.js';
import * as THREE from 'three/webgpu';

async function decodeToImageBitmap(manager: THREE.LoadingManager, url: string): Promise<ImageBitmap> {
  const response = await fetch(manager.resolveURL(url));
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
  const buffer = await response.arrayBuffer();
  const [ifd] = UTIF.decode(buffer);
  if (!ifd) throw new Error(`No image found in TIFF ${url}`);
  UTIF.decodeImage(buffer, ifd);
  const rgba = UTIF.toRGBA8(ifd);
  const canvas = new OffscreenCanvas(ifd.width, ifd.height);
  canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(rgba), ifd.width, ifd.height), 0, 0);
  // imageOrientation: 'none' to match the ImageBitmapLoader options MaterialXDocument uses for
  // every other texture format, so flipY stays consistent across formats.
  return createImageBitmap(canvas, { imageOrientation: 'none' });
}

/** Registers a .tif/.tiff handler on the manager MaterialXLoader parses material textures with. */
export function registerTiffTextureHandler(manager: THREE.LoadingManager): void {
  const handler: Pick<THREE.Loader, 'load'> = {
    load(url, onLoad, _onProgress, onError) {
      decodeToImageBitmap(manager, url).then(onLoad as (data: unknown) => void, onError);
    },
  };
  manager.addHandler(/\.tiff?(\?|#|$)/i, handler as THREE.Loader);
}
