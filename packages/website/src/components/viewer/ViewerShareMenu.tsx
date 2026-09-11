import { useState } from 'react';
import { Share2, Copy, Link2, Code } from 'lucide-react';
import { Button } from 'mtlx-viewer/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { viewerShareUrl, viewerSettings, type ViewerSearch } from '@/lib/viewer-search';

export function ViewerShareMenu({ search }: { search: ViewerSearch }) {
  const [message, setMessage] = useState('');
  const shareUrl = (route: 'viewer' | 'embed') =>
    viewerShareUrl(window.location.origin, route, { ...viewerSettings(search), materialUrl: search.materialUrl });
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied to clipboard.');
    } catch {
      setMessage('Clipboard unavailable.');
    }
  };
  return (
    <div className="ml-auto flex items-center gap-2">
      <output className={message ? 'text-xs text-muted-foreground' : 'sr-only'}>{message}</output>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!search.materialUrl}
            title={!search.materialUrl ? 'Load a sample or URL to share this material' : undefined}
          >
            <Share2 />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void copy(shareUrl('viewer'))}>
            <Copy />
            Copy viewer link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void copy(shareUrl('embed'))}>
            <Link2 />
            Copy embed link
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              void copy(
                `<iframe src="${shareUrl('embed').replaceAll('&', '&amp;').replaceAll('"', '&quot;')}" title="MaterialX preview" width="640" height="640" allow="fullscreen" allowfullscreen></iframe>`,
              )
            }
          >
            <Code />
            Copy embed code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
