export interface MaterialSelectProps {
  names: string[];
  value: string;
  onChange: (name: string) => void;
}

/** Floating material picker for the top of a viewer frame; renders nothing for single-material documents. */
export function MaterialSelect({ names, value, onChange }: MaterialSelectProps) {
  if (names.length === 0) return null;
  return (
    <div className="absolute top-2 right-2 left-2 z-10 flex flex-wrap gap-2">
      <select
        className="min-w-0 max-w-full rounded border border-white/20 bg-black/60 px-2 py-1 text-xs text-white"
        aria-label="Material"
        value={value}
        disabled={names.length <= 1}
        onChange={(event) => onChange(event.target.value)}
      >
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
