import { useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function EditorShareMenu({ getUrl, disabled }: { getUrl: () => string; disabled?: boolean }) {
  const [message, setMessage] = useState('');
  const copy = async () => {
    let url: string;
    try {
      url = getUrl();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Copied editor link to clipboard.');
    } catch {
      setMessage('Clipboard unavailable.');
    }
  };
  return (
    <div className="ml-auto flex flex-wrap items-center gap-2">
      <output className={message ? 'max-w-sm text-xs text-muted-foreground' : 'sr-only'}>{message}</output>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Share2 />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void copy()}>
            <Copy />
            Copy editor link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
