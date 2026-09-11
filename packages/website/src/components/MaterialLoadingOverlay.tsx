import { Progress } from '@/components/ui/progress';
import type { MaterialLoadProgress } from '@/lib/material-load';

export function MaterialLoadingOverlay({ progress }: { progress: MaterialLoadProgress }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-xs space-y-3">
        <output className="block text-center text-sm text-white">{progress.label}</output>
        <Progress value={progress.value} aria-label="Loading material" aria-valuetext={progress.label} />
      </div>
    </div>
  );
}
