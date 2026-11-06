import type { CameraSettings } from '../cameraSettings.js';
import { Children, isValidElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { MaterialViewerProgress } from '../element.js';

export interface MaterialViewerProps {
  src?: string;
  model?: string;
  ibl?: string;
  geometry?: string;
  'camera-orbit'?: string;
  'camera-target'?: string;
  'field-of-view'?: number | string;
  material?: string;
  rotate?: 'false' | 'true';
  bloom?: 'false' | 'true';
  ao?: 'false' | 'true';
  background?: 'white' | 'environment' | 'none';
  'tone-mapping'?: string;
  exposure?: number;
  intensity?: number;
  animation?: 'play' | 'pause' | 'false';
  'settings-panel'?: 'open' | 'closed' | 'hidden';
  errors?: 'silent';
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Children may include an empty or custom `slot="progress-bar"` element. */
  children?: ReactNode;
  onProgress?: (progress: MaterialViewerProgress) => void;
  /** The preview is ready, after downloading and initializing the renderer. */
  onLoad?: () => void;
  onCameraChange?: (settings: Required<CameraSettings>) => void;
  onError?: (message: string) => void;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'material-viewer': import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLElement>, HTMLElement> &
        Omit<MaterialViewerProps, 'onProgress' | 'onLoad' | 'onError' | 'onCameraChange'>;
    }
  }
}

/** React wrapper for `<material-viewer>`, with the same attributes and optional callbacks. */
export function MaterialViewer({
  src,
  onProgress,
  onLoad,
  onError,
  onCameraChange,
  children,
  ...attributes
}: MaterialViewerProps) {
  const [registered, setRegistered] = useState(false);
  const element = useRef<HTMLElement>(null);
  const callbacks = useRef({ onProgress, onLoad, onError, onCameraChange });
  useEffect(() => {
    callbacks.current = { onProgress, onLoad, onError, onCameraChange };
  });
  useEffect(() => {
    const target = element.current!;
    let active = true;
    const progress = (event: Event) =>
      callbacks.current.onProgress?.((event as CustomEvent<MaterialViewerProgress>).detail);
    const load = () => callbacks.current.onLoad?.();
    const error = (event: Event) => callbacks.current.onError?.((event as CustomEvent<string>).detail);
    const camera = (event: Event) =>
      callbacks.current.onCameraChange?.((event as CustomEvent<Required<CameraSettings>>).detail);
    target.addEventListener('camera-change', camera);
    target.addEventListener('progress', progress);
    target.addEventListener('load', load);
    target.addEventListener('error', error);
    // Register only in the browser, keeping the React entry safe to import during SSR.
    void import('../element.js')
      .then(() => {
        if (!active) return;
        setRegistered(true);
        if (src) target.setAttribute('src', src);
      })
      .catch((reason: unknown) => {
        if (active) {
          setRegistered(true);
          callbacks.current.onError?.(reason instanceof Error ? reason.message : String(reason));
        }
      });
    return () => {
      active = false;
      target.removeEventListener('camera-change', camera);
      target.removeEventListener('progress', progress);
      target.removeEventListener('load', load);
      target.removeEventListener('error', error);
      target.removeAttribute('src');
    };
  }, [src]);
  const replaced = Children.toArray(children).some(
    (child) => isValidElement<{ slot?: string }>(child) && child.props.slot === 'progress-bar',
  );
  return (
    <material-viewer
      {...attributes}
      style={{ position: 'relative', display: 'block', ...attributes.style }}
      ref={element}
    >
      {children}
      {src && !registered && !replaced ? (
        <span
          slot="progress-bar"
          aria-label="Loading material viewer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '2%',
            pointerEvents: 'none',
            height: 'var(--progress-bar-height, 5px)',
            backgroundColor: 'var(--progress-bar-color, rgba(0, 0, 0, 0.4))',
          }}
        />
      ) : null}
    </material-viewer>
  );
}

export type { MaterialProgress } from '../progress.js';
export type { MaterialViewerProgress } from '../element.js';
