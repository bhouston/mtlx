import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function MaterialDropZone({
  onLoadFile,
  children,
  className,
}: {
  onLoadFile: (file: File) => void;
  children: ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  return (
    <div
      className={cn('min-w-0 rounded-lg', active && 'outline-2 outline-offset-4 outline-primary', className)}
      onDragOver={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setActive(false);
        const file = event.dataTransfer.files[0];
        if (file) onLoadFile(file);
      }}
    >
      {children}
    </div>
  );
}
