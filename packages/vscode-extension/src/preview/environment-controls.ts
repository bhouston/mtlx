import * as THREE from 'three/webgpu';
import { parseEnvironment, createEnvironmentSwitcher, parseEnvironmentFile, type CleanupScope } from 'mtlx-viewer';
import type { PreviewSettings } from '../previewSettings.js';
import { requestAsset, vscode } from './host.js';
import { previewState } from './state.js';
import { log } from './diagnostics.js';
import studioEnvironmentDataUrl from 'mtlx-viewer/assets/studio-environment.png';

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function bindEnvironmentControls(
  renderer: THREE.WebGPURenderer,
  scene: THREE.Scene,
  scope: CleanupScope,
  settings: PreviewSettings,
): Promise<AbortSignal> {
  const own = (release: () => void) => scope.own(release);
  const pmremGenerator = new THREE.PMREMGenerator(renderer) as unknown as {
    fromEquirectangular: (texture: THREE.Texture) => { texture: THREE.Texture; dispose(): void };
    dispose(): void;
  };
  own(() => pmremGenerator.dispose());
  const environmentAbort = new AbortController();
  own(() => environmentAbort.abort());
  const environments = createEnvironmentSwitcher(
    async (kind) => {
      if (kind === 'studio') return parseEnvironment(kind, dataUrlToArrayBuffer(studioEnvironmentDataUrl));
      if (kind === 'bridge') {
        const response = await fetch(document.body.dataset.hdrUrl!, { signal: environmentAbort.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status} loading IBL`);
        return parseEnvironment('default', await response.arrayBuffer());
      }
      const asset = await requestAsset('ibl', kind, environmentAbort.signal);
      return parseEnvironmentFile(asset.data, asset.source);
    },
    (texture) => pmremGenerator.fromEquirectangular(texture),
    (texture) => {
      scene.environment = texture;
      scene.background = texture;
    },
  );
  own(() => environments.dispose());
  const environmentSelect = document.getElementById('environment-select') as HTMLSelectElement;
  environmentSelect.replaceChildren(
    ...[
      { name: 'bridge', label: 'San Giuseppe Bridge' },
      { name: 'studio', label: 'Studio' },
      ...settings.ibls.map((asset) => ({ name: asset.name, label: asset.name })),
    ].map((entry) => new Option(entry.label, entry.name)),
  );
  environmentSelect.value = previewState.environmentKind ?? settings.defaultIbl;
  const environmentStatus = document.getElementById('environment-status') as HTMLOutputElement;
  const changeEnvironment = async (): Promise<void> => {
    const kind = environmentSelect.value;
    previewState.environmentKind = kind;
    vscode?.setState(previewState);
    environmentStatus.textContent = 'Loading environment…';
    try {
      if (await environments.set(kind)) {
        environmentStatus.textContent = '';
        log(`Environment ready: ${kind === 'studio' ? 'Studio' : kind === 'bridge' ? 'San Giuseppe Bridge' : kind}.`);
      }
    } catch (error) {
      if (scope.disposed || kind !== previewState.environmentKind) return;
      environmentStatus.textContent = `Environment failed to load: ${error instanceof Error ? error.message : String(error)}`;
      log(environmentStatus.textContent);
      if (!scene.environment && kind !== 'studio') {
        environmentSelect.value = kind === 'bridge' ? 'studio' : 'bridge';
        log(`Using fallback IBL: ${environmentSelect.value}.`);
        await changeEnvironment();
      }
    }
  };
  environmentSelect.addEventListener('change', changeEnvironment);
  own(() => environmentSelect.removeEventListener('change', changeEnvironment));
  await changeEnvironment();

  return environmentAbort.signal;
}
