import * as vscode from 'vscode';
import { filterMtlxUris, normalizeUris, type TargetFormat } from './mtlxOperations.js';
import { convertMaterialXFiles } from './mtlxConvert.js';
import { MtlxPreviewProvider } from './mtlxPreviewProvider.js';

async function runConvert(uris: vscode.Uri[], target: TargetFormat): Promise<void> {
  const result = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Converting to ${target}…`, cancellable: false },
    (progress) =>
      convertMaterialXFiles(
        uris.map((uri) => uri.fsPath),
        target,
        () => {
          progress.report({ increment: 100 / uris.length });
        },
      ),
  );
  const message = `Mtlx: ${result.converted.length} converted, ${result.skipped.length} skipped, ${result.failed.length} failed.`;
  const actions = result.converted.length ? ['Open'] : [];
  if (result.failed.length) actions.push('Details');
  const selected = result.failed.length
    ? await vscode.window.showWarningMessage(message, ...actions)
    : await vscode.window.showInformationMessage(message, ...actions);
  if (selected === 'Details') {
    const document = await vscode.workspace.openTextDocument({
      content: result.failed.map((failure) => `${failure.path}: ${failure.message}`).join('\n'),
    });
    await vscode.window.showTextDocument(document);
  } else if (selected === 'Open') {
    const output =
      result.converted.length === 1
        ? result.converted[0]
        : await vscode.window.showQuickPick(result.converted, { placeHolder: 'Open converted material' });
    if (output) await vscode.commands.executeCommand('vscode.openWith', vscode.Uri.file(output), 'mtlx.mtlxPreview');
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const previewProvider = new MtlxPreviewProvider(context);
  context.subscriptions.push(
    previewProvider,
    vscode.window.registerCustomEditorProvider('mtlx.mtlxPreview', previewProvider, {
      webviewOptions: { retainContextWhenHidden: false },
    }),
  );

  const targets: TargetFormat[] = ['mtlx', 'mtlx.zip'];
  const commandForTarget: Record<TargetFormat, string> = {
    mtlx: 'mtlx.convertToMtlx',
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
              'Mtlx: No file selected. Right-click a .mtlx/.mtlx.zip file in the Explorer.',
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
