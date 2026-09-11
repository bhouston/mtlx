import type * as vscode from 'vscode';

export function getPreviewHtml(webview: vscode.Webview, scriptUri: vscode.Uri, environmentUri: vscode.Uri): string {
  const csp = [
    "default-src 'none'",
    `script-src ${webview.cspSource}`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    'worker-src blob:',
    'img-src data: blob:',
    // ImageBitmapLoader (three.js) fetches texture blob: URLs via fetch(), governed by
    // connect-src rather than img-src.
    `connect-src ${webview.cspSource} blob:`,
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
    .stats details { margin: 10px 0; }
    .stats summary { cursor: pointer; user-select: none; font-weight: 600; }
    .stats dl { margin: 8px 0 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; }
    .stats dt { font-weight: 600; }
    .stats dd { margin: 0; word-break: break-word; }
    .stats ul { margin: 4px 0 0; padding-left: 18px; }
    .stats .none { list-style: none; margin-left: -18px; color: var(--vscode-descriptionForeground); }
    .check-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .check-messages { margin-top: 2px; font-size: 11px; color: var(--vscode-descriptionForeground); }
    .check-passed { color: var(--vscode-testing-iconPassed, #4caf50); }
    .check-failed { color: var(--vscode-errorForeground); }
    .check-warning { color: var(--vscode-editorWarning-foreground, #cca700); }
    .check-pending, .check-unchecked { color: var(--vscode-descriptionForeground); }
    .error { color: var(--vscode-errorForeground); padding: 8px 16px; white-space: pre-wrap; }
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
<body data-hdr-url="${environmentUri}">
  <div class="layout">
    <div class="viewport-wrap">
      <div class="toolbar">
        <select id="material-select" aria-label="Material"></select>
      </div>
      <canvas id="viewport" tabindex="0" aria-label="Material preview. Arrow keys pan."></canvas>
      <div class="toolbar">
        <label>Geometry <select id="geometry-select" aria-label="Geometry">
          <option value="totem">Totem</option>
          <option value="sphere">Sphere</option>
          <option value="plane">Plane</option>
        </select></label>
        <label><input id="rotation" type="checkbox" disabled aria-label="Rotate"> Rotate</label>
        <label>IBL <select id="environment-select" aria-label="IBL environment"><option value="studio">Studio</option><option value="bridge" selected>San Giuseppe Bridge</option></select></label>
        <label>Tone mapping <select id="tone-mapping" aria-label="Tone mapping"></select></label>
        <label><input id="bloom" type="checkbox" checked aria-label="Bloom"> Bloom</label>
        <label><input id="ao" type="checkbox" checked aria-label="Ambient occlusion"> AO</label>
        <label>Exposure <input id="exposure" type="range" min="-2" max="2" step="0.1" value="0" aria-label="Exposure"></label>
        <label>Intensity <input id="environment" type="range" min="0" max="2" step="0.1" value="1" aria-label="Environment intensity"></label>
      </div>
      <output id="geometry-status" aria-live="polite"></output>
      <output id="settings-status" aria-live="polite"></output>
      <output id="environment-status" aria-live="polite"></output>
    </div>
    <div class="stats" id="stats"></div>
  </div>
  <div class="error" id="error" style="display:none"></div>
  <div id="log"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}
