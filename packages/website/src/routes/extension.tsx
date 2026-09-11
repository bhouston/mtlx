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
  'Opens .mtlx and .mtlx.zip files in a 3D preview (three.js, on a sphere).',
  'Stats panel: version, materials (surfaces/volumes), referenced textures, internal node list, validity/issues.',
  'Right-click a .mtlx or .mtlx.zip file in the Explorer to convert it to the other format.',
];

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

      <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border bg-muted text-xs text-muted-foreground">
        screenshot
      </div>

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
    </main>
  );
}
