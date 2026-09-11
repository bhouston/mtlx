import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWER_SETTINGS, viewerSearch, viewerSettings, viewerShareUrl } from './viewer-search';

describe('shared viewer and embed search state', () => {
  it('round-trips every rendering setting and nested material URL in either route', () => {
    const state = {
      materialUrl: 'https://example.com/a.mtlx.zip?key=a&v=2',
      ibl: 'studio' as const,
      bloom: false,
      ao: false,
      intensity: 0.7,
      toneMapping: 'agx' as const,
      exposure: -1.2,
      rotate: true,
      geometry: 'sphere' as const,
      materialName: 'Copper',
    };
    for (const route of ['viewer', 'embed'] as const) {
      const url = new URL(viewerShareUrl('https://mtlx.test', route, state));
      expect(url.pathname).toBe(`/${route}`);
      expect(viewerSearch(Object.fromEntries(url.searchParams))).toEqual(state);
    }
  });
  it('rejects invalid enums and booleans, clamps finite numbers, and ignores non-numbers', () => {
    expect(
      viewerSearch({
        ibl: 'bad',
        geometry: 'bad',
        toneMapping: 'bad',
        rotate: 'no',
        bloom: false,
        intensity: 20,
        exposure: '-20',
      }),
    ).toEqual({ bloom: false, intensity: 2, exposure: -2 });
    for (const value of ['', ' ', true, null, Infinity, 'NaN', {}, []]) {
      expect(viewerSearch({ intensity: value, exposure: value })).toEqual({});
    }
  });
  it('uses consistent defaults and preserves legacy material links', () => {
    expect(viewerSettings(viewerSearch({}))).toEqual(DEFAULT_VIEWER_SETTINGS);
    expect(viewerSearch({ material: 'local/compound', rotate: 'false' })).toEqual({
      materialUrl: '/materials/compound/compound.mtlx',
      rotate: false,
    });
  });
});
