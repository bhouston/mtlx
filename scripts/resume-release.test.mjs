import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPublished, validateRecoveryTag } from './resume-release.mjs';

await test('recovery accepts only stable release tags', () => {
  validateRecoveryTag('v0.10.0');
  for (const tag of [undefined, '', 'main', 'v01.2.3', 'v1.2.3-beta.1', 'v1.2.3/other', 'v1.2.3\n']) {
    assert.throws(() => validateRecoveryTag(tag));
  }
});

await test('recovery skips an existing matching package version', async () => {
  assert.equal(
    await isPublished(
      'mtlx-core',
      '0.10.0',
      async () => new Response(JSON.stringify({ name: 'mtlx-core', version: '0.10.0' })),
    ),
    true,
  );
});

await test('only a registry 404 permits publication', async () => {
  assert.equal(await isPublished('mtlx-core', '0.10.0', async () => new Response(null, { status: 404 })), false);
  for (const status of [401, 403, 429, 500, 503]) {
    await assert.rejects(isPublished('mtlx-core', '0.10.0', async () => new Response(null, { status })));
  }
  await assert.rejects(
    isPublished('mtlx-core', '0.10.0', async () => {
      throw new Error('offline');
    }),
  );
});

await test('unexpected registry metadata stops recovery', async () => {
  for (const metadata of [
    { name: 'other', version: '0.10.0' },
    { name: 'mtlx-core', version: '0.9.0' },
  ]) {
    await assert.rejects(isPublished('mtlx-core', '0.10.0', async () => new Response(JSON.stringify(metadata))));
  }
});
