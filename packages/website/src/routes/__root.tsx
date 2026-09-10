import { createRootRoute, HeadContent, Link, Outlet, Scripts, useLocation } from '@tanstack/react-router';
import { GithubIcon, HeartIcon } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { GoogleAnalytics } from 'tanstack-router-ga4';

import { Toaster } from '@/components/ui/sonner';
import appCss from '@/app.css?url';

const GITHUB_URL = 'https://github.com/bhouston/mtlx';
const NPM_URL = 'https://www.npmjs.com/package/mtlx-core';
const GA_MEASUREMENT_ID = 'G-L71KL9N7XM';

function NpmIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M0 0v24h24V0H0zm19.2 19.2h-4.8V8.4H9.6v10.8H4.8V4.8h14.4v14.4z" />
    </svg>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'mtlx: MaterialX tools for the web' },
      {
        name: 'description',
        content:
          'Pure TypeScript/JavaScript MaterialX tools — no binary dependencies, runs on Node, browsers, Windows, macOS, and Linux. Drag and drop a MaterialX file to view and validate it.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootLayout() {
  // Embed mode is chromeless (for iframe embedding), so skip the site header/footer for it.
  const isEmbed = useLocation({ select: (location) => location.pathname === '/embed' });
  if (isEmbed) {
    return (
      <div className="flex min-h-svh flex-col">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold">
            mtlx
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              to="/"
              className="text-primary underline underline-offset-4"
              activeProps={{ className: 'font-semibold' }}
            >
              Viewer
            </Link>
            <a href="/docs/" className="text-primary underline underline-offset-4">
              Docs
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <a href={GITHUB_URL} aria-label="GitHub" className="hover:text-foreground">
            <GithubIcon className="size-5" aria-hidden />
          </a>
          <a href={NPM_URL} aria-label="npm" className="hover:text-foreground">
            <NpmIcon className="size-5" />
          </a>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      <footer className="border-t border-border">
        <p className="flex items-center justify-center gap-1 px-4 py-3 text-sm text-muted-foreground">
          Made with
          <HeartIcon className="size-3.5 fill-current text-destructive" aria-hidden />
          by
          <a href="https://ben3d.ca" className="text-primary underline underline-offset-4">
            Ben Houston
          </a>
          <span className="sr-only">love</span>— sponsored by
          <a href="https://landofassets.com" className="text-primary underline underline-offset-4">
            Land of Assets
          </a>
        </p>
      </footer>
    </div>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {import.meta.env.PROD ? <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} /> : null}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
