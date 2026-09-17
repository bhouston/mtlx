import * as ResizablePrimitive from 'react-resizable-panels';
import { cn } from 'mtlx-viewer/react';

/** shadcn-style wrappers over react-resizable-panels. */
function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn('flex h-full w-full aria-[orientation=vertical]:flex-col', className)}
      // The library's hit area extends a few px past the separator over the neighbouring panels and it
      // only preventDefaults, so a press there would also reach e.g. the 3D canvas and start an orbit.
      // Its document-level capture listener already ran, so stopping propagation here only starves the panel.
      // ponytail: relies on the hover state a prior pointermove set, so touch (no hover) still leaks; replicate the
      // library's rect+margin hit test here if that matters.
      onPointerDownCapture={(event) => {
        if (document.querySelector('[data-separator="hover"], [data-separator="active"]')) event.stopPropagation();
      }}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({ className, ...props }: ResizablePrimitive.SeparatorProps) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        // Like VS Code's sash: the hit area lights up after a short hover and stays lit while dragging.
        'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 after:bg-primary after:opacity-0 after:transition-opacity after:delay-300 data-[separator=hover]:after:opacity-100 data-[separator=active]:after:opacity-100 data-[separator=active]:after:delay-0 data-[separator=focus]:after:opacity-100 data-[separator=focus]:after:delay-0 focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2',
        className,
      )}
      {...props}
    />
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
