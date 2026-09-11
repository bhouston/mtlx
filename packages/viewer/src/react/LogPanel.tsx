import { useEffect, useRef, type ComponentProps } from 'react';
import { cn } from './utils.js';

export interface LogPanelProps extends ComponentProps<'div'> {
  lines: string[];
}

// Every loading step and error surfaces here, not just in the devtools console.
export function LogPanel({ lines, className, ...props }: LogPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run purely to scroll on new lines
  }, [lines.length]);

  return (
    <div
      ref={logRef}
      className={cn(
        'h-28 overflow-auto rounded-lg border border-border bg-card p-2 font-mono text-xs text-muted-foreground',
        className,
      )}
      {...props}
    >
      {lines.length === 0 ? (
        <p className="text-muted-foreground/60">No messages yet.</p>
      ) : (
        lines.map((line, index) => (
          <div key={index} className={line.startsWith('ERROR:') ? 'text-destructive' : undefined}>
            {line}
          </div>
        ))
      )}
    </div>
  );
}
