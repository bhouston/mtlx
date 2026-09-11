import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { ComponentProps } from 'react';
import {
  GEOMETRY_OPTIONS,
  IBL_OPTIONS,
  TONE_MAPPING_OPTIONS,
  type RenderingSettings,
  type SettingsOption,
  type ViewerSettings,
} from '../renderingSettings.js';
import { cn } from './utils.js';
export { GEOMETRY_OPTIONS, IBL_OPTIONS, type SettingsOption } from '../renderingSettings.js';

export interface ViewerSettingsPanelProps extends Omit<ComponentProps<'details'>, 'onChange'> {
  settings: ViewerSettings;
  onChange: (patch: Partial<ViewerSettings>) => void;
  geometries?: SettingsOption[];
  ibls?: SettingsOption[];
  /** Effective rotation shown in the checkbox (e.g. forced off by reduced-motion preferences). */
  rotating?: boolean;
  rotateDisabled?: boolean;
}

const selectClass = 'min-w-0 rounded border border-white/20 bg-black/70 px-1 py-1';

/** Collapsible overlay of viewer controls; native form controls so it works without extra JS or styling. */
export function ViewerSettingsPanel({
  settings,
  onChange,
  geometries = GEOMETRY_OPTIONS,
  ibls = IBL_OPTIONS,
  rotating = settings.rotate,
  rotateDisabled,
  className,
  ...props
}: ViewerSettingsPanelProps) {
  return (
    <details
      className={cn(
        'group/settings relative rounded-xl border border-white/15 bg-zinc-950/85 text-xs text-white shadow-lg backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 font-medium focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="size-4 text-white/70" />
        Viewer settings
        <ChevronDown className="ml-auto size-4 text-white/70 transition-transform group-open/settings:rotate-180" />
      </summary>
      <div className="viewer-controls grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 p-4 sm:grid-cols-3">
        <label className="flex min-w-0 items-center gap-2">
          Geometry
          <select
            aria-label="Geometry"
            className={selectClass}
            value={settings.geometry}
            onChange={(event) => onChange({ geometry: event.target.value })}
          >
            {geometries.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rotating}
            disabled={rotateDisabled}
            aria-label="Rotate"
            onChange={(event) => onChange({ rotate: event.target.checked })}
          />
          Rotate
        </label>
        <label className="flex min-w-0 items-center gap-2">
          IBL
          <select
            aria-label="IBL environment"
            className={selectClass}
            value={settings.ibl}
            onChange={(event) => onChange({ ibl: event.target.value })}
          >
            {ibls.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Tone mapping
          <select
            aria-label="Tone mapping"
            className={selectClass}
            value={settings.toneMapping}
            onChange={(event) => onChange({ toneMapping: event.target.value as RenderingSettings['toneMapping'] })}
          >
            {TONE_MAPPING_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {(['bloom', 'ao'] as const).map((effect) => (
          <label key={effect} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings[effect]}
              aria-label={effect === 'ao' ? 'Ambient occlusion' : 'Bloom'}
              onChange={(event) => onChange({ [effect]: event.target.checked })}
            />
            {effect === 'ao' ? 'AO' : 'Bloom'}
          </label>
        ))}
        <label className="flex items-center gap-2">
          Exposure ({settings.exposure.toFixed(1)} EV)
          <input
            aria-label="Exposure"
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={settings.exposure}
            onChange={(event) => onChange({ exposure: Number(event.target.value) })}
            className="w-24"
          />
        </label>
        <label className="flex items-center gap-2">
          Intensity
          <input
            aria-label="Environment intensity"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.intensity}
            onChange={(event) => onChange({ intensity: Number(event.target.value) })}
            className="w-24"
          />
        </label>
      </div>
    </details>
  );
}
