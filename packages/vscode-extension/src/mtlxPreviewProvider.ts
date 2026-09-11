import { DEFAULT_MATERIALX_READ_LIMITS } from 'mtlx-core';
import { getPreviewHtml } from './previewHtml.js';
import { parsePreviewSettings } from './previewSettings.js';
import { loadPreviewAsset } from './previewAssets.js';
import { analyze } from './mtlxAnalyze.js';
import * as vscode from 'vscode';
import { MtlxPreviewDocument } from './mtlxPreviewDocument.js';

export class MtlxPreviewProvider implements vscode.CustomReadonlyEditorProvider<MtlxPreviewDocument> {
  private readonly _output = vscode.window.createOutputChannel('Mtlx Viewer');

  constructor(private readonly _context: vscode.ExtensionContext) {}

  dispose(): void {
    this._output.dispose();
  }

  async openCustomDocument(uri: vscode.Uri): Promise<MtlxPreviewDocument> {
    const limit = /\.mtlx\.zip$/i.test(uri.path)
      ? DEFAULT_MATERIALX_READ_LIMITS.maxArchiveBytes
      : DEFAULT_MATERIALX_READ_LIMITS.maxXmlBytes;
    if ((await vscode.workspace.fs.stat(uri)).size > limit) throw new Error('Material file byte limit exceeded');
    const raw = await vscode.workspace.fs.readFile(uri);
    const fileName = uri.path.split('/').at(-1)!;
    const result = await analyze(fileName, raw, async (resourcePath) => {
      const resourceUri = resolveResourceUri(uri, resourcePath);
      const stat = await vscode.workspace.fs.stat(resourceUri);
      if (stat.size > DEFAULT_MATERIALX_READ_LIMITS.maxEntryBytes) throw new Error('Resource byte limit exceeded');
      return vscode.workspace.fs.readFile(resourceUri);
    });
    return new MtlxPreviewDocument(
      uri,
      raw.length,
      fileName,
      raw,
      result.issues,
      result.summary,
      result.parseError,
      result.resources.map((resource) => ({ path: resource.sourcePath, data: resource.data })),
      result.resourcesChecked,
      result.resourcePaths,
    );
  }

  async resolveCustomEditor(document: MtlxPreviewDocument, webviewPanel: vscode.WebviewPanel): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'media')],
    };

    const scriptUri = webviewPanel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', 'preview.js'),
    );
    const shaderBall = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', 'shaderball.glb'),
    );
    let disposed = false;
    let generation = 0;
    let ready = false;
    const assetAbort = new AbortController();
    const readSettings = () => {
      const config = vscode.workspace.getConfiguration('mtlx.preview', document.uri);
      return parsePreviewSettings(
        Object.fromEntries(
          ['ibls', 'geometries', 'defaultIbl', 'defaultGeometry', 'autoRotate'].map((key) => [key, config.get(key)]),
        ),
      );
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let resourceSubscriptions: vscode.Disposable[] = [];
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!disposed && ready && webviewPanel.visible) void refresh();
      }, 100);
    };
    const watchResources = (current: MtlxPreviewDocument) => {
      for (const subscription of resourceSubscriptions) subscription.dispose();
      resourceSubscriptions = [];
      const uris = [
        document.uri,
        ...current.resourcePaths.flatMap((resourcePath) => {
          try {
            return [resolveResourceUri(document.uri, resourcePath)];
          } catch {
            return [];
          }
        }),
      ];
      for (const uri of new Map(uris.map((resourceUri) => [resourceUri.toString(), resourceUri])).values()) {
        const watcher = vscode.workspace.createFileSystemWatcher(
          new vscode.RelativePattern(vscode.Uri.joinPath(uri, '..'), uri.path.split('/').at(-1)!),
        );
        resourceSubscriptions.push(
          watcher,
          watcher.onDidChange(scheduleRefresh),
          watcher.onDidCreate(scheduleRefresh),
          watcher.onDidDelete(scheduleRefresh),
        );
      }
    };
    /* oxlint-disable unicorn/require-post-message-target-origin */
    const refresh = async () => {
      const request = ++generation;
      try {
        const current = await this.openCustomDocument(document.uri);
        if (disposed || request !== generation) return;
        watchResources(current);
        await webviewPanel.webview.postMessage({
          settings: readSettings(),
          fileName: current.fileName,
          fileSize: current.fileSize,
          valid: !current.parseError && !current.issues.some((issue) => issue.level === 'error'),
          issues: current.issues,
          summary: current.summary,
          parseError: current.parseError,
          resourcesChecked: current.resourcesChecked,
          resourcePaths: current.resourcePaths,
          data: current.raw.slice().buffer,
          textures: current.textures.map((texture) => ({ path: texture.path, data: texture.data.slice().buffer })),
          shaderBall: shaderBall.slice().buffer,
        });
      } catch (error) {
        if (disposed || request !== generation) return;
        const message = error instanceof Error ? error.message : String(error);
        // oxlint-disable-next-line unicorn/require-post-message-target-origin
        await webviewPanel.webview.postMessage({
          fileName: document.fileName,
          fileSize: 0,
          valid: false,
          issues: [{ level: 'error', location: document.uri.toString(), message }],
          parseError: message,
          textures: [],
        });
      }
    };
    /* oxlint-enable unicorn/require-post-message-target-origin */
    const listener = webviewPanel.webview.onDidReceiveMessage(
      async (message: {
        type?: string;
        message?: string;
        diagnostics?: string;
        requestId?: number;
        kind?: 'ibl' | 'geometry';
        name?: string;
      }) => {
        if (disposed) return;
        if (message.type === 'loadAsset' && Number.isSafeInteger(message.requestId)) {
          try {
            const settings = readSettings();
            const list =
              message.kind === 'ibl' ? settings.ibls : message.kind === 'geometry' ? settings.geometries : [];
            const asset = list.find((entry) => entry.name === message.name);
            if (!asset) throw new Error('Unknown configured preview asset');
            const result = await loadPreviewAsset(asset, message.kind!, document.uri, assetAbort.signal);
            if (!disposed)
              // oxlint-disable-next-line unicorn/require-post-message-target-origin
              await webviewPanel.webview.postMessage({ type: 'asset', requestId: message.requestId, ...result });
          } catch (error) {
            if (!disposed) {
              const response = {
                type: 'asset',
                requestId: message.requestId,
                error: error instanceof Error ? error.message : String(error),
              };
              // oxlint-disable-next-line unicorn/require-post-message-target-origin
              await webviewPanel.webview.postMessage(response);
            }
          }
        } else if (message.type === 'ready' || message.type === 'refresh') {
          ready = true;
          void refresh();
        } else if (message.type === 'log' && message.message) this._output.appendLine(message.message);
        else if (message.type === 'copyDiagnostics' && typeof message.diagnostics === 'string') {
          await vscode.env.clipboard.writeText(message.diagnostics);
        } else if (message.type === 'downloadDiagnostics' && typeof message.diagnostics === 'string') {
          const destination = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.joinPath(document.uri, '..', 'mtlx-diagnostics.json'),
            filters: { JSON: ['json'] },
          });
          if (destination)
            await vscode.workspace.fs.writeFile(destination, new TextEncoder().encode(message.diagnostics));
        }
      },
    );
    watchResources(document);
    const subscriptions = [
      listener,
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('mtlx.preview', document.uri)) scheduleRefresh();
      }),
      webviewPanel.onDidChangeViewState(() => {
        if (ready && webviewPanel.visible) void refresh();
      }),
    ];
    webviewPanel.onDidDispose(() => {
      disposed = true;
      assetAbort.abort();
      generation++;
      clearTimeout(timer);
      for (const subscription of [...subscriptions, ...resourceSubscriptions]) subscription.dispose();
    });
    // The handler must be registered before the script can announce readiness.
    webviewPanel.webview.html = getPreviewHtml(
      webviewPanel.webview,
      scriptUri,
      webviewPanel.webview.asWebviewUri(
        vscode.Uri.joinPath(this._context.extensionUri, 'media', 'default-environment.hdr'),
      ),
    );
  }
}

/** Resolve sibling paths without losing remote/virtual schemes or authority. */
export function resolveResourceUri(documentUri: vscode.Uri, resourcePath: string): vscode.Uri {
  if (/^[a-z][a-z0-9+.-]*:/i.test(resourcePath)) return vscode.Uri.parse(resourcePath);
  if (resourcePath.startsWith('/')) return documentUri.with({ path: resourcePath });
  return vscode.Uri.joinPath(documentUri, '..', resourcePath);
}
