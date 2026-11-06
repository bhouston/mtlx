import { describe, expect, it } from 'vitest';
import { createAnonymousClient } from '../client.js';
import { getFileUrl, getLocalFileUrl } from './files.js';

const validOid = 'a'.repeat(64);

describe('getLocalFileUrl', () => {
  it('returns path only when query is omitted', () => {
    const result = getLocalFileUrl({ params: { oid: validOid } });
    expect(result).toBe(`/files/${validOid}`);
  });

  it('returns path and search when query has name', () => {
    const result = getLocalFileUrl({
      params: { oid: validOid },
      query: { name: 'my-asset' },
    });
    expect(result).toBe(`/files/${validOid}?name=my-asset`);
  });

  it('encodes query value', () => {
    const result = getLocalFileUrl({
      params: { oid: validOid },
      query: { name: 'asset with spaces' },
    });
    expect(result).toContain('/files/');
    expect(result).toContain('name=');
    const url = new URL(result, 'http://x');
    expect(url.searchParams.get('name')).toBe('asset with spaces');
  });
});

describe('getFileUrl', () => {
  it('returns full URL with host', () => {
    const client = createAnonymousClient({ host: 'https://api.example.com' });
    const url = getFileUrl(client, { params: { oid: validOid } });
    expect(url.href).toBe(`https://api.example.com/files/${validOid}`);
  });

  it('returns full URL with host and query', () => {
    const client = createAnonymousClient({ host: 'https://api.example.com' });
    const url = getFileUrl(client, {
      params: { oid: validOid },
      query: { name: 'task-logs' },
    });
    expect(url.href).toBe(`https://api.example.com/files/${validOid}?name=task-logs`);
  });

  it('matches getLocalFileUrl path+search when resolved against host', () => {
    const host = 'https://api.example.com';
    const client = createAnonymousClient({ host });
    const props = { params: { oid: validOid }, query: { name: 'x' } as const };
    const fullUrl = getFileUrl(client, props);
    const localPath = getLocalFileUrl(props);
    expect(new URL(localPath, host).href).toBe(fullUrl.href);
  });
});
