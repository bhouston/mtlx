import { describe, expect, it } from 'vitest';
import { createAnonymousClient } from '../client.js';
import { getMediaOriginalUrl } from './media.js';

const host = 'https://api.example.com';
const client = createAnonymousClient({ host });
const params = { userName: 'my-user', assetName: 'my-asset' };

describe('Media API URL builders', () => {
  it('getMediaOriginalUrl builds path /media/$userName/$assetName/original', () => {
    const url = getMediaOriginalUrl(client, { params });
    expect(url.href).toBe(`${host}/media/my-user/my-asset/original`);
  });

  it('getMediaOriginalUrl appends download query when provided', () => {
    const url = getMediaOriginalUrl(client, { params, query: { download: true } });
    expect(url.searchParams.get('download')).toBe('true');
  });
});
