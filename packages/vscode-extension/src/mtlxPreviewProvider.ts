import * as path from 'node:path';
import { summarizeMaterialX, type MaterialXSummary, type MaterialXValidationIssue } from 'mtlx-core';
import { checkMaterialX, loadMaterialXDocument } from 'mtlx-core/node';
import * as vscode from 'vscode';
import { MtlxPreviewDocument, type MtlxPreviewTexture } from './mtlxPreviewDocument.js';

async function analyze(
  fsPath: string,
): Promise<{ issues: MaterialXValidationIssue[]; summary?: MaterialXSummary; parseError?: string }> {
  try {
    const check = await checkMaterialX(fsPath);
    const { document } = await loadMaterialXDocument(fsPath);
    return { issues: check.issues, summary: summarizeMaterialX(fsPath, document) };
  } catch (error) {
    return { issues: [], parseError: error instanceof Error ? error.message : String(error) };
  }
}

export class MtlxPreviewProvider implements vscode.CustomReadonlyEditorProvider<MtlxPreviewDocument> {
  private readonly _output = vscode.window.createOutputChannel('Mtlx Viewer');

  constructor(private readonly _context: vscode.ExtensionContext) {}

  async openCustomDocument(uri: vscode.Uri): Promise<MtlxPreviewDocument> {
    const raw = await vscode.workspace.fs.readFile(uri);
    const fileName = path.basename(uri.fsPath);
    const { issues, summary, parseError } = await analyze(uri.fsPath);
    const textures = await this._readReferencedTextures(uri, summary);
    return new MtlxPreviewDocument(uri, raw.length, fileName, raw, issues, summary, parseError, textures);
  }

  // For a loose .mtlx, the document's `file` attributes point at sibling texture files on disk
  // that the webview (no real filesystem/network access) can't fetch itself — read them here and
  // ship their bytes over. A no-op for self-contained .mtlz/.mtlx.zip archives, since those paths
  // won't exist next to the archive; three.js's MaterialXLoader resolves textures from inside the
  // archive on its own, so a miss here is expected and harmless.
  private async _readReferencedTextures(
    uri: vscode.Uri,
    summary: MaterialXSummary | undefined,
  ): Promise<MtlxPreviewTexture[]> {
    const dir = path.dirname(uri.fsPath);
    const textures: MtlxPreviewTexture[] = [];
    for (const texturePath of summary?.referencedTextures ?? []) {
      try {
        const data = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(vscode.Uri.file(dir), texturePath));
        textures.push({ path: texturePath, data });
      } catch {
        // Missing here is expected for zip-packaged documents (see doc comment above).
      }
    }
    return textures;
  }

  async resolveCustomEditor(document: MtlxPreviewDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'media')],
    };

    const scriptUri = webviewPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', 'preview.js'),
    );
    webviewPanel.webview.html = getPreviewHtml(webviewPanel.webview, scriptUri);

    webviewPanel.webview.onDidReceiveMessage((message: { type?: string; message?: string }) => {
      if (message.type === 'log' && message.message) {
        this._output.appendLine(message.message);
      }
    });

    // Send document data to webview (VS Code Webview.postMessage has no targetOrigin)
    /* oxlint-disable unicorn/require-post-message-target-origin */
    webviewPanel.webview.postMessage({
      fileName: document.fileName,
      fileSize: document.fileSize,
      valid: !document.issues.some((issue) => issue.level === 'error'),
      issues: document.issues,
      summary: document.summary,
      parseError: document.parseError,
      // Raw original bytes — three.js's MaterialXLoader.parseBuffer() natively understands
      // plain .mtlx, .mtlz, AND .mtlx.zip (it sniffs the zip magic bytes), so the webview needs
      // no zip-handling code of its own.
      data: document.raw.buffer,
      // Sibling texture files for a loose .mtlx (see _readReferencedTextures) — the webview turns
      // these into blob: URLs and rewrites the loader's texture requests to them.
      // VS Code's webview message channel only special-cases top-level ArrayBuffers for binary
      // transfer; a Uint8Array nested inside a plain object (unlike `data` above) silently arrives
      // empty/corrupt, so send `.buffer` explicitly here too.
      textures: document.textures.map((t) => ({ path: t.path, data: t.data.buffer })),
    });
    /* oxlint-enable unicorn/require-post-message-target-origin */
  }
}

function getPreviewHtml(webview: vscode.Webview, scriptUri: vscode.Uri): string {
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
    .layout { display: flex; gap: 16px; flex: 1; min-height: 0; }
    .viewport-wrap { flex: 2; min-width: 0; position: relative; }
    #viewport { width: 100%; height: 100%; }
    .stats { flex: 1; min-width: 220px; overflow: auto; font-size: 12px; }
    .stats dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; }
    .stats dt { font-weight: 600; color: var(--vscode-foreground); }
    .stats dd { margin: 0; word-break: break-word; }
    .valid { color: var(--vscode-testing-iconPassed, #4caf50); font-weight: 600; }
    .invalid { color: var(--vscode-errorForeground); font-weight: 600; }
    .issue-error { color: var(--vscode-errorForeground); }
    .issue-warning { color: var(--vscode-editorWarning-foreground, #cca700); }
    .error { color: var(--vscode-errorForeground); padding: 8px 16px; white-space: pre-wrap; }
    h2 { font-size: 13px; margin: 12px 0 4px; }
    ul { margin: 4px 0; padding-left: 18px; }
    #log {
      flex: none;
      height: 90px;
      overflow: auto;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-textCodeBlock-background, rgba(128, 128, 128, 0.1));
      padding: 4px 8px;
      border-top: 1px solid var(--vscode-panel-border, transparent);
    }
  </style>
</head>
<body>
  <div class="layout">
    <div class="viewport-wrap"><canvas id="viewport"></canvas></div>
    <div class="stats" id="stats"></div>
  </div>
  <div class="error" id="error" style="display:none"></div>
  <div id="log"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}
