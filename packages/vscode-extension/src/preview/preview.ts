/** Host message entry point; rendering, diagnostics, assets, and settings have independent modules. */
import { parsePreviewSettings } from '../previewSettings.js';
import type { PreviewAssetBytes } from '../previewAssets.js';
import type { PreviewPayload } from './protocol.js';
import { vscode, receiveAsset } from './host.js';
import { restorePreviewSettings } from './state.js';
import { renderScene, disposeScene } from './scene.js';
import { beginDiagnostics, log, showError } from './diagnostics.js';
let payloadGeneration = 0;
window.addEventListener('pagehide', disposeScene);

function onMessage(
  event: MessageEvent<PreviewPayload | (PreviewAssetBytes & { type: 'asset'; requestId: number; error?: string })>,
): void {
  if ('type' in event.data && event.data.type === 'asset') {
    receiveAsset(event.data);
    return;
  }
  const payload = event.data as PreviewPayload;
  const generation = ++payloadGeneration;
  disposeScene();
  const settings = payload.settings ?? parsePreviewSettings({});
  restorePreviewSettings(settings);
  beginDiagnostics(payload);
  for (const warning of settings.warnings) log(`Settings: ${warning}`);
  const settingsStatus = document.getElementById('settings-status');
  if (settingsStatus) settingsStatus.textContent = settings.warnings.join(' ');
  if (!payload.parseError && payload.data && payload.shaderBall) {
    renderScene(payload.data, payload.fileName, payload.textures, payload.shaderBall, settings).catch(
      (error: unknown) => {
        if (generation !== payloadGeneration) return;
        disposeScene();
        showError(`3D preview error: ${error instanceof Error ? error.message : String(error)}`);
      },
    );
  }
}

log('Preview script loaded, waiting for document data...');

window.addEventListener('message', onMessage);

// Register before requesting data, including when VS Code recreates a hidden webview.
// oxlint-disable-next-line unicorn/require-post-message-target-origin
vscode?.postMessage({ type: 'ready' });
