import http from 'node:http';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { mimeTypeFor, safeJoin, startViewServer, type ViewServer } from './server.js';

describe('safeJoin', () => {
  it('joins a plain relative path under the root', () => {
    expect(safeJoin('/root/dir', '/textures/wood.jpg')).toBe(path.join('/root/dir', 'textures/wood.jpg'));
  });

  it('refuses traversal outside the root', () => {
    expect(safeJoin('/root/dir', '/../../etc/passwd')).toBeNull();
    expect(safeJoin('/root/dir', '/..%2f..%2fetc/passwd')).toBeNull();
  });

  it('resolves the root itself for an empty path', () => {
    expect(safeJoin('/root/dir', '/')).toBe(path.resolve('/root/dir'));
  });
});

describe('mimeTypeFor', () => {
  it('maps known extensions', () => {
    expect(mimeTypeFor('a.mtlx')).toBe('application/xml');
    expect(mimeTypeFor('a.jpg')).toBe('image/jpeg');
    expect(mimeTypeFor('a.glb')).toBe('model/gltf-binary');
  });

  it('falls back to octet-stream for unknown extensions', () => {
    expect(mimeTypeFor('a.unknownext')).toBe('application/octet-stream');
  });
});

function get(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => (body += chunk.toString()));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      })
      .on('error', reject);
  });
}

describe('startViewServer', () => {
  let server: ViewServer | undefined;

  afterEach(async () => {
    await server?.close();
    server = undefined;
  });

  it('rejects a missing file', async () => {
    await expect(startViewServer('/does/not/exist.mtlx')).rejects.toThrow('File not found');
  });

  it('serves an index page and the target file from the local server', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'mtlx-view-'));
    const filePath = path.join(tempDir, 'sample.mtlx');
    await writeFile(filePath, '<materialx version="1.39"></materialx>', 'utf8');

    server = await startViewServer(filePath, tempDir);
    expect(server.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);

    const index = await get(server.url);
    expect(index.status).toBe(200);
    expect(index.body).toContain('__MTLX_FILE__');
    expect(index.body).toContain('sample.mtlx');

    const file = await get(`${server.url}sample.mtlx`);
    expect(file.status).toBe(200);
    expect(file.body).toContain('<materialx');

    const missing = await get(`${server.url}nope.jpg`);
    expect(missing.status).toBe(404);

    const traversal = await get(`${server.url}..%2f..%2fetc%2fpasswd`);
    expect(traversal.status).toBe(403);
  });
});
