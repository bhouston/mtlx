import * as path from 'node:path';
import {
  checkMaterialXPackage,
  checkMaterialXZipPackage,
  detectFormat,
  loadMaterialXDocument,
  summarizeMaterialX,
  type MaterialXSummary,
  type MaterialXValidationIssue,
} from 'mtlx-core';
import * as vscode from 'vscode';
import { MtlxPreviewDocument } from './mtlxPreviewDocument.js';

async function analyze(
  fsPath: string,
): Promise<{ issues: MaterialXValidationIssue[]; summary?: MaterialXSummary; parseError?: string }> {
  try {
    const check =
      detectFormat(fsPath) === 'mtlx.zip'
        ? await checkMaterialXZipPackage(fsPath)
        : await checkMaterialXPackage(fsPath);
    const { document } = await loadMaterialXDocument(fsPath);
    return { issues: check.issues, summary: summarizeMaterialX(fsPath, document) };
  } catch (error) {
    return { issues: [], parseError: error instanceof Error ? error.message : String(error) };
  }
}

export class MtlxPreviewProvider implements vscode.CustomReadonlyEditorProvider<MtlxPreviewDocument> {
  constructor(private readonly _context: vscode.ExtensionContext) {}

  async openCustomDocument(uri: vscode.Uri): Promise<MtlxPreviewDocument> {
    const raw = await vscode.workspace.fs.readFile(uri);
    const fileName = path.basename(uri.fsPath);
    const { issues, summary, parseError } = await analyze(uri.fsPath);
    return new MtlxPreviewDocument(uri, raw.length, fileName, raw, issues, summary, parseError);
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
    .error { color: var(--vscode-errorForeground); padding: 16px; }
    h2 { font-size: 13px; margin: 12px 0 4px; }
    ul { margin: 4px 0; padding-left: 18px; }
  </style>
</head>
<body>
  <div class="layout">
    <div class="viewport-wrap"><canvas id="viewport"></canvas></div>
    <div class="stats" id="stats"></div>
  </div>
  <div class="error" id="error" style="display:none"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}
