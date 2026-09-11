import { DEFAULT_VIEWER_SETTINGS, parseViewerSettings } from 'mtlx-viewer/settings';
import { materialSearch } from './presets';

export { DEFAULT_VIEWER_SETTINGS, type ViewerSettings } from 'mtlx-viewer/settings';
import type { ViewerSettings } from 'mtlx-viewer/settings';
export type ViewerSearch = Partial<ViewerSettings> & { materialUrl?: string };

/** Shared by the standalone viewer and embeds. Invalid values fall back to defaults. */
export function viewerSearch(search: Record<string, unknown>): ViewerSearch {
  return { ...materialSearch(search), ...(parseViewerSettings(search) as Partial<ViewerSettings>) };
}

export function viewerSettings(search: ViewerSearch): ViewerSettings {
  return { ...DEFAULT_VIEWER_SETTINGS, ...search };
}

export function viewerShareUrl(origin: string, route: 'viewer' | 'embed', search: ViewerSearch): string {
  const url = new URL(`/${route}`, origin);
  for (const [key, value] of Object.entries(viewerSearch(search))) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.href;
}
