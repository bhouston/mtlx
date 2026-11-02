import { describe, expect, it } from 'vitest';
import {
  dashboardAssetCommentLink,
  dashboardAssetCommentLinkRegex,
  dashboardAssetLink,
  dashboardAssetLinkRegex,
  dashboardOrgLink,
  dashboardOrgLinkRegex,
  dashboardProjectLink,
  dashboardProjectLinkRegex,
  dashboardSettingsInvitesLink,
  dashboardSettingsInvitesLinkRegex,
  validDashboardLinkTargets,
} from './dashboardLinks.js';

describe('dashboardLinks', () => {
  describe('dashboardOrgLink', () => {
    it('produces path matching dashboardOrgLinkRegex', () => {
      const path = dashboardOrgLink({ orgName: 'MyOrg' });
      expect(path).toBe('/MyOrg');
      expect(dashboardOrgLinkRegex.test(path)).toBe(true);
    });

    it('handles kebab-case org names', () => {
      const path = dashboardOrgLink({ orgName: 'my-org' });
      expect(path).toBe('/my-org');
      expect(dashboardOrgLinkRegex.test(path)).toBe(true);
    });

    it('throws for invalid org name', () => {
      expect(() => dashboardOrgLink({ orgName: '' })).toThrow('Invalid dashboard link');
      expect(() => dashboardOrgLink({ orgName: '123' })).toThrow('Invalid dashboard link');
      expect(() => dashboardOrgLink({ orgName: '-invalid' })).toThrow('Invalid dashboard link');
    });
  });

  describe('dashboardProjectLink', () => {
    it('produces path matching dashboardProjectLinkRegex', () => {
      const path = dashboardProjectLink({ orgName: 'MyOrg', projectName: 'MyProject' });
      expect(path).toBe('/MyOrg/MyProject');
      expect(dashboardProjectLinkRegex.test(path)).toBe(true);
    });

    it('handles kebab-case names', () => {
      const path = dashboardProjectLink({ orgName: 'my-org', projectName: 'my-project' });
      expect(path).toBe('/my-org/my-project');
      expect(dashboardProjectLinkRegex.test(path)).toBe(true);
    });

    it('throws for invalid names', () => {
      expect(() => dashboardProjectLink({ orgName: '', projectName: 'project' })).toThrow('Invalid dashboard link');
      expect(() => dashboardProjectLink({ orgName: 'org', projectName: '123' })).toThrow('Invalid dashboard link');
    });
  });

  describe('dashboardAssetLink', () => {
    it('produces path matching dashboardAssetLinkRegex', () => {
      const path = dashboardAssetLink({
        orgName: 'MyOrg',
        projectName: 'MyProject',
        assetName: 'MyAsset',
      });
      expect(path).toBe('/MyOrg/MyProject/assets/MyAsset');
      expect(dashboardAssetLinkRegex.test(path)).toBe(true);
    });

    it('handles kebab-case names', () => {
      const path = dashboardAssetLink({
        orgName: 'my-org',
        projectName: 'my-project',
        assetName: 'my-asset',
      });
      expect(path).toBe('/my-org/my-project/assets/my-asset');
      expect(dashboardAssetLinkRegex.test(path)).toBe(true);
    });

    it('throws for invalid names', () => {
      expect(() =>
        dashboardAssetLink({
          orgName: 'org',
          projectName: 'project',
          assetName: '',
        }),
      ).toThrow('Invalid dashboard link');
    });
  });

  describe('dashboardAssetCommentLink', () => {
    it('produces path matching dashboardAssetCommentLinkRegex', () => {
      const path = dashboardAssetCommentLink({
        orgName: 'MyOrg',
        projectName: 'MyProject',
        assetName: 'MyAsset',
        commentHash: 'test',
      });
      expect(path).toBe('/MyOrg/MyProject/assets/MyAsset#comment-test');
      expect(dashboardAssetCommentLinkRegex.test(path)).toBe(true);
    });

    it('handles comment hash with alphanumeric id', () => {
      const path = dashboardAssetCommentLink({
        orgName: 'org',
        projectName: 'project',
        assetName: 'asset',
        commentHash: 'c123',
      });
      expect(path).toBe('/org/project/assets/asset#comment-c123');
      expect(dashboardAssetCommentLinkRegex.test(path)).toBe(true);
    });

    it('handles numeric comment ids', () => {
      const path = dashboardAssetCommentLink({
        orgName: 'org',
        projectName: 'project',
        assetName: 'asset',
        commentHash: '123',
      });
      expect(path).toBe('/org/project/assets/asset#comment-123');
      expect(dashboardAssetCommentLinkRegex.test(path)).toBe(true);
    });

    it('throws for invalid comment hash', () => {
      expect(() =>
        dashboardAssetCommentLink({
          orgName: 'org',
          projectName: 'project',
          assetName: 'asset',
          commentHash: '',
        }),
      ).toThrow('Invalid dashboard link');
    });
  });

  describe('dashboardSettingsInvitesLink', () => {
    it('returns /settings/invites and matches regex', () => {
      const path = dashboardSettingsInvitesLink();
      expect(path).toBe('/settings/invites');
      expect(dashboardSettingsInvitesLinkRegex.test(path)).toBe(true);
    });
  });

  describe('validDashboardLinkTargets', () => {
    it('accepts all valid dashboard link formats', () => {
      const validPaths = [
        '/MyOrg',
        '/my-org/my-project',
        '/my-org/my-project/assets/my-asset',
        '/my-org/my-project/assets/my-asset#comment-test',
        '/my-org/my-project/assets/my-asset#comment-123',
        '/settings/invites',
      ];
      for (const path of validPaths) {
        const matches = validDashboardLinkTargets.some((regex) => regex.test(path));
        expect(matches).toBe(true);
      }
    });

    it('rejects invalid paths', () => {
      const invalidPaths = [
        '/123', // org name must start with letter
        '/org/project/assets', // asset name missing
        '/org/project/assets/', // trailing slash
        'not-a-path', // no leading slash
        '',
      ];
      for (const path of invalidPaths) {
        const matches = validDashboardLinkTargets.some((regex) => regex.test(path));
        expect(matches).toBe(false);
      }
    });
  });
});
