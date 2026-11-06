import path from 'node:path';
import { expect, it, vi } from 'vitest';

// Loads the built bundle (what ships), not the TS source, so packaging/interop
// breakage like `x_1.default is not a function` fails here instead of in users' editors.
// Requires `pnpm build` first (CI runs it before `pnpm test`).

// Any property is a callable stub returning another stub: enough for activate() to run.
const stub = (): object =>
  new Proxy(function () {}, { get: (_t, key) => (key === 'then' ? undefined : stub()), apply: stub, construct: stub });
vi.mock('vscode', () =>
  Object.fromEntries(
    [
      'window',
      'workspace',
      'commands',
      'env',
      'Uri',
      'ProgressLocation',
      'ViewColumn',
      'Disposable',
      'EventEmitter',
    ].map((k) => [k, stub()]),
  ),
);

it('built extension bundle loads and activates', async () => {
  const bundle = await import(/* @vite-ignore */ path.resolve(__dirname, '../dist/extension.js'));
  const context = { subscriptions: [] as unknown[], extensionUri: stub(), extensionPath: '' };
  expect(() => bundle.activate(context)).not.toThrow();
  expect(context.subscriptions.length).toBeGreaterThan(0);
});
