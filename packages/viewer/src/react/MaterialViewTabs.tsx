import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';
import { cn } from './utils.js';

/** Shared shadcn/ui tabs. Keep the preview mounted to preserve its scene and camera. */
export function MaterialViewTabs({
  preview,
  graph,
  className,
}: {
  preview: ReactNode;
  graph: ReactNode;
  className?: string;
}) {
  return (
    <Tabs defaultValue="preview" className={cn('min-h-0 min-w-0 gap-3', className)}>
      <TabsList aria-label="Material view">
        <TabsTrigger value="preview">3D Preview</TabsTrigger>
        <TabsTrigger value="graph">Graph</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" forceMount className="material-view-panel data-[state=inactive]:hidden">
        {preview}
      </TabsContent>
      <TabsContent value="graph" className="material-view-panel material-view-graph-panel">
        {graph}
      </TabsContent>
    </Tabs>
  );
}
