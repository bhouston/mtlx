import type { ViewerSearch } from '@/lib/viewer-search';
import { MaterialLoadControls } from './MaterialLoadControls';
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
  return (
    <MaterialLoadControls materialUrl={search.materialUrl} onLoadFile={onLoadFile} onLoadUrl={onLoadUrl}>
      <ViewerShareMenu key={search.materialUrl} search={search} />
    </MaterialLoadControls>
  );
}
