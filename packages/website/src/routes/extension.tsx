import { createFileRoute } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';

export const Route = createFileRoute('/extension')({
  head: () => ({
    meta: [
      { title: 'Mtlx Viewer — VS Code extension' },
      {
        name: 'description',
        content: 'Preview, inspect, and convert .mtlx and .mtlx.zip files directly in VS Code.',
      },
    ],
  }),
  component: ExtensionPage,
});

const VSCODE_MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=benhouston3d.mtlx-vscode-extension';
const OPEN_VSX_URL = 'https://open-vsx.org/extension/benhouston3d/mtlx-vscode-extension';

const FEATURES = [
  'Opens .mtlx and .mtlx.zip files with totem, sphere, plane, or custom glTF preview geometry.',
  'Configurable IBL lighting, geometry and rotation defaults; San Giuseppe Bridge lighting by default.',
  'Stats panel: version, materials (surfaces/volumes), referenced textures, internal node list, validity/issues.',
  'Right-click a .mtlx or .mtlx.zip file in the Explorer to convert it to the other format.',
];

const SETTINGS_EXAMPLE = `{
  "mtlx.preview.ibls": [
    { "name": "courtyard", "source": "~/IBLs/courtyard.hdr" },
    { "name": "gallery", "source": "https://example.com/ibl/gallery.exr" }
  ],
  "mtlx.preview.defaultIbl": "courtyard",
  "mtlx.preview.autoRotate": false,
  "mtlx.preview.geometries": [
    { "name": "bust", "source": "models/bust.gltf" },
    { "name": "sample_mesh", "source": "https://example.com/models/sample.glb" }
  ],
  "mtlx.preview.defaultGeometry": "bust"
}`;

function ExtensionPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Mtlx Viewer for VS Code</h1>
        <p className="text-muted-foreground">
          Preview, inspect, and convert{' '}
          <a href="https://materialx.org" className="underline underline-offset-4">
            MaterialX
          </a>{' '}
          files directly in VS Code, built on the same <code>mtlx-core</code> library as the CLI and this site's viewer.
        </p>
      </div>

      <img
        src="/extension.webp"
        alt="Mtlx Viewer extension screenshot"
        className="aspect-video rounded-md border border-border bg-muted object-contain"
      />

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden>•</span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <a href={VSCODE_MARKETPLACE_URL} className={buttonVariants({ size: 'sm' })}>
          Get it on the VS Code Marketplace
        </a>
        <a href={OPEN_VSX_URL} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
          Get it on Open VSX
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Two separate stores, since not every VS Code-based editor (e.g. VSCodium) can use the Microsoft Marketplace.
      </p>
      <section id="settings" className="flex min-w-0 flex-col gap-4 scroll-mt-6">
        <h2 className="text-xl font-semibold">Viewer settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure the extension under <strong>Settings → Mtlx Viewer</strong>, or in user/workspace{' '}
          <code>settings.json</code>. San Giuseppe Bridge is the default IBL in both the website and extension. These
          settings customize the extension's previews.
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
                ['mtlx.preview.geometries', '[]', 'Additional named .gltf / .glb mesh scenes.'],
                ['mtlx.preview.defaultGeometry', '"totem"', 'totem, sphere, plane, or an additional geometry name.'],
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
