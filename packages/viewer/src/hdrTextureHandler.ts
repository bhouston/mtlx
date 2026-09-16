/**
 * Bridges .exr/.hdr material textures into three.js's vendored MaterialXLoader.
 *
 * That loader always reads textures through `ImageBitmapLoader` (browsers' native image codecs),
 * which can't decode EXR/Radiance HDR. It does check `manager.getHandler()` first, but only
 * supports handlers that behave like ImageBitmapLoader (onLoad receives something assignable to
 * `texture.image` directly) — it doesn't special-case a DataTextureLoader-style handler like
 * three's own EXRLoader/HDRLoader (whose onLoad instead hands back a whole Texture). So we can't
 * just `manager.addHandler(/\.exr$/, new EXRLoader())`; we adapt it into an ImageBitmap instead.
 *
 * ponytail: clamps float data to [0,1] and drops HDR range — fine for the roughness/normal/height
 * maps this format is normally used for in MaterialX inputs. If a document needs a true HDR color
 * texture through this path, this needs a real DataTexture route instead of ImageBitmap.
 */
import * as THREE from 'three/webgpu';

async function decodeToImageBitmap(url: string, isHdr: boolean): Promise<ImageBitmap> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
  const buffer = await response.arrayBuffer();
  // @types/three lags three's addon source: createDataTexture() (in-memory parse, no fetch)
  // isn't in its DataTextureLoader typings yet.
  const loader = (isHdr
    ? new (await import('three/addons/loaders/HDRLoader.js')).HDRLoader()
    : new (await import('three/addons/loaders/EXRLoader.js')).EXRLoader()) as unknown as {
    setDataType(type: THREE.TextureDataType): void;
    createDataTexture(buffer: ArrayBuffer): {
      image: { width: number; height: number; data: Uint16Array };
      dispose(): void;
    };
  };
  // We quantize to 8-bit below regardless, so fp32 buys nothing here — half-float halves the
  // decode buffer (e.g. 32MB vs 64MB for a 2k RGBA image) for one cheap bit-decode per channel.
  loader.setDataType(THREE.HalfFloatType);
  const texture = loader.createDataTexture(buffer);
  const { width, height, data } = texture.image;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = THREE.DataUtils.fromHalfFloat(data[i * 4]!) * 255;
    rgba[i * 4 + 1] = THREE.DataUtils.fromHalfFloat(data[i * 4 + 1]!) * 255;
    rgba[i * 4 + 2] = THREE.DataUtils.fromHalfFloat(data[i * 4 + 2]!) * 255;
    rgba[i * 4 + 3] = THREE.DataUtils.fromHalfFloat(data[i * 4 + 3]!) * 255;
  }
  texture.dispose();
  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext('2d')!.putImageData(new ImageData(rgba, width, height), 0, 0);
  // imageOrientation: 'none' to match the ImageBitmapLoader options MaterialXDocument uses for
  // every other texture format, so flipY stays consistent across formats.
  return createImageBitmap(canvas, { imageOrientation: 'none' });
}

/** Registers an .exr/.hdr handler on the manager MaterialXLoader parses material textures with. */
export function registerHdrTextureHandler(manager: THREE.LoadingManager): void {
  const handler: Pick<THREE.Loader, 'load'> = {
    load(url, onLoad, _onProgress, onError) {
      decodeToImageBitmap(url, /\.hdr(\?|#|$)/i.test(url)).then(onLoad as (data: unknown) => void, onError);
    },
  };
  manager.addHandler(/\.(exr|hdr)(\?|#|$)/i, handler as THREE.Loader);
}
