import type { MaterialLoadProgress } from '@/lib/material-load';

/** Automatic top progress bar, matching the <material-viewer> default. */
export function MaterialLoadingOverlay({ progress }: { progress: MaterialLoadProgress | null }) {
  const value = progress ? Math.min(0.99, Math.max(0.02, progress.value / 100)) : 1;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div
        key={progress ? 'loading' : 'complete'}
        // A custom fill is needed for transform-based animation and CSS variables.
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="progressbar"
        aria-label="Loading material preview"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-valuetext={progress?.label}
        aria-hidden={!progress}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'var(--progress-bar-height, 5px)',
          backgroundColor: 'var(--progress-bar-color, rgba(0, 0, 0, 0.4))',
          transformOrigin: 'top left',
          transform: `scaleX(${value})`,
          opacity: progress ? 1 : 0,
          transition: progress ? 'transform 0.09s' : 'opacity 0.3s 1s',
        }}
      />
    </div>
  );
}
