/** Tiny external store for the log, error, preview report, and transient status text. */
import type { PreviewReport } from 'mtlx-viewer/diagnostics';
import { vscode } from './host.js';

export interface Diagnostics {
  lines: string[];
  error?: string;
  report: PreviewReport;
  geometryStatus: string;
  environmentStatus: string;
}

const initial = (parseError?: string): Diagnostics => ({
  lines: [],
  report: { state: parseError ? 'idle' : 'loading', resources: 'unchecked', failedResources: [] },
  geometryStatus: '',
  environmentStatus: '',
});
let state: Diagnostics = { ...initial(), report: { state: 'idle', resources: 'unchecked', failedResources: [] } };
const listeners = new Set<() => void>();
function update(patch: Partial<Diagnostics>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}
export function subscribeDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const getDiagnostics = (): Diagnostics => state;

export function resetDiagnostics(parseError?: string): void {
  update(initial(parseError));
}

// Every step of renderer/loader setup is logged here (visible in the webview itself, no devtools
// needed) and mirrored to the extension host's Output channel, since a rejected promise in a
// webview otherwise vanishes with no trace.
export function log(message: string): void {
  console.log(`[mtlx-preview] ${message}`);
  update({ lines: [...state.lines, message] });
  // oxlint-disable-next-line unicorn/require-post-message-target-origin -- VS Code Webview.postMessage has no targetOrigin
  vscode?.postMessage({ type: 'log', message });
}
export function showError(message: string): void {
  log(`ERROR: ${message}`);
  update({ error: message, report: { ...state.report, state: 'error' } });
}
export function clearError(): void {
  update({ error: undefined });
}
export function setReport(report: PreviewReport): void {
  update({ report });
}
export function setStatus(patch: Partial<Pick<Diagnostics, 'geometryStatus' | 'environmentStatus'>>): void {
  update(patch);
}

window.addEventListener('error', (event) => showError(`Uncaught error: ${event.message}`));
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  showError(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
});
