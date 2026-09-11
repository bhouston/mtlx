import { TONE_MAPPING_OPTIONS, type RenderingSettings } from 'mtlx-viewer/settings';
export const PREVIEW_NAME_PATTERN = '^[a-zA-Z_][a-zA-Z0-9_]*$';
export interface NamedPreviewAsset {
  name: string;
  source: string;
}
export interface PreviewSettings extends RenderingSettings {
  ibls: NamedPreviewAsset[];
  geometries: NamedPreviewAsset[];
  defaultIbl: string;
  defaultGeometry: string;
  autoRotate: boolean;
  warnings: string[];
}

/** Validate configuration at runtime as well as in VS Code's settings editor. */
export function parsePreviewSettings(input: Record<string, unknown>): PreviewSettings {
  const warnings: string[] = [];
  const namePattern = new RegExp(PREVIEW_NAME_PATTERN);
  const assets = (key: string, reserved: string[]) => {
    const result: NamedPreviewAsset[] = [];
    const used = new Set(reserved);
    const values = input[key] ?? [];
    if (!Array.isArray(values)) {
      warnings.push(`${key} must be an array.`);
      return result;
    }
    for (const entry of values) {
      if (
        !entry ||
        typeof entry.name !== 'string' ||
        !namePattern.test(entry.name) ||
        typeof entry.source !== 'string' ||
        !entry.source.trim()
      ) {
        warnings.push(`${key}: each entry needs a name matching ${PREVIEW_NAME_PATTERN} and a nonempty source.`);
      } else if (used.has(entry.name)) warnings.push(`${key}: duplicate or reserved name "${entry.name}".`);
      else {
        used.add(entry.name);
        result.push({ name: entry.name, source: entry.source.trim() });
      }
    }
    return result;
  };
  const ibls = assets('ibls', ['studio', 'bridge']);
  const geometries = assets('geometries', ['totem', 'sphere', 'plane']);
  const defaultName = (key: string, names: string[], fallback: string) => {
    const value = input[key] ?? fallback;
    if (typeof value === 'string' && names.includes(value)) return value;
    warnings.push(`${key}: unknown name "${String(value)}"; using ${fallback}.`);
    return fallback;
  };
  const boolean = (key: string) => {
    if (input[key] !== undefined && typeof input[key] !== 'boolean')
      warnings.push(`${key} must be a boolean; using true.`);
    return typeof input[key] === 'boolean' ? input[key] : true;
  };
  const toneMapping = TONE_MAPPING_OPTIONS.find((option) => option.value === (input.toneMapping ?? 'neutral'))?.value;
  if (!toneMapping) warnings.push('toneMapping is unknown; using neutral.');
  return {
    ibls,
    geometries,
    defaultIbl: defaultName('defaultIbl', ['studio', 'bridge', ...ibls.map((asset) => asset.name)], 'bridge'),
    defaultGeometry: defaultName(
      'defaultGeometry',
      ['totem', 'sphere', 'plane', ...geometries.map((asset) => asset.name)],
      'totem',
    ),
    autoRotate: boolean('autoRotate'),
    bloom: boolean('bloom'),
    ao: boolean('ao'),
    toneMapping: toneMapping ?? 'neutral',
    warnings,
  };
}
