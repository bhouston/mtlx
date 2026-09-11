// Hand-picked, non-overlapping subset of github.com/bhouston/material-samples' showcase
// materials (that repo has 3 overlapping showcase categories; these names don't repeat).
export interface PresetMaterial {
  category: 'standard_surface' | 'open_pbr_surface' | 'gltf_pbr';
  name: string;
}

export const PRESET_MATERIALS: PresetMaterial[] = [
  { category: 'standard_surface', name: 'copper' },
  { category: 'standard_surface', name: 'chrome' },
  { category: 'standard_surface', name: 'wood_grain' },
  { category: 'standard_surface', name: 'onyx_hextiled' },
  { category: 'standard_surface', name: 'sheen' },
  { category: 'open_pbr_surface', name: 'honey' },
  { category: 'open_pbr_surface', name: 'ketchup' },
  { category: 'open_pbr_surface', name: 'lightbulb' },
  { category: 'open_pbr_surface', name: 'pearl' },
  { category: 'open_pbr_surface', name: 'soapbubble' },
  { category: 'gltf_pbr', name: 'glass_dispersion' },
];

const RAW_BASE = 'https://raw.githubusercontent.com/bhouston/material-samples/main/materials/showcase';

/** Folder URL containing `${name}.mtlx` plus any textures it references relatively. */
export const presetFolderUrl = (preset: PresetMaterial): string => `${RAW_BASE}/${preset.category}/${preset.name}/`;

export const presetFileName = (preset: PresetMaterial): string => `${preset.name}.mtlx`;

/** Stable id used in the `material` URL query param and the dropdown value. */
export const presetId = (preset: PresetMaterial): string => `${preset.category}/${preset.name}`;

export const findPresetById = (id: string): PresetMaterial | undefined =>
  PRESET_MATERIALS.find((preset) => presetId(preset) === id);

/**
 * Resolves a `material` query param value to a folder/file URL pair.
 * Accepts either a known preset id (`category/name`) or an externally-hosted
 * `.mtlx` file URL (http/https), so a shared link can point at any material.
 */
export const resolveMaterialParam = (value: string): { folderUrl: string; fileName: string } | undefined => {
  const preset = findPresetById(value);
  if (preset) return { folderUrl: presetFolderUrl(preset), fileName: presetFileName(preset) };
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !/\.mtlx(\.zip)?$/i.test(url.pathname)) return undefined;
    const lastSlash = url.pathname.lastIndexOf('/');
    const fileName = url.pathname.slice(lastSlash + 1) + url.search + url.hash;
    url.pathname = url.pathname.slice(0, lastSlash + 1);
    url.search = '';
    url.hash = '';
    return { folderUrl: url.href, fileName };
  } catch {
    return undefined;
  }
};

/** Canonical URL used for both presets and external materials. */
export const presetUrl = (preset: PresetMaterial): string => presetFolderUrl(preset) + presetFileName(preset);

/** Accept old shared preset-id links while exposing one canonical URL to the UI. */
export const materialSearch = (search: Record<string, unknown>): { materialUrl?: string } => {
  const value =
    typeof search.materialUrl === 'string'
      ? search.materialUrl
      : typeof search.material === 'string'
        ? search.material
        : undefined;
  if (!value) return {};
  const resolved = resolveMaterialParam(value);
  return { materialUrl: resolved ? resolved.folderUrl + resolved.fileName : value };
};
