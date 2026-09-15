import { useRef, type ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadMaterialUrlDialog } from './LoadMaterialUrlDialog';
import { SampleMaterialsMenu } from './SampleMaterialsMenu';

/** Shared file, URL and sample controls. Hosts supply their own share/export actions. */
export function MaterialLoadControls({
  materialUrl,
  onLoadFile,
  onLoadUrl,
  children,
}: {
  materialUrl?: string;
  onLoadFile: (file: File) => void;
  onLoadUrl: (url: string) => void;
  children?: ReactNode;
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
        aria-label="Open material"
        type="file"
        accept=".mtlx,.zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onLoadFile(file);
          event.target.value = '';
        }}
      />
      <LoadMaterialUrlDialog materialUrl={materialUrl} onLoad={onLoadUrl} />
      <SampleMaterialsMenu onLoad={onLoadUrl} />
      {children}
    </div>
  );
}
