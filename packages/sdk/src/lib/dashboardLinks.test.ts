import { describe, expect, it } from 'vitest';
import {
  dashboardAssetCommentLink,
  dashboardAssetCommentLinkRegex,
  dashboardAssetLink,
  dashboardAssetLinkRegex,
  dashboardSettingsInvitesLink,
  dashboardSettingsInvitesLinkRegex,
  dashboardUserLink,
  dashboardUserLinkRegex,
  validDashboardLinkTargets,
} from './dashboardLinks.js';

describe('dashboardLinks', () => {
  describe('dashboardUserLink', () => {
    it('produces path matching dashboardUserLinkRegex', () => {
      const path = dashboardUserLink({ userName: 'MyUser' });
      expect(path).toBe('/MyUser');
      expect(dashboardUserLinkRegex.test(path)).toBe(true);
    });

    it('handles kebab-case user names', () => {
      const path = dashboardUserLink({ userName: 'my-user' });
      expect(path).toBe('/my-user');
      expect(dashboardUserLinkRegex.test(path)).toBe(true);
    });

    it('throws for invalid user name', () => {
      expect(() => dashboardUserLink({ userName: '' })).toThrow('Invalid dashboard link');
      expect(() => dashboardUserLink({ userName: '123' })).toThrow('Invalid dashboard link');
      expect(() => dashboardUserLink({ userName: '-invalid' })).toThrow('Invalid dashboard link');
    });
  });

  describe('dashboardAssetLink', () => {
    it('produces path matching dashboardAssetLinkRegex', () => {
      const path = dashboardAssetLink({
        userName: 'MyUser',
        assetName: 'MyAsset',
      });
      expect(path).toBe('/MyUser/MyAsset');
      expect(dashboardAssetLinkRegex.test(path)).toBe(true);
    });

    it('handles kebab-case names', () => {
      const path = dashboardAssetLink({
        userName: 'my-user',
        assetName: 'my-asset',
      });
      expect(path).toBe('/my-user/my-asset');
      expect(dashboardAssetLinkRegex.test(path)).toBe(true);
    });

    it('throws for invalid names', () => {
      expect(() =>
        dashboardAssetLink({
          userName: 'user',
          assetName: '',
        }),
      ).toThrow('Invalid dashboard link');
    });
  });

  describe('dashboardAssetCommentLink', () => {
    it('produces path matching dashboardAssetCommentLinkRegex', () => {
      const path = dashboardAssetCommentLink({
        userName: 'MyUser',
        assetName: 'MyAsset',
        commentHash: 'test',
      });
      expect(path).toBe('/MyUser/MyAsset#comment-test');
      expect(dashboardAssetCommentLinkRegex.test(path)).toBe(true);
    });

    it('handles comment hash with alphanumeric id', () => {
      const path = dashboardAssetCommentLink({
        userName: 'user',
        assetName: 'asset',
        commentHash: 'c123',
      });
      expect(path).toBe('/user/asset#comment-c123');
      expect(dashboardAssetCommentLinkRegex.test(path)).toBe(true);
    });

    it('handles numeric comment ids', () => {
      const path = dashboardAssetCommentLink({
        userName: 'user',
        assetName: 'asset',
        commentHash: '123',
      });
      expect(path).toBe('/user/asset#comment-123');
      expect(dashboardAssetCommentLinkRegex.test(path)).toBe(true);
    });

    it('throws for invalid comment hash', () => {
      expect(() =>
        dashboardAssetCommentLink({
          userName: 'user',
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
        '/MyUser',
        '/my-user/my-asset',
        '/my-user/my-asset#comment-test',
        '/my-user/my-asset#comment-123',
        '/settings/invites',
      ];
      for (const path of validPaths) {
        const matches = validDashboardLinkTargets.some((regex) => regex.test(path));
        expect(matches).toBe(true);
      }
    });

    it('rejects invalid paths', () => {
      const invalidPaths = [
        '/123', // user name must start with letter
        '/user/asset/', // trailing slash
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
