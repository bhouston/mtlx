import type * as vscode from 'vscode';

export function getPreviewHtml(webview: vscode.Webview, scriptUri: vscode.Uri): string {
  const csp = [
    "default-src 'none'",
    `script-src ${webview.cspSource}`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    'worker-src blob:',
    'img-src data: blob:',
    // ImageBitmapLoader (three.js) fetches texture blob: URLs via fetch(), governed by
    // connect-src rather than img-src.
    'connect-src blob:',
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mtlx Viewer</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .layout { display: flex; gap: 12px; flex: 1; min-height: 0; }
    .viewport-wrap { flex: 3; min-width: 0; position: relative; display: flex; flex-direction: column; }
    .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding-bottom: 12px; flex: none; }
    .toolbar select {
      min-width: 0; max-width: 100%;
      background: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border: 1px solid var(--vscode-dropdown-border);
      font-size: 12px;
      padding: 2px 4px;
    }
    #viewport { width: 100%; flex: 1; min-height: 0; }
    .stats { flex: 1; min-width: 0; overflow-wrap: anywhere; overflow: auto; font-size: 12px; }
    .stats dl { margin: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; }
    .stats dt { font-weight: 600; color: var(--vscode-foreground); }
    .stats dd { margin: 0; word-break: break-word; }
    .valid { color: var(--vscode-testing-iconPassed, #4caf50); font-weight: 600; }
    .invalid { color: var(--vscode-errorForeground); font-weight: 600; }
    .issue-error { color: var(--vscode-errorForeground); }
    .issue-warning { color: var(--vscode-editorWarning-foreground, #cca700); }
    .error { color: var(--vscode-errorForeground); padding: 8px 16px; white-space: pre-wrap; }
    h2 { font-size: 13px; margin: 12px 0 4px; }
    ul { margin: 4px 0; padding-left: 18px; }
    :focus-visible { outline: 2px solid var(--vscode-focusBorder, #70aaff); outline-offset: 2px; }
    [hidden] { display: none !important; }
    #log {
      flex: none;
      height: 90px;
      overflow: auto;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-textCodeBlock-background, rgba(128, 128, 128, 0.1));
      padding: 4px 8px;
      margin-top: 12px;
      border-top: 1px solid var(--vscode-panel-border, transparent);
    }
    /* Narrow editor pane (e.g. side-by-side split): stack the info panel under the viewport
       instead of squeezing both into a too-thin row. */
    @media (max-width: 600px) {
      .layout { flex-direction: column; }
      .viewport-wrap { flex: none; height: 60vh; }
      .stats { flex: 1; min-width: 0; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <div class="viewport-wrap">
      <div class="toolbar">
        <button id="refresh" type="button" title="Reload document and textures">Refresh</button>
        <select id="material-select" aria-label="Material"></select>
        <select id="geometry-select" aria-label="Geometry">
          <option value="totem">Totem</option>
          <option value="sphere">Sphere</option>
          <option value="plane">Plane</option>
        </select>
      </div>
      <div class="toolbar">
        <button id="rotation" type="button" disabled>Pause rotation</button>
        <button id="reset" type="button" disabled>Reset</button>
        <button id="fullscreen" type="button">Fullscreen</button>
        <button id="details" type="button" aria-expanded="true" aria-controls="stats">Hide details</button>
      </div>
      <div class="toolbar">
        <label>Exposure <input id="exposure" type="range" min="-2" max="2" step="0.1" value="0" aria-label="Exposure"></label>
        <label>Environment <input id="environment" type="range" min="0" max="2" step="0.1" value="1" aria-label="Environment intensity"></label>
      </div>
      <canvas id="viewport" tabindex="0" aria-label="Material preview. Arrow keys pan; Reset restores object and camera."></canvas>
      <output id="preview-status" aria-live="polite">Preview: waiting for document</output>
    </div>
    <div class="stats" id="stats"></div>
  </div>
  <div class="error" id="error" style="display:none"></div>
  <div class="toolbar">
    <button id="copy-diagnostics" type="button">Copy diagnostics</button>
    <button id="download-diagnostics" type="button">Download diagnostics</button>
  </div>
  <div id="log"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}
