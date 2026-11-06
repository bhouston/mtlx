import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

export const Route = createFileRoute('/material-viewer')({
  ssr: false,
  head: () => ({
    meta: [
      { title: '<material-viewer> — mtlx' },
      {
        name: 'description',
        content: 'Drop a .mtlx or .mtlx.zip 3D preview into any page with one custom element tag.',
      },
    ],
  }),
  component: MaterialViewerTagPage,
});

// The demo below renders exactly this markup (the site bundles the element, so it skips the script tag).
const TAG_MARKUP = `<material-viewer
  src="https://mtlx.ben3d.ca/materials/compound_zip/compound_zip.mtlx.zip"
  settings-panel="closed"
  style="width: 100%; height: 100%">
</material-viewer>`;

const EMBED_SCRIPT_SRC = 'https://unpkg.com/mtlx-viewer/dist/material-viewer.js';

const EMBED_EXAMPLE = `<script type="module" src="${EMBED_SCRIPT_SRC}"></script>

${TAG_MARKUP}`;

// Production dogfoods the published bundle exactly as the snippet does; dev uses the workspace build
// so local viewer changes show up. Vite replaces import.meta.env.PROD statically, so the unused
// branch (and the local element chunk) drops out of the production build.
function registerElement(): Promise<unknown> {
  if (!import.meta.env.PROD) return import('mtlx-viewer/element');
  if (customElements.get('material-viewer')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = EMBED_SCRIPT_SRC;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${EMBED_SCRIPT_SRC}`));
    document.head.append(script);
  });
}

const ATTRIBUTES: Array<[string, string]> = [
  ['alt', 'Accessible description of the material; updates the focusable canvas without reloading.'],
  ['src', 'Required. The .mtlx or .mtlx.zip file to preview.'],
  ['model', 'A custom glTF/GLB URL to preview the material on, instead of the built-in shaderball.'],
  ['ibl', '"studio" (default), "bridge", or a URL to a custom .hdr/.exr/.png/.jpg environment.'],
  ['geometry', '"totem" | "sphere" | "cube" | "plane" | "custom" (the last selects model, if given).'],
  ['material', 'Initial material name; defaults to the document’s last material.'],
  ['rotate / bloom / ao', '"false" to disable; all default on.'],
  ['background', '"white" (default); "environment" shows the IBL; "none" leaves it transparent.'],
  ['tone-mapping', 'neutral (default), aces, agx, reinhard, cineon, linear, none.'],
  [
    'environment-rotation',
    'Environment yaw in degrees (default 0). Negative values and full turns wrap into 0..360. Rotates lighting and the environment backdrop together.',
  ],
  ['exposure / intensity', 'Numbers in -2..2 / 0..2.'],
  ['errors', '"silent" hides the error overlay; omitted shows errors. Error events always fire.'],
  ['settings-panel', '"open" | "closed" | "hidden" (default) — a built-in overlay for the above.'],
];

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
      <code>{code}</code>
    </pre>
  );
}

/** Registers the custom element client-side, then inserts the documented tag markup verbatim. */
function LiveDemo() {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    void registerElement().then(() => {
      if (cancelled) return;
      host.innerHTML = TAG_MARKUP;
    });
    return () => {
      cancelled = true;
      host.replaceChildren();
    };
  }, []);
  return (
    <div ref={hostRef} className="aspect-square w-full max-w-md overflow-hidden rounded-md border border-border" />
  );
}

function MaterialViewerTagPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          <code>&lt;material-viewer&gt;</code>
        </h1>
        <p className="text-muted-foreground">
          A drop-in custom element, in the spirit of Google's{' '}
          <a href="https://modelviewer.dev" className="underline underline-offset-4">
            &lt;model-viewer&gt;
          </a>
          . Add one <code>&lt;script&gt;</code> tag and a <code>src</code>, and any page gets a full 3D MaterialX
          preview — no framework or build step required.
        </p>
        <p className="text-sm text-muted-foreground">
          Part of the{' '}
          <Link to="/" className="text-primary underline underline-offset-4">
            Mtlx suite of web-focused MaterialX tools
          </Link>
          , built on the same <code>mtlx-viewer</code> package as this site's{' '}
          <Link to="/viewer" className="underline underline-offset-4">
            Online Viewer
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <LiveDemo />
        <p className="text-sm text-muted-foreground">
          Live demo of the tag below — click the gear to open the settings panel. Paste the snippet into any HTML page
          to get the same result.
        </p>
        <CodeBlock code={EMBED_EXAMPLE} />
      </div>

      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="text-xl font-semibold">Loading progress</h2>
        <p className="text-sm text-muted-foreground">
          A top progress bar appears automatically during downloading, renderer setup, material and texture loading,
          lighting, geometry, and the first render. It also appears when changing materials, environments, or geometry.
          Progress events expose <code>detail.totalProgress</code> from 0 to 1.
        </p>
        <p className="text-sm text-muted-foreground">
          Customize <code>--progress-bar-color</code>, <code>--progress-bar-height</code>, or
          <code> material-viewer::part(default-progress-bar)</code>. To disable it, add an empty
          <code> {'<span slot="progress-bar"></span>'}</code> child. The React component accepts the same child and
          provides an <code>onProgress</code> callback. A custom progress-bar slot replaces the default bar; use
          progress events to update your replacement.
        </p>
      </section>

      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="text-xl font-semibold">Attributes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">material-viewer attributes</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="p-2">
                  Attribute
                </th>
                <th scope="col" className="p-2">
                  Values and behavior
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {ATTRIBUTES.map(([name, description]) => (
                <tr key={name} className="border-b border-border align-top">
                  <th scope="row" className="p-2 font-normal">
                    <code>{name}</code>
                  </th>
                  <td className="p-2">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Every attribute except <code>src</code> and <code>model</code> applies live — change it and the viewer updates
          without a reload. The element also fires <code>load</code>, <code>progress</code>, and <code>error</code>{' '}
          events.
        </p>
      </section>
    </main>
  );
}
