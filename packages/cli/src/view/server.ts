/**
 * `mtlx view` local preview server: a plain node:http server, no framework. It serves three
 * routes — `/` (a generated HTML shell), `/__mtlx_view__/*` (viewer.js, a build output that sits
 * next to this compiled file in dist/view, plus the shaderball asset from media/ — both built by
 * scripts/build-viewer.mjs), and everything else straight from the target file's directory.
 * Serving that whole directory (not just the one file) means a loose .mtlx's relative texture
 * paths (e.g. "textures/wood_color.jpg") just work as ordinary relative fetches from the browser
 * — no texture-to-blob-URL remapping like the VS Code webview needs, since a real browser page
 * (unlike a webview) can fetch straight from an HTTP origin.
 */
import { promises as fs } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const MEDIA_PREFIX = '/__mtlx_view__/';
// ponytail: fallback-only safety net for an orphaned server (e.g. parent process killed without
// signaling); Ctrl+C via the command handler's SIGINT/SIGTERM listener is the normal path.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export interface ViewServer {
  url: string;
  close: () => Promise<void>;
}

/** Resolves a request pathname to a file under `rootDir`, refusing anything that escapes it
 * (e.g. `..` traversal). Returns null for an unsafe path. */
export function safeJoin(rootDir: string, urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '');
  const relative = decoded.replace(/^\/+/, '');
  const normalizedRoot = path.resolve(rootDir);
  const target = path.resolve(normalizedRoot, relative);
  if (target !== normalizedRoot && !target.startsWith(normalizedRoot + path.sep)) {
    return null;
  }
  return target;
}

/** Small fixed mime map — only the extensions this server ever needs to send. */
export function mimeTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.mtlx':
      return 'application/xml';
    case '.zip':
      return 'application/zip';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.glb':
      return 'model/gltf-binary';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function renderIndexHtml(fileName: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>mtlx view — ${escapeHtml(fileName)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #111; color: #eee; font-family: system-ui, sans-serif; }
  #viewport { display: block; width: 100vw; height: 100vh; }
  .toolbar { position: fixed; top: 12px; left: 12px; display: flex; gap: 8px; z-index: 1; }
  .effects { top: auto; bottom: 12px; right: 12px; flex-wrap: wrap; }
  .toolbar select { font-size: 12px; padding: 2px 4px; }
  #error { position: fixed; bottom: 12px; left: 12px; right: 12px; color: #f88; white-space: pre-wrap; font-size: 12px; }
</style>
</head>
<body>
<div class="toolbar">
  <select id="material-select" title="Material"></select>
  <select id="geometry-select" title="Geometry">
    <option value="totem">Totem</option>
    <option value="sphere">Sphere</option>
    <option value="plane">Plane</option>
  </select>
</div>
<div class="toolbar effects">
  <label>Tone mapping <select id="tone-mapping" aria-label="Tone mapping"></select></label>
  <label><input id="bloom" type="checkbox" checked aria-label="Bloom"> Bloom</label>
  <label><input id="ao" type="checkbox" checked aria-label="Ambient occlusion"> AO</label>
</div>
<canvas id="viewport"></canvas>
<div id="error"></div>
<script>window.__MTLX_FILE__ = ${JSON.stringify(fileName)};</script>
<script src="${MEDIA_PREFIX}viewer.js"></script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

async function sendFile(res: ServerResponse, filePath: string): Promise<void> {
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypeFor(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

interface RequestContext {
  rootDir: string;
  fileName: string;
  viewerJsPath: string;
  mediaDir: string;
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, ctx: RequestContext): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

  if (pathname === '/') {
    const html = renderIndexHtml(ctx.fileName);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (pathname === `${MEDIA_PREFIX}viewer.js`) {
    await sendFile(res, ctx.viewerJsPath);
    return;
  }

  if (pathname.startsWith(MEDIA_PREFIX)) {
    await sendFile(res, path.join(ctx.mediaDir, pathname.slice(MEDIA_PREFIX.length)));
    return;
  }

  const target = safeJoin(ctx.rootDir, pathname);
  if (!target) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  await sendFile(res, target);
}

// Compiled to dist/view/server.js. viewer.js is a build output that lands right beside it in the
// same dist/view directory; media/ (the shaderball asset) sits beside dist/ at the package root.
const defaultViewerJsPath = (): string => path.join(path.dirname(fileURLToPath(import.meta.url)), 'viewer.js');
const defaultMediaDir = (): string => path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'media');

/** Starts the local preview server for `inputPath` and resolves once it's listening. Serves the
 * target file's whole directory as static files (see module doc) rooted at `/`. */
export async function startViewServer(
  inputPath: string,
  mediaDir: string = defaultMediaDir(),
  viewerJsPath: string = defaultViewerJsPath(),
): Promise<ViewServer> {
  const resolvedInput = path.resolve(inputPath);
  const stat = await fs.stat(resolvedInput).catch(() => null);
  if (!stat?.isFile()) {
    throw new Error(`File not found: ${inputPath}`);
  }

  const ctx: RequestContext = {
    rootDir: path.dirname(resolvedInput),
    fileName: path.basename(resolvedInput),
    viewerJsPath,
    mediaDir,
  };

  const server = http.createServer((req, res) => {
    handleRequest(req, res, ctx).catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end('Internal error');
    });
  });

  let idleTimer: NodeJS.Timeout;
  const scheduleIdleShutdown = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      server.close(() => process.exit(0));
    }, IDLE_TIMEOUT_MS);
    idleTimer.unref();
  };
  server.on('request', scheduleIdleShutdown);
  scheduleIdleShutdown();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind local preview server');
  }

  return {
    url: `http://127.0.0.1:${address.port}/`,
    close: () =>
      new Promise((resolve) => {
        clearTimeout(idleTimer);
        server.close(() => resolve());
      }),
  };
}
