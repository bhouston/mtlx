import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import redirectsText from '../../redirects.txt?raw';
import { lookupRedirectTarget, parseRedirectsFile, SOURCE_PATH_REGEX } from '@/lib/redirects';

const redirects = parseRedirectsFile(redirectsText);

export const Route = createFileRoute('/$')({
  beforeLoad: ({ location, params }) => {
    const sourcePath = params._splat?.trim();
    if (!sourcePath || !SOURCE_PATH_REGEX.test(sourcePath)) throw notFound();

    const target =
      lookupRedirectTarget(redirects, `${sourcePath}${location.searchStr || ''}`) ??
      lookupRedirectTarget(redirects, sourcePath);
    if (!target) throw notFound();

    throw redirect(target.startsWith('https://') ? { href: target } : { to: target });
  },
  component: () => <div className="p-6 text-sm text-muted-foreground">Redirecting…</div>,
});
