import { describe, expect, it } from 'vitest';
import { buildPath } from './buildPath.js';

describe('buildPath', () => {
  describe('basic parameter substitution', () => {
    it('should substitute a single parameter', () => {
      const result = buildPath('/api/$orgId/test', { orgId: 'my-org' });
      expect(result).toBe('/api/my-org/test');
    });

    it('should substitute multiple parameters', () => {
      const result = buildPath('/api/$orgId/$projectId/test', {
        orgId: 'my-org',
        projectId: 'my-project',
      });
      expect(result).toBe('/api/my-org/my-project/test');
    });

    it('should handle parameter at the start of path', () => {
      const result = buildPath('/$orgId/test', { orgId: 'my-org' });
      expect(result).toBe('/my-org/test');
    });

    it('should handle parameter at the end of path', () => {
      const result = buildPath('/api/$orgId', { orgId: 'my-org' });
      expect(result).toBe('/api/my-org');
    });

    it('should handle consecutive parameters', () => {
      const result = buildPath('/$orgId/$projectId', {
        orgId: 'my-org',
        projectId: 'my-project',
      });
      expect(result).toBe('/my-org/my-project');
    });

    it('should handle parameters in middle of segments', () => {
      const result = buildPath('/api/$orgId/projects/$projectId/assets', {
        orgId: 'my-org',
        projectId: 'my-project',
      });
      expect(result).toBe('/api/my-org/projects/my-project/assets');
    });
  });

  describe('URL encoding', () => {
    it('should encode special characters in parameters', () => {
      const result = buildPath('/api/$orgId/test', { orgId: 'my/org' });
      expect(result).toBe('/api/my%2Forg/test');
    });

    it('should encode spaces', () => {
      const result = buildPath('/api/$orgId/test', { orgId: 'my org' });
      expect(result).toBe('/api/my%20org/test');
    });

    it('should encode query string characters', () => {
      const result = buildPath('/api/$orgId/test', { orgId: 'my?org&test' });
      expect(result).toBe('/api/my%3Forg%26test/test');
    });

    it('should encode hash characters', () => {
      const result = buildPath('/api/$orgId/test', { orgId: 'my#org' });
      expect(result).toBe('/api/my%23org/test');
    });

    it('should encode unicode characters', () => {
      const result = buildPath('/api/$orgId/test', { orgId: 'my-org-测试' });
      expect(result).toBe('/api/my-org-%E6%B5%8B%E8%AF%95/test');
    });
  });

  describe('error cases', () => {
    it('should throw error when parameter is missing from params object', () => {
      expect(() => {
        buildPath('/api/$orgId/test', {});
      }).toThrow('Param $orgId from path /api/$orgId/test is not in the params object');
    });

    it('should throw error when multiple parameters are missing', () => {
      expect(() => {
        buildPath('/api/$orgId/$projectId/test', { orgId: 'my-org' });
      }).toThrow('Param $projectId from path /api/$orgId/$projectId/test is not in the params object');
    });

    it('should throw error when unused parameter exists in params object', () => {
      expect(() => {
        buildPath('/api/$orgId/test', {
          orgId: 'my-org',
          unusedParam: 'value',
        });
      }).toThrow('Params unusedParam from path /api/$orgId/test are not all used');
    });

    it('should throw error when multiple unused parameters exist', () => {
      expect(() => {
        buildPath('/api/$orgId/test', {
          orgId: 'my-org',
          unused1: 'value1',
          unused2: 'value2',
        });
      }).toThrow('Params unused1, unused2 from path /api/$orgId/test are not all used');
    });

    it('should handle empty path', () => {
      const result = buildPath('', {});
      expect(result).toBe('');
    });

    it('should handle path with no parameters', () => {
      const result = buildPath('/api/test', {});
      expect(result).toBe('/api/test');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string parameter', () => {
      const result = buildPath('/api/$orgId/test', { orgId: '' });
      expect(result).toBe('/api//test');
    });

    it('should handle numeric parameter values', () => {
      const result = buildPath('/api/$orgId/test', { orgId: '123' });
      expect(result).toBe('/api/123/test');
    });

    it('should handle numeric parameter values as numbers', () => {
      const result = buildPath('/api/$orgId/test', { orgId: 123 });
      expect(result).toBe('/api/123/test');
    });

    it('should handle parameter names with underscores', () => {
      const result = buildPath('/api/$org_id/test', { org_id: 'my-org' });
      expect(result).toBe('/api/my-org/test');
    });

    it('should handle multiple occurrences of same parameter pattern', () => {
      // Note: This tests that the regex correctly matches all occurrences
      const result = buildPath('/api/$orgId/$orgId/test', {
        orgId: 'my-org',
      });
      expect(result).toBe('/api/my-org/my-org/test');
    });

    it('should handle complex path with many parameters', () => {
      // This should fail because param names don't match (orgId vs orgName, projectId vs projectName)
      expect(() => {
        buildPath('/$orgId/$projectId/$assetName/$version/thumbnail', {
          orgName: 'my-org',
          projectName: 'my-project',
          assetName: 'my-asset',
          version: '1',
        });
      }).toThrow('Param $orgId from path');
    });

    it('should correctly match parameter names', () => {
      const result = buildPath('/$orgName/$projectName/$assetName/$version/thumbnail', {
        orgName: 'my-org',
        projectName: 'my-project',
        assetName: 'my-asset',
        version: '1',
      });
      expect(result).toBe('/my-org/my-project/my-asset/1/thumbnail');
    });
  });
});
