/** Tone mapping names shared by viewer controls and extension configuration. */
export const TONE_MAPPING_OPTIONS = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'aces', label: 'ACES Filmic' },
  { value: 'agx', label: 'AgX' },
  { value: 'reinhard', label: 'Reinhard' },
  { value: 'cineon', label: 'Cineon' },
  { value: 'linear', label: 'Linear' },
  { value: 'none', label: 'None' },
] as const;
export type ToneMappingName = (typeof TONE_MAPPING_OPTIONS)[number]['value'];
export interface RenderingSettings {
  bloom: boolean;
  ao: boolean;
  toneMapping: ToneMappingName;
}
export const DEFAULT_RENDERING_SETTINGS: RenderingSettings = { bloom: true, ao: true, toneMapping: 'neutral' };

export interface SettingsOption {
  value: string;
  label: string;
}
export const GEOMETRY_OPTIONS: SettingsOption[] = [
  { value: 'totem', label: 'Totem' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'plane', label: 'Plane' },
];
export const IBL_OPTIONS: SettingsOption[] = [
  { value: 'studio', label: 'Studio' },
  { value: 'bridge', label: 'San Giuseppe Bridge' },
];

export const DEFAULT_VIEWER_SETTINGS = {
  ibl: 'bridge' as 'bridge' | 'studio',
  ...DEFAULT_RENDERING_SETTINGS,
  intensity: 1,
  exposure: 0,
  rotate: false,
  materialName: '',
  geometry: 'totem' as 'totem' | 'sphere' | 'plane',
};
/** Asset names may include host-configured environments and geometries. */
export type ViewerSettings = Omit<typeof DEFAULT_VIEWER_SETTINGS, 'ibl' | 'geometry'> & {
  ibl: string;
  geometry: string;
};

export function parseViewerSettings(
  input: Record<string, unknown>,
  assets: { ibls?: readonly string[]; geometries?: readonly string[] } = {},
): Partial<ViewerSettings> {
  const result: Partial<ViewerSettings> = {};
  if (typeof input.materialName === 'string' && input.materialName) result.materialName = input.materialName;
  for (const key of ['bloom', 'ao', 'rotate'] as const) {
    if (input[key] === true || input[key] === 'true') result[key] = true;
    if (input[key] === false || input[key] === 'false') result[key] = false;
  }
  for (const [key, min, max] of [
    ['intensity', 0, 2],
    ['exposure', -2, 2],
  ] as const) {
    const raw = input[key];
    const value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
    if (Number.isFinite(value)) result[key] = Math.min(max, Math.max(min, value));
  }
  if (typeof input.ibl === 'string' && ['bridge', 'studio', ...(assets.ibls ?? [])].includes(input.ibl))
    result.ibl = input.ibl;
  if (
    typeof input.geometry === 'string' &&
    ['totem', 'sphere', 'plane', ...(assets.geometries ?? [])].includes(input.geometry)
  )
    result.geometry = input.geometry;
  const toneMapping = TONE_MAPPING_OPTIONS.find(({ value }) => value === input.toneMapping);
  if (toneMapping) result.toneMapping = toneMapping.value;
  return result;
}
