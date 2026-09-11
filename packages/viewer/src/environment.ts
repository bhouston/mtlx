/**
 * IBL (image-based lighting) environment parsing for the MaterialX preview viewers. Two shared
 * environments ship as static assets under ../assets so every host gets the same look:
 *
 * - "studio": a neutral gray studio room, baked once from three.js's procedural RoomEnvironment
 *   (see scripts/bake-studio-environment.mjs) into an sRGB equirectangular PNG.
 * - "bridge": the real HDR photo environment (san_giuseppe_bridge_2k.hdr) from the three.js examples.
 *
 * Parsers take raw bytes rather than a URL — callers fetch/read the asset however fits their host
 * (Vite import, `vscode.workspace.fs.readFile`, etc.) and hand the bytes here.
 */
import { EquirectangularReflectionMapping, SRGBColorSpace, Texture } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

/** Parse an equirectangular IBL from its file extension (.hdr, .exr, .png, .jpg). */
export async function parseEnvironmentFile(data: ArrayBuffer, source: string): Promise<Texture> {
  const path = source.split(/[?#]/)[0]!.toLowerCase();
  let texture: Texture;
  if (path.endsWith('.hdr') || path.endsWith('.exr')) {
    // @types/three lags three's addon source: createDataTexture() (in-memory parse, no fetch)
    // isn't in its DataTextureLoader typings yet.
    const loader = (path.endsWith('.hdr')
      ? new HDRLoader()
      : new (await import('three/addons/loaders/EXRLoader.js')).EXRLoader()) as unknown as {
      createDataTexture: (buffer: ArrayBuffer) => Texture;
    };
    texture = loader.createDataTexture(data);
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
export function createEnvironmentSwitcher(
  load: (kind: string) => Promise<Texture>,
  prepare: (texture: Texture) => { texture: Texture; dispose(): void },
  apply: (texture: Texture) => void,
) {
  let generation = 0;
  let disposed = false;
  let active: { dispose(): void } | undefined;
  return {
    async set(kind: string): Promise<boolean> {
      const request = ++generation;
      let source: Texture;
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
