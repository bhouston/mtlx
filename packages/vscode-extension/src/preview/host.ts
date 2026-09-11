import type { PreviewState } from './state.js';
import type { PreviewAssetBytes } from '../previewAssets.js';
declare const acquireVsCodeApi:
  | (() => {
      postMessage(message: unknown): void;
      getState(): PreviewState | undefined;
      setState(state: PreviewState): void;
    })
  | undefined;
export const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
let nextAssetRequest = 0;
const pendingAssets = new Map<
  number,
  { resolve: (asset: PreviewAssetBytes) => void; reject: (error: Error) => void }
>();
export function requestAsset(kind: 'ibl' | 'geometry', name: string, signal: AbortSignal): Promise<PreviewAssetBytes> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const requestId = ++nextAssetRequest;
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      pendingAssets.delete(requestId);
    };
    const abort = () => {
      finish();
      reject(new Error('Asset request cancelled'));
    };
    const timer = setTimeout(() => {
      finish();
      reject(new Error('Asset request timed out'));
    }, 120_000);
    signal.addEventListener('abort', abort, { once: true });
    pendingAssets.set(requestId, {
      resolve: (asset) => {
        finish();
        resolve(asset);
      },
      reject: (error) => {
        finish();
        reject(error);
      },
    });
    // oxlint-disable-next-line unicorn/require-post-message-target-origin
    vscode?.postMessage({ type: 'loadAsset', requestId, kind, name });
  });
}

export function receiveAsset(reply: PreviewAssetBytes & { requestId: number; error?: string }): void {
  const pending = pendingAssets.get(reply.requestId);
  if (reply.error) pending?.reject(new Error(reply.error));
  else pending?.resolve(reply);
}
