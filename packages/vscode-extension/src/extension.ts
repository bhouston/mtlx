import * as vscode from 'vscode';
import { convertMaterialXFile, filterMtlxUris, normalizeUris, type TargetFormat } from './mtlxOperations.js';
import { MtlxPreviewProvider } from './mtlxPreviewProvider.js';

async function runConvert(uris: vscode.Uri[], target: TargetFormat): Promise<void> {
  const run = async (uri: vscode.Uri) => {
    try {
      await convertMaterialXFile(uri.fsPath, target);
    } catch (error) {
      vscode.window.showErrorMessage(`Mtlx: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (uris.length > 1) {
    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Converting to ${target}…`, cancellable: false },
      async (progress) => {
        const increment = 100 / uris.length;
        for (const uri of uris) {
          await run(uri);
          progress.report({ increment });
        }
      },
    );
  } else if (uris[0]) {
    await run(uris[0]);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const previewProvider = new MtlxPreviewProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider('mtlx.mtlxPreview', previewProvider, {
      webviewOptions: { retainContextWhenHidden: false },
    }),
  );

  const targets: TargetFormat[] = ['mtlx', 'mtlz', 'mtlx.zip'];
  const commandForTarget: Record<TargetFormat, string> = {
    mtlx: 'mtlx.convertToMtlx',
    mtlz: 'mtlx.convertToMtlz',
    'mtlx.zip': 'mtlx.convertToMtlxZip',
  };
  for (const target of targets) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        commandForTarget[target],
        async (uri: vscode.Uri, selectedResources?: vscode.Uri[]) => {
          const all = normalizeUris(uri, selectedResources);
          if (!all.length) {
            vscode.window.showErrorMessage(
              'Mtlx: No file selected. Right-click a .mtlx/.mtlz/.mtlx.zip file in the Explorer.',
            );
            return;
          }
          const uris = filterMtlxUris(all);
          if (!uris.length) return;
          await runConvert(uris, target);
        },
      ),
    );
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('mtlx.openPreview', async (uri: vscode.Uri) => {
      const resource = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!resource) {
        vscode.window.showErrorMessage('Mtlx: No file selected.');
        return;
      }
      await vscode.commands.executeCommand('vscode.openWith', resource, 'mtlx.mtlxPreview');
    }),
  );
}

export function deactivate(): void {}
