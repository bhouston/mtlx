import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createRootRoute, HeadContent, Link, Outlet, Scripts, useLocation } from '@tanstack/react-router';
import { HeartIcon } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { GoogleAnalytics } from 'tanstack-router-ga4';

import { Toaster } from '@/components/ui/sonner';
import appCss from '@/app.css?url';

const GA_MEASUREMENT_ID = 'G-L71KL9N7XM';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'mtlx: MaterialX tools for the web' },
      {
        name: 'description',
        content:
          'Pure TypeScript/JavaScript MaterialX tools — runs on Node, browsers, Windows, macOS, and Linux. Drag and drop a MaterialX file to view and validate it.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <SiteLayout />
    </QueryClientProvider>
  );
}

function SiteLayout() {
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
          <Link to="/" className="flex items-center gap-4 font-semibold text-primary underline underline-offset-4">
            <img src="/logo.webp" alt="mtlx" className="h-9 w-auto" />
            Home
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              to="/viewer"
              className="text-primary underline underline-offset-4"
              activeProps={{ className: 'font-semibold' }}
            >
              Viewer
            </Link>
            <Link
              to="/extension"
              className="text-primary underline underline-offset-4"
              activeProps={{ className: 'font-semibold' }}
            >
              Extension
            </Link>
            <a href="https://www.npmjs.com/package/mtlx-cli" className="text-primary underline underline-offset-4">
              CLI
            </a>
            <a href="https://www.npmjs.com/package/mtlx-core" className="text-primary underline underline-offset-4">
              Library
            </a>
          </nav>
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

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'mtlx',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web, Windows, macOS, Linux',
  description:
    'Pure TypeScript/JavaScript MaterialX tools — parse, validate, package, and transform .mtlx and .mtlx.zip files.',
  url: 'https://mtlx.ben3d.ca',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: { '@type': 'Person', name: 'Ben Houston', url: 'https://ben3d.ca' },
};

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* eslint-disable-next-line react/no-danger -- static, trusted JSON-LD constant */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
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
