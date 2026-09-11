/**
 * Two shared IBL (image-based lighting) environments for the MaterialX preview viewers, shipped
 * as static assets under ../assets so every consumer (website, VS Code extension) gets the same
 * look without re-fetching or re-baking anything at runtime.
 *
 * - "studio": a neutral gray studio room, baked once from three.js's procedural RoomEnvironment
 *   (see scripts/bake-studio-environment.mjs) into a flat equirectangular PNG. Avoids paying for
 *   a RoomEnvironment scene render on every preview load.
 * - "default": the real HDR photo environment (san_giuseppe_bridge_2k.hdr) used by the three-ntc
 *   examples, for a more realistic reference look.
 *
 * Both loaders take raw bytes rather than a URL — callers fetch/read the asset however fits
 * their host (Vite import, `vscode.workspace.fs.readFile`, etc.) and hand the bytes here.
 */
import { EquirectangularReflectionMapping, Texture } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

/**
 * *Which shared IBL environment to load: `'studio'` or `'default'`.*
 *
 * @category Viewer
 */
export type EnvironmentKind = 'studio' | 'default';

/**
 * *Asset file name (under `mtlx-viewer/assets`) for each {@link EnvironmentKind}.*
 *
 * @category Viewer
 */
export const ENVIRONMENT_ASSET_FILES: Record<EnvironmentKind, string> = {
  studio: 'studio-environment.png',
  default: 'default-environment.hdr',
};

/**
 * *Parses the baked studio-room equirectangular PNG.*
 *
 * @category Viewer
 */
export async function parseStudioEnvironment(data: ArrayBuffer): Promise<Texture> {
  const bitmap = await createImageBitmap(new Blob([data], { type: 'image/png' }));
  const texture = new Texture(bitmap);
  texture.addEventListener('dispose', () => bitmap.close());
  texture.mapping = EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * *Parses the real-world HDR equirectangular environment.*
 *
 * @category Viewer
 */
export function parseDefaultEnvironment(data: ArrayBuffer): Texture {
  // @types/three lags three's addon source: createDataTexture() (in-memory parse, no fetch)
  // isn't in its DataTextureLoader typings yet.
  const loader = new HDRLoader() as unknown as { createDataTexture: (buffer: ArrayBuffer) => Texture };
  const texture = loader.createDataTexture(data);
  texture.mapping = EquirectangularReflectionMapping;
  return texture;
}

/**
 * *Parses either environment kind from raw bytes.* Dispatches to {@link parseStudioEnvironment} or
 * {@link parseDefaultEnvironment} based on `kind`.
 *
 * @category Viewer
 */
export async function parseEnvironment(kind: EnvironmentKind, data: ArrayBuffer): Promise<Texture> {
  return kind === 'studio' ? parseStudioEnvironment(data) : parseDefaultEnvironment(data);
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

/** Parse an additional equirectangular IBL from its file extension. */
export async function parseEnvironmentFile(data: ArrayBuffer, source: string): Promise<Texture> {
  const path = source.split(/[?#]/)[0]!.toLowerCase();
  if (path.endsWith('.hdr')) return parseDefaultEnvironment(data);
  if (path.endsWith('.exr')) {
    const { EXRLoader } = await import('three/addons/loaders/EXRLoader.js');
    const loader = new EXRLoader() as unknown as { createDataTexture: (buffer: ArrayBuffer) => Texture };
    const texture = loader.createDataTexture(data);
    texture.mapping = EquirectangularReflectionMapping;
    return texture;
  }
  if (!/\.(png|jpe?g)$/.test(path)) throw new Error('IBL must be an equirectangular .hdr, .exr, .png or .jpg file');
  const bitmap = await createImageBitmap(new Blob([data]));
  const texture = new Texture(bitmap);
  texture.addEventListener('dispose', () => bitmap.close());
  const { SRGBColorSpace } = await import('three');
  texture.colorSpace = SRGBColorSpace;
  texture.mapping = EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}
