import { Pause, Play } from 'lucide-react';
import { useReducer } from 'react';
import type { AnimationMode } from '../renderingSettings.js';
import type { Viewer } from '../viewer.js';

export interface AnimationToggleProps {
  viewer: Viewer | null;
  mode?: AnimationMode;
  className?: string;
}

/** Play/pause for MaterialX `<time>`/`<frame>` nodes; renders nothing unless the document uses them. */
export function AnimationToggle({ viewer, mode, className }: AnimationToggleProps) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  if (mode === false || !viewer || !viewer.scene.animated) return null;
  const Icon = viewer.playing ? Pause : Play;
  return (
    <button
      type="button"
      aria-label={viewer.playing ? 'Pause animation' : 'Play animation'}
      aria-pressed={viewer.playing}
      className={
        className ??
        'absolute top-2 right-2 z-20 rounded border border-white/20 bg-black/60 p-1 text-white hover:bg-black/80'
      }
      onClick={() => {
        viewer.setPlaying(!viewer.playing);
        rerender();
      }}
    >
      <Icon className="size-4" />
    </button>
  );
}
