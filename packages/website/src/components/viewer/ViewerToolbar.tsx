import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from 'mtlx-viewer/react';
import type { ViewerSearch } from '@/lib/viewer-search';
import { LoadMaterialUrlDialog } from './LoadMaterialUrlDialog';
import { SampleMaterialsMenu } from './SampleMaterialsMenu';
import { ViewerShareMenu } from './ViewerShareMenu';

export function ViewerToolbar({
  search,
  onLoadFile,
  onLoadUrl,
}: {
  search: ViewerSearch;
  onLoadFile: (file: File) => void;
  onLoadUrl: (url: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-2 shadow-sm">
      <Button size="sm" onClick={() => fileInput.current?.click()}>
        <Upload />
        Choose file
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept=".mtlx,.zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onLoadFile(file);
          event.target.value = '';
        }}
      />
      <LoadMaterialUrlDialog materialUrl={search.materialUrl} onLoad={onLoadUrl} />
      <SampleMaterialsMenu onLoad={onLoadUrl} />
      <ViewerShareMenu key={search.materialUrl} search={search} />
    </div>
  );
}
