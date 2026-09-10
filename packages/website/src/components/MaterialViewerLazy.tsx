import { lazy, Suspense } from 'react';
import type { MaterialViewerProps } from './MaterialViewer';

const LazyMaterialViewer = lazy(() =>
  import('./MaterialViewer').then((module) => ({ default: module.MaterialViewer })),
);

const Fallback = () => (
  <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-black">
    <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">Loading viewer…</div>
  </div>
);

/** MaterialViewer, code-split so the three.js viewer chunk isn't in the route's initial bundle. */
export function MaterialViewer(props: MaterialViewerProps) {
  return (
    <Suspense fallback={<Fallback />}>
      <LazyMaterialViewer {...props} />
    </Suspense>
  );
}

export type { MaterialSource, MaterialViewerProps } from './MaterialViewer';
