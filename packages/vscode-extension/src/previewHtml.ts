import type * as vscode from 'vscode';

export function getPreviewHtml(
  webview: vscode.Webview,
  scriptUri: vscode.Uri,
  environmentUri: vscode.Uri,
  styleUri: vscode.Uri,
): string {
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
  <link rel="stylesheet" href="${styleUri}">
</head>
<body data-hdr-url="${environmentUri}">
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}
