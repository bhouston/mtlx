import { describe, expect, it } from 'vitest';
import { resolveAssetRef } from './args.ts';

describe('resolveAssetRef', () => {
  it('parses <org>/<project>/<name>', () => {
    expect(resolveAssetRef('acme/library/copper', undefined, undefined, undefined)).toEqual({
      orgName: 'acme',
      projectName: 'library',
      name: 'copper',
    });
  });

  it('combines a bare name or --name with --org/--project', () => {
    const expected = { orgName: 'acme', projectName: 'library', name: 'copper' };
    expect(resolveAssetRef('copper', 'acme', 'library', undefined)).toEqual(expected);
    expect(resolveAssetRef(undefined, 'acme', 'library', 'copper')).toEqual(expected);
  });

  it('rejects malformed or incomplete references', () => {
    expect(() => resolveAssetRef('acme/copper', 'acme', 'library', undefined)).toThrow('<org>/<project>/<name>');
    expect(() => resolveAssetRef('copper', 'acme', undefined, undefined)).toThrow('No org/project specified');
    expect(() => resolveAssetRef(undefined, 'acme', 'library', undefined)).toThrow('Provide <org>/<project>/<name>');
  });
});
