import { useEffect, useRef, type CSSProperties } from 'react';
import type { MaterialProgress } from '../progress.js';

export interface MaterialViewerProps {
  src?: string;
  model?: string;
  ibl?: string;
  geometry?: string;
  material?: string;
  rotate?: 'false' | 'true';
  bloom?: 'false' | 'true';
  ao?: 'false' | 'true';
  background?: 'environment' | 'none';
  'tone-mapping'?: string;
  exposure?: number;
  intensity?: number;
  animation?: 'play' | 'pause' | 'false';
  'settings-panel'?: 'open' | 'closed' | 'hidden';
  errors?: 'silent';
  id?: string;
  className?: string;
  style?: CSSProperties;
  onProgress?: (progress: MaterialProgress) => void;
  /** The preview is ready, after downloading and initializing the renderer. */
  onLoad?: () => void;
  onError?: (message: string) => void;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'material-viewer': import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLElement>, HTMLElement> &
        Omit<MaterialViewerProps, 'onProgress' | 'onLoad' | 'onError'>;
    }
  }
}

/** React wrapper for `<material-viewer>`, with the same attributes and optional callbacks. */
export function MaterialViewer({ src, onProgress, onLoad, onError, ...attributes }: MaterialViewerProps) {
  const element = useRef<HTMLElement>(null);
  const callbacks = useRef({ onProgress, onLoad, onError });
  useEffect(() => {
    callbacks.current = { onProgress, onLoad, onError };
  });
  useEffect(() => {
    const target = element.current!;
    let active = true;
    const progress = (event: Event) => callbacks.current.onProgress?.((event as CustomEvent<MaterialProgress>).detail);
    const load = () => callbacks.current.onLoad?.();
    const error = (event: Event) => callbacks.current.onError?.((event as CustomEvent<string>).detail);
    target.addEventListener('progress', progress);
    target.addEventListener('load', load);
    target.addEventListener('error', error);
    // Register only in the browser, keeping the React entry safe to import during SSR.
    void import('../element.js')
      .then(() => {
        if (active && src) target.setAttribute('src', src);
      })
      .catch((reason: unknown) => {
        if (active) callbacks.current.onError?.(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      active = false;
      target.removeEventListener('progress', progress);
      target.removeEventListener('load', load);
      target.removeEventListener('error', error);
      target.removeAttribute('src');
    };
  }, [src]);
  return <material-viewer {...attributes} ref={element} />;
}

export type { MaterialProgress } from '../progress.js';
