import { Link, useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useGoogleAnalytics } from 'tanstack-router-ga4';
import { Button, buttonVariants } from 'mtlx-viewer/react';

export function NotFound() {
  const location = useLocation();
  const { event } = useGoogleAnalytics();

  useEffect(() => {
    event('not-found', { value: `${location.pathname}${location.searchStr || ''}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          Go back
        </Button>
        <Link to="/" className={buttonVariants({ size: 'sm' })}>
          Start over
        </Link>
      </div>
    </main>
  );
}
