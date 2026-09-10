import { useEffect, useRef, useState } from 'react';
import type * as ThreeNS from 'three/webgpu';
import { createMtlxScene, parseStudioEnvironment, type GeometryKind, type MtlxScene } from 'mtlx-viewer';
import studioEnvironmentUrl from 'mtlx-viewer/assets/studio-environment.png?url';
import shaderBallUrl from 'mtlx-viewer/assets/shaderball.glb?url';

export type MaterialSource =
  | { kind: 'buffer'; data: ArrayBuffer; name: string }
  | { kind: 'url'; folderUrl: string; fileName: string };

export interface MaterialViewerProps {
  source: MaterialSource | null;
  onError: (message: string | null) => void;
}

const GEOMETRY_OPTIONS: { value: GeometryKind; label: string }[] = [
  { value: 'totem', label: 'Totem' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'plane', label: 'Plane' },
];

async function resolveSourceBytes(source: MaterialSource): Promise<{ data: ArrayBuffer; fileName: string }> {
  if (source.kind === 'buffer') {
    return { data: source.data, fileName: source.name };
  }
  // Pass the full URL (not just the bare filename) as MaterialXLoader's resource path — it
  // derives the texture base folder from everything before the last "/", the same way
  // `.setPath(folderUrl).loadAsync(fileName)` used to; the browser can then fetch a preset's
  // sibling textures (e.g. wood_grain's) directly from raw.githubusercontent.com by relative URL.
  const url = `${source.folderUrl}${source.fileName}`;
  const data = await (await fetch(url)).arrayBuffer();
  return { data, fileName: url };
}

// three.js 0.186's MaterialXLoader (via mtlx-viewer's createMtlxScene) natively understands
// .mtlx, .mtlz, and .mtlx.zip (it sniffs the zip magic bytes / filename) and resolves textures
// embedded in the archive itself, so this component doesn't need any zip handling of its own.
export function MaterialViewer({ source, onError }: MaterialViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mtlxSceneRef = useRef<MtlxScene | null>(null);
  const [loading, setLoading] = useState(false);
  const [materialNames, setMaterialNames] = useState<string[]>([]);
  const [activeMaterial, setActiveMaterial] = useState('');
  const [geometry, setGeometry] = useState<GeometryKind>('totem');

  useEffect(() => {
    const container = containerRef.current;
    mtlxSceneRef.current = null;
    setMaterialNames([]);
    setActiveMaterial('');
    if (!container || !source) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;
    setLoading(true);
    onError(null);

    (async () => {
      const THREE: typeof ThreeNS = await import('three/webgpu');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      if (disposed) return;

      const width = container.clientWidth || 512;
      const height = container.clientHeight || 512;

      const renderer = new THREE.WebGPURenderer({ antialias: true });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      await renderer.init();
      if (disposed) {
        renderer.dispose();
        return;
      }
      container.replaceChildren(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 1000);

      // Shared studio IBL (packages/viewer), baked once from RoomEnvironment, so the website and
      // VS Code preview render the same lighting.
      const envBytes = await (await fetch(studioEnvironmentUrl)).arrayBuffer();
      const studioTexture = await parseStudioEnvironment(envBytes);
      if (disposed) {
        renderer.dispose();
        return;
      }
      // @types/three lags three's addon source: fromEquirectangular() isn't in its
      // PMREMGenerator typings yet.
      const pmremGenerator = new THREE.PMREMGenerator(renderer) as unknown as {
        fromEquirectangular: (texture: ThreeNS.Texture) => { texture: ThreeNS.Texture };
      };
      const environment = pmremGenerator.fromEquirectangular(studioTexture).texture;
      studioTexture.dispose();
      scene.environment = environment;
      scene.background = environment;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      try {
        const [{ data, fileName }, shaderBall] = await Promise.all([
          resolveSourceBytes(source),
          (async () => (await fetch(shaderBallUrl)).arrayBuffer())(),
        ]);
        if (disposed) return;

        const mtlxScene = await createMtlxScene(camera, controls, { data, fileName, shaderBall });
        if (disposed) return;
        scene.add(mtlxScene.root);
        mtlxSceneRef.current = mtlxScene;
        setMaterialNames(mtlxScene.materialNames);
        setActiveMaterial(mtlxScene.activeMaterial);
        setGeometry(mtlxScene.geometry);
      } catch (error) {
        onError(error instanceof Error ? error.message : String(error));
      }

      let frameId = 0;
      const resize = () => {
        const w = container.clientWidth || 512;
        const h = container.clientHeight || 512;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      let clock = performance.now();
      const animate = () => {
        const now = performance.now();
        mtlxSceneRef.current?.update((now - clock) / 1000);
        clock = now;
        controls.update();
        void renderer.renderAsync(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();

      setLoading(false);
      cleanup = () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        controls.dispose();
        renderer.dispose();
      };
    })().catch((error: unknown) => {
      setLoading(false);
      onError(error instanceof Error ? error.message : String(error));
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- source is compared by identity intentionally
  }, [source]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-black">
      {materialNames.length > 0 ? (
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <select
            className="rounded border border-white/20 bg-black/60 px-2 py-1 text-xs text-white"
            value={activeMaterial}
            onChange={(event) => {
              setActiveMaterial(event.target.value);
              mtlxSceneRef.current?.setMaterial(event.target.value);
            }}
          >
            {materialNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-white/20 bg-black/60 px-2 py-1 text-xs text-white"
            value={geometry}
            onChange={(event) => {
              const kind = event.target.value as GeometryKind;
              setGeometry(kind);
              mtlxSceneRef.current?.setGeometry(kind);
            }}
          >
            {GEOMETRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full" />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Loading…</div>
      ) : null}
      {!source ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
          Drop a .mtlx, .mtlz, or .mtlx.zip file, or pick a preset
        </div>
      ) : null}
    </div>
  );
}
