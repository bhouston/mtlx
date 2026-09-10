import { useEffect, useRef } from 'react';

export interface LogPanelProps {
  lines: string[];
}

// Mirrors the VS Code extension's #log bar (src/mtlxPreviewProvider.ts) — every loading step and
// error surfaces here, not just in the browser devtools console.
export function LogPanel({ lines }: LogPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run purely to scroll on new lines
  }, [lines.length]);

  return (
    <div
      ref={logRef}
      className="h-28 overflow-auto rounded-lg border border-border bg-card p-2 font-mono text-xs text-muted-foreground"
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
