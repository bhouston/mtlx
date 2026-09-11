import { useId, useState } from 'react';
import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { resolveMaterialParam } from '@/lib/presets';

export function LoadMaterialUrlDialog({
  materialUrl,
  onLoad,
}: {
  materialUrl?: string;
  onLoad: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const inputId = useId();
  const errorId = useId();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setError('');
        if (next) {
          const resolved = materialUrl ? resolveMaterialParam(materialUrl) : undefined;
          setUrlInput(
            resolved
              ? new URL(resolved.folderUrl + resolved.fileName, window.location.origin).href
              : (materialUrl ?? ''),
          );
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Link2 />
          Load URL
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Load a material from a URL</DialogTitle>
        <DialogDescription>
          Enter a link to a .mtlx or .mtlx.zip file. Its host must allow access from this website.
        </DialogDescription>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            let url: URL;
            try {
              url = new URL(urlInput.trim());
              if (!['https:', 'http:'].includes(url.protocol) || !resolveMaterialParam(url.href)) throw new Error();
            } catch {
              setError('Use an HTTP(S) URL ending in .mtlx or .mtlx.zip.');
              return;
            }
            onLoad(url.href);
            setOpen(false);
          }}
        >
          <div className="grid gap-2">
            <label htmlFor={inputId} className="text-sm font-medium">
              Material URL
            </label>
            <Input
              id={inputId}
              type="url"
              required
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="https://example.com/material.mtlx.zip"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            {error && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Load material</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
