import { describe, expect, test } from 'vitest';
import { lookupRedirectTarget, parseRedirectsFile } from './redirects';

describe('redirects', () => {
  const redirects = parseRedirectsFile(`
# comment
gh https://github.com/bhouston/mtlx
docs/ /docs/
`);

  test('parses sources and targets', () => {
    expect(redirects.get('gh')).toBe('https://github.com/bhouston/mtlx');
  });

  test('lookup tolerates leading and trailing slashes', () => {
    expect(lookupRedirectTarget(redirects, '/gh')).toBe('https://github.com/bhouston/mtlx');
    expect(lookupRedirectTarget(redirects, 'docs')).toBe('/docs/');
    expect(lookupRedirectTarget(redirects, 'nope')).toBeUndefined();
  });

  test('rejects unsafe targets', () => {
    expect(() => parseRedirectsFile('x //evil.com')).toThrow();
    expect(() => parseRedirectsFile('x http://evil.com')).toThrow();
    expect(() => parseRedirectsFile('x relative')).toThrow();
  });
});
