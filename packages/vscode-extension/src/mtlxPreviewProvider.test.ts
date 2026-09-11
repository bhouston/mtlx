import { describe, expect, it, vi } from 'vitest';
import type * as vscode from 'vscode';

const mocked = vi.hoisted(() => ({ readFile: vi.fn(), disposed: vi.fn() }));
vi.mock('vscode', () => ({
  window: { createOutputChannel: () => ({ appendLine: vi.fn(), dispose: vi.fn() }) },
  workspace: {
    fs: { readFile: mocked.readFile },
    createFileSystemWatcher: () => ({
      dispose: mocked.disposed,
      onDidChange: () => ({ dispose: vi.fn() }),
      onDidCreate: () => ({ dispose: vi.fn() }),
      onDidDelete: () => ({ dispose: vi.fn() }),
    }),
  },
  Uri: { joinPath: (uri: { fsPath: string }, ...parts: string[]) => ({ fsPath: `${uri.fsPath}/${parts.join('/')}` }) },
  RelativePattern: class {
    constructor(
      readonly base: unknown,
      readonly pattern: string,
    ) {}
  },
}));

import { MtlxPreviewProvider } from './mtlxPreviewProvider.js';

describe('preview lifecycle', () => {
  it('waits for ready, reloads restored tabs and releases watchers', async () => {
    let text = '<materialx version="1.39"/>';
    mocked.readFile.mockImplementation(async () => new TextEncoder().encode(text));
    const uri = { fsPath: '/sample.mtlx', toString: () => 'file:///sample.mtlx' } as vscode.Uri;
    const provider = new MtlxPreviewProvider({ extensionUri: uri } as vscode.ExtensionContext);
    const document = await provider.openCustomDocument(uri);
    let receive: (message: { type: string }) => void = vi.fn();
    let dispose: () => void = vi.fn();
    const postMessage = vi.fn().mockResolvedValue(true);
    const panel = {
      visible: true,
      webview: {
        options: {},
        html: '',
        cspSource: 'local',
        asWebviewUri: () => 'preview.js',
        postMessage,
        onDidReceiveMessage: (callback: typeof receive) => {
          receive = callback;
          return { dispose: vi.fn() };
        },
      },
      onDidDispose: (callback: typeof dispose) => {
        dispose = callback;
      },
    } as unknown as vscode.WebviewPanel;
    await provider.resolveCustomEditor(document, panel);
    expect(postMessage).not.toHaveBeenCalled();
    receive({ type: 'ready' });
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledTimes(1));
    expect(postMessage.mock.calls[0]?.[0].valid).toBe(true);
    text = '<materialx>';
    receive({ type: 'ready' });
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledTimes(2));
    expect(postMessage.mock.calls[1]?.[0].valid).toBe(false);
    receive({ type: 'refresh' });
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledTimes(3));
    dispose();
    expect(mocked.disposed).toHaveBeenCalledTimes(1);
    provider.dispose();
  });
});
