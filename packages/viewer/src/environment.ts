/** Environment file parsing and ownership shared by the MaterialX viewers.
 * The default studio is generated in HDR at runtime; bridge is an optional HDR photo.
 */
import { readExr, readHdr } from 'hdrify';
import {
  DataTexture,
  EquirectangularReflectionMapping,
  FloatType,
  LinearSRGBColorSpace,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
} from 'three';

const EXR_MAGIC = [0x76, 0x2f, 0x31, 0x01];
// PMREM's filtered environment targets use half-floats, even when the source is a FloatType texture.
// Out-of-range HDR highlights become infinities there and can poison entire irradiance channels.
const HALF_FLOAT_MAX = 65_504;
const isExrMagic = (bytes: Uint8Array): boolean => EXR_MAGIC.every((byte, i) => bytes[i] === byte);

/** Parse an equirectangular IBL from its file extension (.hdr, .exr, .png, .jpg). */
export async function parseEnvironmentFile(data: ArrayBuffer, source: string): Promise<Texture> {
  const path = source.split(/[?#]/)[0]!.toLowerCase();
  let texture: Texture;
  if (path.endsWith('.hdr') || path.endsWith('.exr')) {
    // Decoded directly with hdrify rather than three's EXRLoader/HDRLoader: it covers every
    // OpenEXR/Radiance HDR compression variant, and building the DataTexture ourselves avoids
    // round-tripping through an EXR re-encode just to hand it back to a three.js decoder.
    const bytes = new Uint8Array(data);
    const image = isExrMagic(bytes) ? readExr(bytes) : readHdr(bytes);
    for (let i = 0; i < image.data.length; i++) {
      const value = image.data[i]!;
      image.data[i] = Number.isNaN(value) ? 0 : Math.max(-HALF_FLOAT_MAX, Math.min(HALF_FLOAT_MAX, value));
    }
    texture = new DataTexture(image.data, image.width, image.height, RGBAFormat, FloatType);
    texture.colorSpace = LinearSRGBColorSpace;
    // DataTexture defaults flipY to false (unlike Texture, which defaults true and is what the
    // .png/.jpg branch below relies on). hdrify's row 0 is the file's first scanline (top), so
    // this needs the same GPU-upload flip as every other texture format here to come out right
    // side up — matching three's own EXRLoader/HDRLoader, which instead pre-reverses scanlines at
    // decode time and pairs that with flipY=false to the same visual effect.
    texture.flipY = true;
    texture.needsUpdate = true;
  } else if (/\.(png|jpe?g)$/.test(path)) {
    const bitmap = await createImageBitmap(new Blob([data]));
    texture = new Texture(bitmap);
    texture.addEventListener('dispose', () => bitmap.close());
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  } else throw new Error('IBL must be an equirectangular .hdr, .exr, .png or .jpg file');
  texture.mapping = EquirectangularReflectionMapping;
  return texture;
}

/** Owns the active filtered environment and discards superseded asynchronous loads. */
export function createEnvironmentSwitcher<Source extends { dispose(): void } = Texture>(
  load: (kind: string) => Promise<Source>,
  prepare: (texture: Source) => { texture: Texture; dispose(): void },
  apply: (texture: Texture) => void,
) {
  let generation = 0;
  let disposed = false;
  let active: { dispose(): void } | undefined;
  return {
    async set(kind: string): Promise<boolean> {
      const request = ++generation;
      let source: Source;
      try {
        source = await load(kind);
      } catch (error) {
        if (disposed || request !== generation) return false;
        throw error;
      }
      try {
        if (disposed || request !== generation) return false;
        const next = prepare(source);
        try {
          apply(next.texture);
        } catch (error) {
          next.dispose();
          throw error;
        }
        active?.dispose();
        active = next;
        return true;
      } finally {
        source.dispose();
      }
    },
    dispose() {
      disposed = true;
      generation++;
      active?.dispose();
      active = undefined;
    },
  };
}
