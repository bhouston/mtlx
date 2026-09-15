// Node header accent colors, grouped from the catalog's ~20 nodeGroup values into a
// handful of visually distinct buckets. Loosely modeled on Blender's node-class header
// colors (tint the header only, keep the body neutral):
// https://github.com/blender/blender/blob/main/release/datafiles/userdef/userdef_default_theme.c
const buckets: Record<string, string> = {
  math: '#6366c9',
  conditional: '#6366c9',
  adjustment: '#b8860b',
  colortransform: '#b8860b',
  channel: '#b8860b',
  procedural: '#c2703d',
  procedural2d: '#c2703d',
  procedural3d: '#c2703d',
  texture2d: '#c2703d',
  texture3d: '#c2703d',
  convolution2d: '#c2703d',
  pbr: '#4a9d5f',
  shader: '#4a9d5f',
  material: '#4a9d5f',
  light: '#4a9d5f',
  geometric: '#2f9e93',
  compositing: '#b03a5b',
  npr: '#b03a5b',
  translation: '#b03a5b',
  application: '#b03a5b',
};

export function categoryColor(nodeGroup?: string): string | undefined {
  return nodeGroup ? buckets[nodeGroup] : undefined;
}
