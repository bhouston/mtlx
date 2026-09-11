import * as THREE from 'three/webgpu';
import { createViewer, dataUrlToArrayBuffer, parseEnvironmentFile, type Viewer } from 'mtlx-viewer';
import type { ViewerSettings } from 'mtlx-viewer/settings';
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';
import type { PreviewSettings } from '../previewSettings.js';
import { requestAsset } from './host.js';
import type { PreviewCamera } from './state.js';
import { log, showError, clearError, setReport, setStatus } from './diagnostics.js';
import type { PreviewTexture } from './protocol.js';

export interface PreviewSceneOptions {
  canvas: HTMLCanvasElement;
  data: ArrayBuffer;
  fileName: string;
  textures: PreviewTexture[];
  shaderBall: ArrayBuffer;
  settings: PreviewSettings;
  viewerSettings: ViewerSettings;
  camera?: PreviewCamera;
  /** Called when the orbit ends and on disposal, so the camera survives the webview being recreated. */
  onCamera: (camera: PreviewCamera) => void;
}

/** Feeds host-read bytes (configured assets, sibling textures) to the shared viewer and persists its camera. */
export async function startPreviewScene(options: PreviewSceneOptions): Promise<Viewer> {
  const { canvas, settings, textures } = options;
  const abort = new AbortController();
  const urls = new Map<string, string>();
  const blobUrl = (path: string, data: ArrayBuffer) => {
    const url = URL.createObjectURL(new Blob([data]));
    urls.set(path, url);
    return url;
  };
  const release = () => {
    abort.abort();
    for (const url of urls.values()) URL.revokeObjectURL(url);
  };
  // A loose .mtlx references sibling texture files by relative path that don't exist as fetchable
  // URLs inside the webview — the extension host already read their bytes, so serve those as blob:
  // URLs. A .mtlx.zip resolves its textures from inside the archive and never reaches this map.
  const textureUrls = new Map(textures.map((texture) => [texture.path, blobUrl(texture.path, texture.data)]));
  if (textureUrls.size) log(`Embedded ${textureUrls.size} referenced texture(s) from disk.`);

  clearError();
  let viewer: Viewer;
  try {
    viewer = await createViewer({
      canvas,
      container: canvas,
      data: options.data,
      fileName: options.fileName,
      shaderBall: options.shaderBall,
      settings: options.viewerSettings,
      resolveUrl: (url) => {
        const normalized = new URL(url, 'https://mtlx.invalid/').href.slice('https://mtlx.invalid/'.length);
        return textureUrls.get(url) ?? textureUrls.get(normalized);
      },
      loadEnvironment: async (kind) => {
        if (kind === 'studio')
          return parseEnvironmentFile(dataUrlToArrayBuffer(studioEnvironmentDataUrl), 'studio.png');
        if (kind === 'bridge') {
          const url = document.body.dataset.hdrUrl!;
          const response = await fetch(url, { signal: abort.signal });
          if (!response.ok) throw new Error(`HTTP ${response.status} loading IBL`);
          return parseEnvironmentFile(await response.arrayBuffer(), url);
        }
        const asset = await requestAsset('ibl', kind, abort.signal);
        return parseEnvironmentFile(asset.data, asset.source);
      },
      loadGeometry: async (name) => {
        if (!settings.geometries.some((asset) => asset.name === name)) throw new Error(`Unknown geometry: ${name}`);
        const asset = await requestAsset('geometry', name, abort.signal);
        const sidecars = new Map(
          asset.resources.map((resource) => [resource.path, blobUrl(resource.path, resource.data)]),
        );
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((url) => sidecars.get(url) ?? url);
        return { data: asset.data, manager };
      },
      onLog: log,
      onReport: setReport,
      onStatus: (patch) =>
        setStatus({
          ...(patch.geometry !== undefined ? { geometryStatus: patch.geometry } : {}),
          ...(patch.environment !== undefined ? { environmentStatus: patch.environment } : {}),
        }),
      onError: showError,
    });
  } catch (error) {
    release();
    throw error;
  }

  const saveCamera = () => {
    const object = viewer.scene.root.children.find((child) => child.visible);
    options.onCamera({
      position: viewer.camera.position.toArray(),
      target: viewer.controls.target.toArray(),
      zoom: viewer.camera.zoom,
      rotation: object ? [object.rotation.x, object.rotation.y, object.rotation.z] : [0, 0, 0],
    });
  };
  // Only restore a camera framed for the geometry that actually loaded.
  const saved = options.camera;
  if (saved && viewer.scene.geometry === options.viewerSettings.geometry) {
    viewer.camera.position.fromArray(saved.position);
    viewer.camera.zoom = saved.zoom;
    viewer.camera.updateProjectionMatrix();
    viewer.controls.target.fromArray(saved.target);
    viewer.scene.root.children
      .find((child) => child.visible)
      ?.rotation.set(saved.rotation[0]!, saved.rotation[1]!, saved.rotation[2]!);
    viewer.controls.update();
  }
  viewer.controls.addEventListener('end', saveCamera);

  return {
    ...viewer,
    get disposed() {
      return viewer.disposed;
    },
    async setSettings(next) {
      const before = viewer.scene.geometry;
      const applied = await viewer.setSettings(next);
      // The saved camera includes the visible object's rotation; persist on geometry change, never after a restore.
      if (!viewer.disposed && applied.geometry !== before) saveCamera();
      return applied;
    },
    dispose() {
      if (viewer.disposed) return;
      saveCamera();
      viewer.controls.removeEventListener('end', saveCamera);
      viewer.dispose();
      release();
    },
  };
}
