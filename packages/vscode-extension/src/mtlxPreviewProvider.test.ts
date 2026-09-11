import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as vscode from 'vscode';

const mocked = vi.hoisted(() => {
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- the mock must exist inside the hoisted factory
  const uri = (value: string): vscode.Uri => {
    const url = new URL(value);
    return {
      path: url.pathname,
      fsPath: url.pathname,
      scheme: url.protocol.slice(0, -1),
      authority: url.host,
      toString: () => url.href,
      with: (change: { path: string }) => {
        const next = new URL(url);
        next.pathname = change.path;
        return uri(next.href);
      },
    } as vscode.Uri;
  };
  return {
    uri,
    configuration: {} as Record<string, unknown>,
    configurationChanged: undefined as ((event: { affectsConfiguration: () => boolean }) => void) | undefined,
    readFile: vi.fn(),
    clipboard: vi.fn(),
    writeFile: vi.fn(),
    saveDialog: vi.fn(),
    watchers: [] as Array<{
      pattern: { base: vscode.Uri; pattern: string };
      change: () => void;
      create: () => void;
      delete: () => void;
      dispose: ReturnType<typeof vi.fn>;
    }>,
  };
});
vi.mock('vscode', () => ({
  window: { createOutputChannel: () => ({ appendLine: vi.fn(), dispose: vi.fn() }), showSaveDialog: mocked.saveDialog },
  env: { clipboard: { writeText: mocked.clipboard } },
  workspace: {
    getConfiguration: () => ({ get: (key: string) => mocked.configuration[key] }),
    getWorkspaceFolder: () => undefined,
    onDidChangeConfiguration: (callback: typeof mocked.configurationChanged) => {
      mocked.configurationChanged = callback;
      return { dispose: vi.fn() };
    },
    fs: { readFile: mocked.readFile, writeFile: mocked.writeFile, stat: async () => ({ size: 10 }) },
    createFileSystemWatcher: (pattern: { base: vscode.Uri; pattern: string }) => {
      const watcher = { pattern, change: () => {}, create: () => {}, delete: () => {}, dispose: vi.fn() };
      mocked.watchers.push(watcher);
      return {
        dispose: watcher.dispose,
        onDidChange: (cb: () => void) => {
          watcher.change = cb;
          return { dispose: vi.fn() };
        },
        onDidCreate: (cb: () => void) => {
          watcher.create = cb;
          return { dispose: vi.fn() };
        },
        onDidDelete: (cb: () => void) => {
          watcher.delete = cb;
          return { dispose: vi.fn() };
        },
      };
    },
  },
  Uri: {
    parse: mocked.uri,
    file: (path: string) => mocked.uri(new URL(path, 'file:///').href),
    joinPath: (uri: vscode.Uri, ...parts: string[]) => uri.with({ path: `${uri.path}/${parts.join('/')}` }),
  },
  RelativePattern: class {
    constructor(
      readonly base: vscode.Uri,
      readonly pattern: string,
    ) {}
  },
}));
import { MtlxPreviewProvider, resolveResourceUri } from './mtlxPreviewProvider.js';

beforeEach(() => {
  mocked.watchers.length = 0;
  mocked.configuration = {};
  mocked.readFile.mockReset();
});
const encode = (text: string) => new TextEncoder().encode(text);
const rootUri = mocked.uri('vscode-remote://ssh-remote+studio/work/material.mtlx');
async function setup() {
  const provider = new MtlxPreviewProvider({
    extensionUri: mocked.uri('file:///extension'),
  } as vscode.ExtensionContext);
  const document = await provider.openCustomDocument(rootUri);
  let receive: (message: {
    type: string;
    diagnostics?: string;
    kind?: 'ibl' | 'geometry';
    name?: string;
    requestId?: number;
  }) => void = vi.fn();
  let dispose: () => void = vi.fn();
  let viewState: () => void = vi.fn();
  const postMessage = vi.fn().mockResolvedValue(true);
  const panel = {
    visible: true,
    webview: {
      options: {},
      html: '',
      cspSource: 'local',
      asWebviewUri: () => 'preview.js',
      postMessage,
      onDidReceiveMessage: (cb: typeof receive) => {
        receive = cb;
        return { dispose: vi.fn() };
      },
    },
    onDidDispose: (cb: typeof dispose) => {
      dispose = cb;
      return { dispose: vi.fn() };
    },
    onDidChangeViewState: (cb: typeof viewState) => {
      viewState = cb;
      return { dispose: vi.fn() };
    },
  } as unknown as vscode.WebviewPanel;
  await provider.resolveCustomEditor(document, panel);
  return {
    provider,
    panel,
    postMessage,
    receive: (type: string, diagnostics?: string) => receive({ type, diagnostics }),
    requestAsset: (name: string, requestId: number) => receive({ type: 'loadAsset', kind: 'ibl', name, requestId }),
    dispose: () => {
      dispose();
      provider.dispose();
    },
    viewState: () => viewState(),
  };
}

describe('preview lifecycle', () => {
  it('waits for ready, refreshes saved bytes and rehydrates recreated tabs', async () => {
    let text = '<materialx version="1.39"/>';
    mocked.readFile.mockImplementation(async () => encode(text));
    const host = await setup();
    expect(host.postMessage).not.toHaveBeenCalled();
    host.receive('ready');
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(1));
    expect(host.postMessage.mock.calls[0]?.[0].valid).toBe(true);
    text = '<materialx>';
    host.receive('refresh');
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(2));
    expect(host.postMessage.mock.calls[1]?.[0].valid).toBe(false);
    host.receive('ready');
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(3));
    host.dispose();
    expect(mocked.watchers.every((watcher) => watcher.dispose.mock.calls.length === 1)).toBe(true);
    host.receive('ready');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(host.postMessage).toHaveBeenCalledTimes(3);
  });
  it('watches missing and parent-directory textures and refreshes on create/change/delete', async () => {
    let exists = false;
    mocked.readFile.mockImplementation(async (uri: vscode.Uri) => {
      if (uri.path.endsWith('.glb')) return new Uint8Array([1]);
      if (uri.path.endsWith('.png')) {
        if (!exists) throw new Error('Not found');
        return new Uint8Array([1]);
      }
      return encode(
        '<materialx version="1.39"><image name="a" type="color3"><input name="file" type="filename" value="../textures/a.png"/></image></materialx>',
      );
    });
    const host = await setup();
    host.receive('ready');
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(1));
    expect(host.postMessage.mock.calls[0]?.[0].issues).toContainEqual(
      expect.objectContaining({ code: 'RESOURCE_MISSING' }),
    );
    const watcher = () => mocked.watchers.filter((w) => w.pattern.pattern === 'a.png').at(-1)!;
    expect(watcher().pattern.base.toString()).toBe('vscode-remote://ssh-remote+studio/textures/');
    exists = true;
    watcher().create();
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(2));
    expect(
      host.postMessage.mock.calls[1]?.[0].issues.some((issue: { rule: string }) => issue.rule === 'resources'),
    ).toBe(false);
    watcher().change();
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(3));
    exists = false;
    watcher().delete();
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(4));
    expect(host.postMessage.mock.calls[3]?.[0].textures).toHaveLength(0);
    (host.panel as unknown as { visible: boolean }).visible = false;
    watcher().change();
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(host.postMessage).toHaveBeenCalledTimes(4);
    (host.panel as unknown as { visible: boolean }).visible = true;
    host.viewState();
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(5));
    host.dispose();
  });
  it('suppresses stale reads and reads that finish after disposal', async () => {
    mocked.readFile.mockResolvedValue(encode('<materialx version="1.39"/>'));
    const host = await setup();
    let finish!: (data: Uint8Array) => void;
    mocked.readFile.mockReturnValueOnce(
      new Promise<Uint8Array>((resolve) => {
        finish = resolve;
      }),
    );
    host.receive('ready');
    host.receive('refresh');
    await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(1));
    finish(encode('<materialx>'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(host.postMessage).toHaveBeenCalledTimes(1);
    mocked.readFile.mockReturnValueOnce(
      new Promise<Uint8Array>((resolve) => {
        finish = resolve;
      }),
    );
    host.receive('refresh');
    host.dispose();
    finish(encode('<materialx/>'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(host.postMessage).toHaveBeenCalledTimes(1);
  });
});
it('preserves virtual schemes and authority for relative and absolute sibling paths', () => {
  expect(resolveResourceUri(rootUri, '../textures/a.png').toString()).toBe(
    'vscode-remote://ssh-remote+studio/textures/a.png',
  );
  expect(resolveResourceUri(mocked.uri('git://repo/work/a.mtlx?ref=HEAD'), '/images/a.png').toString()).toBe(
    'git://repo/images/a.png?ref=HEAD',
  );
});

it('exports diagnostics through the host clipboard and chosen save URI', async () => {
  mocked.readFile.mockResolvedValue(encode('<materialx version="1.39"/>'));
  mocked.saveDialog.mockResolvedValue(mocked.uri('file:///reports/diagnostics.json'));
  const host = await setup();
  const diagnostics = JSON.stringify({ issues: [] });
  host.receive('copyDiagnostics', diagnostics);
  await vi.waitFor(() => expect(mocked.clipboard).toHaveBeenCalledWith(diagnostics));
  host.receive('downloadDiagnostics', diagnostics);
  await vi.waitFor(() =>
    expect(mocked.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/reports/diagnostics.json' }),
      encode(diagnostics),
    ),
  );
  host.dispose();
});

it('delivers defaults, reloads changed settings, and only serves configured asset names', async () => {
  mocked.readFile.mockResolvedValue(encode('<materialx version="1.39"/>'));
  const host = await setup();
  host.receive('ready');
  await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(1));
  expect(host.postMessage.mock.calls[0]![0].settings).toMatchObject({
    defaultIbl: 'bridge',
    defaultGeometry: 'totem',
    autoRotate: true,
    bloom: true,
    ao: true,
    toneMapping: 'neutral',
  });
  mocked.configuration = {
    ibls: [{ name: 'gallery', source: '/gallery.hdr' }],
    defaultIbl: 'gallery',
    defaultGeometry: 'sphere',
    autoRotate: false,
    bloom: false,
    ao: false,
    toneMapping: 'agx',
  };
  mocked.configurationChanged?.({ affectsConfiguration: () => true });
  await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(2));
  expect(host.postMessage.mock.calls[1]![0].settings).toMatchObject({
    defaultIbl: 'gallery',
    defaultGeometry: 'sphere',
    autoRotate: false,
    bloom: false,
    ao: false,
    toneMapping: 'agx',
  });
  host.requestAsset('gallery', 3);
  await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(3));
  expect(host.postMessage.mock.calls[2]![0]).toMatchObject({ type: 'asset', requestId: 3, source: '/gallery.hdr' });
  const reads = mocked.readFile.mock.calls.length;
  host.requestAsset('/unconfigured/file.hdr', 4);
  await vi.waitFor(() => expect(host.postMessage).toHaveBeenCalledTimes(4));
  expect(host.postMessage.mock.calls[3]![0]).toMatchObject({
    type: 'asset',
    requestId: 4,
    error: 'Unknown configured preview asset',
  });
  expect(mocked.readFile).toHaveBeenCalledTimes(reads);
  host.dispose();
});
