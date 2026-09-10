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

export type EnvironmentKind = 'studio' | 'default';

export const ENVIRONMENT_ASSET_FILES: Record<EnvironmentKind, string> = {
  studio: 'studio-environment.png',
  default: 'default-environment.hdr',
};

/** Parses the baked studio-room equirectangular PNG. */
export async function parseStudioEnvironment(data: ArrayBuffer): Promise<Texture> {
  const bitmap = await createImageBitmap(new Blob([data], { type: 'image/png' }));
  const texture = new Texture(bitmap);
  texture.mapping = EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

/** Parses the real-world HDR equirectangular environment. */
export function parseDefaultEnvironment(data: ArrayBuffer): Texture {
  // @types/three lags three's addon source: createDataTexture() (in-memory parse, no fetch)
  // isn't in its DataTextureLoader typings yet.
  const loader = new HDRLoader() as unknown as { createDataTexture: (buffer: ArrayBuffer) => Texture };
  const texture = loader.createDataTexture(data);
  texture.mapping = EquirectangularReflectionMapping;
  return texture;
}

export async function parseEnvironment(kind: EnvironmentKind, data: ArrayBuffer): Promise<Texture> {
  return kind === 'studio' ? parseStudioEnvironment(data) : parseDefaultEnvironment(data);
}
