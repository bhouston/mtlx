import {
  computeChecks,
  summarizeInternalNodes,
  formatFileSize,
  type Check,
  type CheckState,
} from 'mtlx-viewer/diagnostics';
import type { PreviewPayload } from './protocol.js';
import { vscode } from './host.js';
const statsEl = document.getElementById('stats') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;
const logEl = document.getElementById('log') as HTMLDivElement;
let lastPayload: PreviewPayload | undefined;
let failedResources: string[] = [];
type PreviewStatus = 'loading' | 'ready' | 'failed' | undefined;
let previewStatus: PreviewStatus;
export function setPreviewStatus(value: PreviewStatus): void {
  previewStatus = value;
  document.body.dataset.previewState = value === 'failed' ? 'error' : (value ?? 'idle');
  if (lastPayload) renderStats(lastPayload);
}

// Diagnostics console: every step of renderer/loader setup is logged here (visible in the
// webview itself, no devtools needed) and mirrored to the extension host's Output channel via
// postMessage, since a rejected promise or thrown error in a webview otherwise vanishes with no
// trace — exactly what produced the "stuck progress bar, black canvas, no error" symptom.
export function log(message: string): void {
  console.log(`[mtlx-preview] ${message}`);
  const line = document.createElement('div');
  line.textContent = message;
  logEl.append(line);
  logEl.scrollTop = logEl.scrollHeight;
  // VS Code Webview.postMessage has no targetOrigin
  // oxlint-disable-next-line unicorn/require-post-message-target-origin
  vscode?.postMessage({ type: 'log', message });
}

export function showError(message: string): void {
  log(`ERROR: ${message}`);
  setPreviewStatus('failed');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

window.addEventListener('error', (event) => {
  showError(`Uncaught error: ${event.message}`);
});
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  showError(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
});

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function renderSection(title: string, items: string[], expanded = false, count = items.length): string {
  return `<details ${expanded ? 'open' : ''}>
    <summary>${escapeHtml(title)} (${count})</summary>
    <ul>${items.length ? items.map((item) => `<li>${item}</li>`).join('') : '<li class="none">(none)</li>'}</ul>
  </details>`;
}

const CHECK_SYMBOL: Record<CheckState, string> = {
  passed: '✓',
  failed: '✗',
  warning: '⚠',
  pending: '…',
  unchecked: '–',
};

function computePayloadChecks(payload: PreviewPayload) {
  return computeChecks({
    issues: payload.issues,
    parseError: payload.parseError,
    resourcesChecked: payload.resourcesChecked,
    preview: {
      state: previewStatus === 'failed' ? 'error' : (previewStatus ?? 'idle'),
      resources: previewStatus === 'loading' ? 'loading' : 'unchecked',
      failedResources,
    },
  });
}

function renderValidityChecks(checks: Check[], overall: CheckState): string {
  const open = checks.some((check) => check.state === 'failed' || check.state === 'warning');
  return `<details ${open ? 'open' : ''}>
    <summary>Validity Checks <span class="check-${overall}">${CHECK_SYMBOL[overall]}</span></summary>
    <ul>${checks
      .map(
        (check) => `<li>
        <div class="check-row"><span>${escapeHtml(check.name)}</span><span class="check-${check.state}">${CHECK_SYMBOL[check.state]}</span></div>
        ${check.messages.length ? `<ul class="check-messages">${check.messages.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul>` : ''}
      </li>`,
      )
      .join('')}</ul>
  </details>`;
}

// Mirrors renderValidityChecks as plain text in the log panel, so the whole validity report can
// be selected and shared without leaving the webview. Only logged when the checks actually
// change, since renderStats re-runs on every preview status transition.
let lastLoggedChecks = '';
function logValidityChecks(checks: Check[], overall: CheckState): void {
  const key = JSON.stringify({ checks, overall });
  if (key === lastLoggedChecks) return;
  lastLoggedChecks = key;
  log(`Validity Checks: ${overall} (${CHECK_SYMBOL[overall]})`);
  for (const check of checks) {
    log(`  ${check.name}: ${check.state} (${CHECK_SYMBOL[check.state]})`);
    for (const message of check.messages) log(`    - ${message}`);
  }
}

function renderStats(payload: PreviewPayload): void {
  const summary = payload.summary;
  const fileDetailsHtml = `<details open>
    <summary>File details</summary>
    <dl>
      <dt>Size</dt><dd>${formatFileSize(payload.fileSize)}</dd>
      ${
        summary
          ? `<dt>Version</dt><dd>${escapeHtml(summary.version ?? 'unknown')}</dd>
      <dt>Colorspace</dt><dd>${escapeHtml(summary.colorspace ?? 'unknown')}</dd>
      <dt>Node graphs</dt><dd>${summary.nodeGraphCount}</dd>
      <dt>Top-level nodes</dt><dd>${summary.topLevelNodeCount}</dd>`
          : ''
      }
    </dl>
  </details>`;

  let summaryHtml = '';
  if (summary) {
    const { types: nodeTypeCounts, count: internalNodeCount } = summarizeInternalNodes(summary);
    summaryHtml =
      renderSection(
        'Materials',
        summary.materials.map((m) => `${escapeHtml(m.name ?? '(unnamed)')} [${escapeHtml(m.category)}]`),
        summary.materials.length > 1,
      ) +
      renderSection(
        'References',
        summary.referencedTextures.map((t) => escapeHtml(t)),
      ) +
      renderSection(
        'Internal Nodes',
        nodeTypeCounts.map(([type, count]) => `${escapeHtml(type)} (${count})`),
        false,
        internalNodeCount,
      );
  }

  const { checks, overall } = computePayloadChecks(payload);
  statsEl.innerHTML = fileDetailsHtml + summaryHtml + renderValidityChecks(checks, overall);
  logValidityChecks(checks, overall);
}

export function beginDiagnostics(payload: PreviewPayload): void {
  lastPayload = payload;
  failedResources = [];
  lastLoggedChecks = '';
  logEl.replaceChildren();
  clearError();
  setPreviewStatus(payload.parseError ? undefined : 'loading');
  if (payload.parseError) {
    errorEl.textContent = payload.parseError;
    errorEl.style.display = 'block';
  }
}
export function clearError(): void {
  errorEl.style.display = 'none';
}
export function recordFailedResource(url: string): void {
  if (!failedResources.includes(url)) failedResources.push(url);
  if (lastPayload) renderStats(lastPayload);
  log(`Failed to load resource: ${url}`);
}
