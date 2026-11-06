import { useEffect, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useHistory, useLocation } from '@docusaurus/router';
import Layout from '@theme/Layout';

type Tool = 'viewer' | 'editor' | 'embed';
const titles: Record<Tool, string> = {
  viewer: 'Material viewer',
  editor: 'MaterialX node editor',
  embed: 'Material preview',
};

/** Tools are static client bundles, isolated from Docusaurus SSR and documentation styles. */
function ToolFrame({ tool }: { tool: Tool }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const location = useLocation();
  const history = useHistory();
  const lastFramePath = useRef<string | undefined>(undefined);
  const [initialSource] = useState(() => `/app/${tool}/${window.location.search}${window.location.hash}`);
  useEffect(() => {
    const changed = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        !event.data ||
        typeof event.data !== 'object'
      )
        return;
      const message = event.data as { type?: unknown; path?: unknown };
      if (
        message.type === 'mtlx-docs-navigate' &&
        typeof message.path === 'string' &&
        /^\/(?!\/|app(?:\/|$))/.test(message.path)
      ) {
        history.push(message.path);
        return;
      }
      if (
        message.type !== 'mtlx-tool-location' ||
        typeof message.path !== 'string' ||
        !/^\/(viewer|editor|embed)(?:[?#]|$)/.test(message.path)
      )
        return;
      lastFramePath.current = message.path;
      const current = `${window.location.pathname.replace(/\/$/, '')}${window.location.search}${window.location.hash}`;
      if (message.path !== current) history.replace(message.path);
    };
    window.addEventListener('message', changed);
    return () => window.removeEventListener('message', changed);
  }, [history]);
  useEffect(() => {
    const path = `${location.pathname.replace(/\/$/, '')}${location.search}${location.hash}`;
    if (path !== lastFramePath.current)
      frame.current?.contentWindow?.postMessage({ type: 'mtlx-docs-location', path }, window.location.origin);
  }, [location.pathname, location.search, location.hash]);
  return (
    <iframe
      ref={frame}
      src={initialSource}
      title={titles[tool]}
      className={`tool-frame tool-frame--${tool}`}
      allow="clipboard-read; clipboard-write"
    />
  );
}

export default function ToolPage({ tool }: { tool: Tool }) {
  const content = (
    <BrowserOnly
      fallback={
        <p className="tool-loading" aria-live="polite">
          Loading {titles[tool].toLowerCase()}…
        </p>
      }
    >
      {() => <ToolFrame key={tool} tool={tool} />}
    </BrowserOnly>
  );
  if (tool === 'embed') return <main className="embed-page">{content}</main>;
  return (
    <Layout
      title={titles[tool]}
      description={
        tool === 'editor'
          ? 'Edit MaterialX node graphs with a live material preview.'
          : 'Preview, inspect and share MaterialX materials in your browser.'
      }
      noFooter
    >
      <main className="tool-page">{content}</main>
    </Layout>
  );
}
