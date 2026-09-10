import { useEffect, useRef, useState } from 'react';
import type * as ThreeNS from 'three/webgpu';

export type MaterialSource =
  | { kind: 'buffer'; data: ArrayBuffer; name: string }
  | { kind: 'url'; folderUrl: string; fileName: string };

export interface MaterialViewerProps {
  source: MaterialSource | null;
  onError: (message: string | null) => void;
}

// @types/three@0.180 predates parseBuffer (three's native .mtlz/.mtlx.zip support), so we widen
// the loader's type locally rather than fighting a lagging community typings package.
interface MaterialXLoaderWithParseBuffer {
  setPath: (path: string) => MaterialXLoaderWithParseBuffer;
  loadAsync: (url: string) => Promise<{ materials: Record<string, ThreeNS.Material> }>;
  parseBuffer: (data: ArrayBuffer, url?: string) => { materials: Record<string, ThreeNS.Material> };
}

// three.js 0.186's MaterialXLoader natively understands .mtlx, .mtlz, and .mtlx.zip (it sniffs
// the zip magic bytes / filename) and resolves textures embedded in the archive itself, so this
// component doesn't need any zip handling of its own.
//
// Sphere + procedural room-environment lighting instead of a hosted shaderball .glb + HDRI.
// ponytail: sphere preview / RoomEnvironment lighting, swap for a shaderball glb + real HDRI later if wanted.
export function MaterialViewer({ source, onError }: MaterialViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
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
      const { MaterialXLoader } = await import('three/addons/loaders/MaterialXLoader.js');
      const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
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
      camera.position.set(0, 0, 3.2);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = environment;
      scene.background = environment;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      const sphere = new THREE.Mesh<ThreeNS.SphereGeometry, ThreeNS.Material>(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshStandardMaterial(),
      );
      scene.add(sphere);

      try {
        // @types/three lags three's addon source: parseBuffer (native .mtlz/.mtlx.zip support)
        // isn't in its MaterialXLoader typings yet.
        const loader = new MaterialXLoader() as unknown as MaterialXLoaderWithParseBuffer;
        const result =
          source.kind === 'url'
            ? await loader.setPath(source.folderUrl).loadAsync(source.fileName)
            : loader.parseBuffer(source.data, source.name);

        const materials = Object.values(result.materials);
        const material = materials.at(-1);
        if (!material) {
          throw new Error('No materials found in this MaterialX document');
        }
        sphere.material = material;
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

      const animate = () => {
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
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black/40">
      <div ref={containerRef} className="h-full w-full" />
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">Loading…</div>
      ) : null}
      {!source ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
          Drop a .mtlx, .mtlz, or .mtlx.zip file, or pick a preset
        </div>
      ) : null}
    </div>
  );
}
