import { MaterialLoadingOverlay } from './MaterialLoadingOverlay';
import { lazy, Suspense } from 'react';
import type { MaterialViewerProps } from './MaterialViewer';

const LazyMaterialViewer = lazy(() =>
  import('./MaterialViewer').then((module) => ({ default: module.MaterialViewer })),
);

const Fallback = (props: MaterialViewerProps) => (
  <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-black">
    <MaterialLoadingOverlay progress={props.loadProgress ?? { value: 5, label: 'Loading viewer…' }} />
  </div>
);

/** MaterialViewer, code-split so the three.js viewer chunk isn't in the route's initial bundle. */
export function MaterialViewer(props: MaterialViewerProps) {
  return (
    <Suspense fallback={<Fallback {...props} />}>
      <LazyMaterialViewer {...props} />
    </Suspense>
  );
}

export type { MaterialSource, MaterialViewerProps } from './MaterialViewer';
