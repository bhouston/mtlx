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
