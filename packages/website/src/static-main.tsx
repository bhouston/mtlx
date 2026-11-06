/** Static browser entry shared by the Docusaurus editor, viewer and chromeless embed. */
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Route as EditorRoute } from './routes/editor';
import { Route as ViewerRoute } from './routes/viewer';
import { Route as EmbedRoute } from './routes/embed';
import { Toaster } from './components/ui/sonner';
import './app.css';

const queryClient = new QueryClient();
const root = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-svh min-h-0 flex-col">
          <Outlet />
        </div>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  ),
});
const routes = [
  createRoute({ ...EditorRoute.options, path: '/editor', getParentRoute: () => root }),
  createRoute({ ...ViewerRoute.options, path: '/viewer', getParentRoute: () => root }),
  createRoute({ ...EmbedRoute.options, path: '/embed', getParentRoute: () => root }),
];
const router = createRouter({ routeTree: root.addChildren(routes), basepath: '/app', defaultPreload: 'intent' });
const publicPath = () =>
  `${location.pathname.replace(/^\/app/, '').replace(/\/$/, '')}${location.search}${location.hash}`;
const notifyParent = () => {
  if (window.parent !== window)
    window.parent.postMessage({ type: 'mtlx-tool-location', path: publicPath() }, location.origin);
};
router.subscribe('onResolved', notifyParent);
window.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (
    event.origin !== location.origin ||
    event.source !== window.parent ||
    !event.data ||
    typeof event.data !== 'object'
  )
    return;
  const message = event.data as { type?: unknown; path?: unknown };
  if (message.type !== 'mtlx-docs-location' || typeof message.path !== 'string') return;
  if (!/^\/(viewer|editor|embed)(?:[?#]|$)/.test(message.path)) return;
  if (message.path !== publicPath()) router.history.replace(`/app${message.path}`);
});
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);

// Links back to the suite leave the isolated app instead of resolving to a missing /app route.
document.addEventListener(
  'click',
  (event) => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin) return;
    const path = url.pathname.replace(/^\/app/, '');
    if (/^\/(viewer|editor|embed)(?:\/|$)/.test(path)) return;
    const destination = `${path || '/'}${url.search}${url.hash}`;
    anchor.href = destination;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === '_blank') return;
    event.preventDefault();
    event.stopPropagation();
    if (window.parent !== window)
      window.parent.postMessage({ type: 'mtlx-docs-navigate', path: destination }, location.origin);
    else location.assign(destination);
  },
  { capture: true },
);
