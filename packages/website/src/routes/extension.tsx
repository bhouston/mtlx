import { createFileRoute, Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';

export const Route = createFileRoute('/extension')({
  head: () => ({
    meta: [
      { title: 'Mtlx Viewer — VS Code extension' },
      {
        name: 'description',
        content:
          'Open .mtlx and .mtlx.zip files in VS Code for a live 3D preview, an interactive node graph, and full validation.',
      },
    ],
  }),
  component: ExtensionPage,
});

const VSCODE_MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=benhouston3d.mtlx-vscode-extension';
const OPEN_VSX_URL = 'https://open-vsx.org/extension/benhouston3d/mtlx-vscode-extension';

const FEATURES = [
  [
    'Real-time 3D preview',
    'Totem, sphere, cube, plane or your own glTF model, lit by HDR environments with bloom, AO and tone mapping.',
  ],
  ['Node graph view', 'Pan, zoom and click through nodes and nested node graphs to inspect every parameter.'],
  [
    'Validation at a glance',
    'Structure, types, dependencies, textures and renderer support are checked as the file opens.',
  ],
  ['Live reload', 'Save the material or any texture it uses and the preview updates.'],
  [
    'One-click packaging',
    'Right-click in Explorer to bundle a .mtlx and its textures into a .mtlx.zip, or unpack one.',
  ],
  ['Your lighting, your models', 'Add HDR/EXR environments and glTF/GLB geometry from disk or a URL.'],
];

const SETTINGS_EXAMPLE = `{
  "mtlx.preview.ibls": [
    { "name": "courtyard", "source": "~/IBLs/courtyard.hdr" },
    { "name": "gallery", "source": "https://example.com/ibl/gallery.exr" }
  ],
  "mtlx.preview.defaultIbl": "courtyard",
  "mtlx.preview.autoRotate": false,
  "mtlx.preview.bloom": true,
  "mtlx.preview.ao": true,
  "mtlx.preview.toneMapping": "neutral",
  "mtlx.preview.background": "environment",
  "mtlx.preview.geometries": [
    { "name": "bust", "source": "models/bust.gltf" },
    { "name": "sample_mesh", "source": "https://example.com/models/sample.glb" }
  ],
  "mtlx.preview.defaultGeometry": "bust"
}`;

function ExtensionPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Mtlx Viewer for VS Code</h1>
        <p className="text-lg">
          See your{' '}
          <a href="https://materialx.org" className="underline underline-offset-4">
            MaterialX
          </a>{' '}
          materials without leaving the editor.
        </p>
        <p className="text-muted-foreground">
          Open any <code>.mtlx</code> or <code>.mtlx.zip</code> file and get a live, physically based 3D preview, an
          interactive node graph, and a full validation report, all in one tab. Free and open source, built on the same{' '}
          <code>mtlx-core</code> library as the CLI and this site's viewer.
        </p>
        <p className="text-sm text-muted-foreground">
          Part of the{' '}
          <Link to="/" className="text-primary underline underline-offset-4">
            Mtlx suite of web-focused MaterialX tools
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={VSCODE_MARKETPLACE_URL} className={buttonVariants()}>
          Install from the VS Code Marketplace
        </a>
        <a href={OPEN_VSX_URL} className={buttonVariants({ variant: 'outline' })}>
          Install from Open VSX
        </a>
      </div>

      <img
        src="/extension.gif"
        alt="Mtlx Viewer switching between the 3D preview and the node graph"
        width={1200}
        height={1004}
        className="h-auto w-full rounded-md border border-border bg-muted"
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(([title, description]) => (
          <li key={title} className="flex flex-col gap-1">
            <span className="font-medium">{title}</span>
            <span className="text-sm text-muted-foreground">{description}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Use Open VSX for Cursor, VSCodium and other VS Code-compatible editors that can't use the Microsoft Marketplace.
        Requires desktop VS Code 1.85+ with GPU acceleration.
      </p>
      <section id="settings" className="flex min-w-0 flex-col gap-4 scroll-mt-6">
        <h2 className="text-xl font-semibold">Viewer settings</h2>
        <p className="text-sm text-muted-foreground">
          Set preview defaults under <strong>Settings → Mtlx Viewer</strong>, or in user/workspace{' '}
          <code>settings.json</code>. Everything can also be changed per preview from the{' '}
          <strong>Viewer settings</strong> panel.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Extension viewer settings and defaults</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="p-2">
                  Setting
                </th>
                <th scope="col" className="p-2">
                  Default
                </th>
                <th scope="col" className="p-2">
                  Values and behavior
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['mtlx.preview.ibls', '[]', 'Additional named equirectangular .hdr, .exr, .png, .jpg / .jpeg files.'],
                ['mtlx.preview.defaultIbl', '"bridge"', 'bridge, studio, or an additional IBL name.'],
                [
                  'mtlx.preview.autoRotate',
                  'true',
                  'Rotate by default. Reduced motion takes precedence; rotation can still be enabled manually.',
                ],
                ['mtlx.preview.bloom', 'true', 'Enable HDR bloom by default.'],
                ['mtlx.preview.ao', 'true', 'Enable full-resolution, denoised GTAO by default.'],
                [
                  'mtlx.preview.toneMapping',
                  '"neutral"',
                  'neutral, aces (ACES Filmic), agx, reinhard, cineon, linear, none.',
                ],
                [
                  'mtlx.preview.background',
                  '"environment"',
                  'environment shows the IBL behind the model; none leaves it transparent.',
                ],
                ['mtlx.preview.geometries', '[]', 'Additional named .gltf / .glb mesh scenes.'],
                [
                  'mtlx.preview.defaultGeometry',
                  '"totem"',
                  'totem, sphere, cube, plane, or an additional geometry name.',
                ],
              ].map(([name, defaultValue, description]) => (
                <tr key={name} className="border-b border-border align-top">
                  <th scope="row" className="p-2 font-normal">
                    <code>{name}</code>
                  </th>
                  <td className="p-2">
                    <code>{defaultValue}</code>
                  </td>
                  <td className="p-2">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Each additional asset has a <code>name</code> and a <code>source</code> file path or HTTP(S) URL. Replace
          these example paths and URLs with your files:
        </p>
        <pre className="max-w-full overflow-x-auto rounded-md border border-border bg-muted p-4 text-xs">
          <code>{SETTINGS_EXAMPLE}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          Names are case-sensitive identifiers matching <code>[a-zA-Z_][a-zA-Z0-9_]*</code>: start with a letter or
          underscore, then use letters, digits or underscores. Duplicates within a list and built-in names are rejected.
          IBL and geometry names are separate namespaces, so a custom name can appear in both.
        </p>
        <p className="text-sm text-muted-foreground">
          Relative paths resolve from the material's workspace folder, or its own folder when no workspace folder
          exists. Absolute paths and <code>~/</code> refer to the extension host's filesystem. HTTP(S) URLs are read by
          the extension host. glTF buffers and images resolve relative to the geometry file, including the final URL
          after a redirect. Custom geometry uses the selected MaterialX material, replacing its original materials.
          Draco, Meshopt and KTX2 decoders are not configured.
        </p>
        <p className="text-sm text-muted-foreground">
          Assets load when selected, with a 128 MiB limit per IBL or geometry including its sidecars and at most 256
          external glTF resources. Refresh reloads assets. Configuration edits refresh visible previews and reapply
          defaults; manual choices survive ordinary refreshes and tab recreation until settings change. Invalid entries
          and defaults appear in settings diagnostics and fall back to built-ins. Load failures keep the current
          preview, or use a built-in fallback if the initial asset fails.
        </p>
      </section>
    </main>
  );
}
