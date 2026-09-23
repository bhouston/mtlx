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

const EMBED_EXAMPLE = `<script type="module" src="https://unpkg.com/mtlx-viewer/dist/material-viewer.js"></script>

${TAG_MARKUP}`;

const ATTRIBUTES: Array<[string, string]> = [
  ['src', 'Required. The .mtlx or .mtlx.zip file to preview.'],
  ['model', 'A custom glTF/GLB URL to preview the material on, instead of the built-in shaderball.'],
  ['ibl', '"bridge" (default), "studio", or a URL to a custom .hdr/.exr/.png/.jpg environment.'],
  ['geometry', '"totem" | "sphere" | "cube" | "plane" | "custom" (the last selects model, if given).'],
  ['material', 'Initial material name; defaults to the document’s last material.'],
  ['rotate / bloom / ao', '"false" to disable; all default on.'],
  ['background', '"environment" (default) shows the IBL behind the model; "none" leaves it transparent.'],
  ['tone-mapping', 'neutral (default), aces, agx, reinhard, cineon, linear, none.'],
  ['exposure / intensity', 'Numbers in -2..2 / 0..2.'],
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
    void import('mtlx-viewer/element').then(() => {
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
          without a reload. The element also fires <code>load</code> and <code>error</code> events.
        </p>
      </section>
    </main>
  );
}
