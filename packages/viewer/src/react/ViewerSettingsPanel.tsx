import { Settings, X } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
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

export interface ViewerSettingsPanelProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  settings: ViewerSettings;
  onChange: (patch: Partial<ViewerSettings>) => void;
  geometries?: SettingsOption[];
  ibls?: SettingsOption[];
  /** Effective rotation shown in the checkbox (e.g. forced off by reduced-motion preferences). */
  rotating?: boolean;
  rotateDisabled?: boolean;
}

const selectClass = 'min-w-0 rounded border border-white/20 bg-black/70 px-1 py-1';

/** Gear button in the viewer's bottom-right corner that opens a popover of viewer controls; closes on X, Escape or a click outside. */
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
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
  return (
    <div
      ref={root}
      className={cn('pointer-events-none absolute inset-3 z-10 ml-auto max-w-md text-xs text-white', className)}
      {...props}
    >
      <button
        type="button"
        aria-label="Viewer settings"
        aria-expanded={open}
        title="Viewer settings"
        onClick={() => setOpen((current) => !current)}
        className="pointer-events-auto absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full border border-white/15 bg-zinc-950/85 text-white/80 shadow-lg backdrop-blur-xl hover:bg-zinc-800/90 hover:text-white focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Settings className="size-4" />
      </button>
      <div
        hidden={!open}
        className="viewer-controls pointer-events-auto absolute right-0 bottom-11 max-h-[calc(100%-2.75rem)] w-full overflow-y-auto rounded-xl border border-white/15 bg-zinc-950/85 shadow-lg backdrop-blur-xl"
      >
        <div className="flex items-center gap-2 px-4 py-2 font-medium">
          Viewer settings
          <button
            type="button"
            aria-label="Close viewer settings"
            onClick={() => setOpen(false)}
            className="ml-auto rounded p-1 text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 p-4 sm:grid-cols-3">
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.background !== 'none'}
              aria-label="Background"
              onChange={(event) => onChange({ background: event.target.checked ? 'environment' : 'none' })}
            />
            Background
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
      </div>
    </div>
  );
}
