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
