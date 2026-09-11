import { createFileRoute, Link } from '@tanstack/react-router';
import { GithubIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const CLI_EXAMPLE = `npm install -g mtlx-cli

# validate a file; exits non-zero on any error-level issue, so it works as a CI gate
mtlx check material.mtlx

# print material/texture/document info
mtlx info material.mtlx.zip --format json

# pack a .mtlx (plus its textures) into a single .mtlx.zip
mtlx x material.mtlx -o material.mtlx.zip

# unpack a .mtlx.zip back into a .mtlx with textures alongside it
mtlx x material.mtlx.zip -o out/material.mtlx

# convert while packing: resize textures and switch their format to be web compatible
mtlx x material.mtlx -o material.mtlx.zip --profile web

# combine multiple materials (a glob or an explicit list) into a single .mtlx.zip
mtlx x "materials/*.mtlx" -o combined.mtlx.zip

# batch mode: an output directory converts each input separately, one file per input
mtlx x "materials/*.mtlx" -o out/ --max-image-size 2048 --image-format webp

# open a 3D preview in your browser (local only, nothing is uploaded)
mtlx view material.mtlx`;

const LIBRARY_EXAMPLE = `import { loadMaterialXPackage, writeMaterialXPackage, transform } from 'mtlx-core/node';
import { resizeTextures } from 'mtlx-core/textures';

// unpack a .mtlx.zip (or load a bare .mtlx) into an in-memory package
const pkg = await loadMaterialXPackage('material.mtlx');

// resize oversized textures and reformat them, all in one pass
await transform(pkg, resizeTextures({ maxImageSize: 2048, imageFormat: 'webp' }));

// pack it back into a single .mtlx.zip, textures included
await writeMaterialXPackage(pkg, 'material.mtlx.zip');`;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
      <code>{code}</code>
    </pre>
  );
}

function NpmIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M0 0v24h24V0H0zm19.2 19.2h-4.8V8.4H9.6v10.8H4.8V4.8h14.4v14.4z" />
    </svg>
  );
}

function PackageLinks({ github, npm }: { github: string; npm?: string }) {
  return (
    <div className="mt-auto flex justify-end gap-3 pt-1 text-muted-foreground">
      <a href={github} aria-label="GitHub" className="hover:text-foreground">
        <GithubIcon className="size-5" aria-hidden />
      </a>
      {npm ? (
        <a href={npm} aria-label="npm" className="hover:text-foreground">
          <NpmIcon className="size-5" />
        </a>
      ) : null}
    </div>
  );
}

function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 p-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">mtlx</h1>
        <p className="max-w-2xl text-muted-foreground">
          A pure TypeScript/JavaScript{' '}
          <a href="https://materialx.org" className="underline underline-offset-4">
            MaterialX
          </a>{' '}
          toolkit — runs the same on Node.js and in the browser, on Windows, macOS, and Linux. Parse, validate, package,
          and transform <code>.mtlx</code> and <code>.mtlx.zip</code> files.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>
              <Link to="/viewer" className="text-primary underline underline-offset-4">
                Online Viewer
              </Link>
            </CardTitle>
            <CardDescription>Drag and drop a MaterialX file, inspect it, and preview it in 3D.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <img
              src="/viewer.webp"
              alt="Mtlx viewer screenshot"
              className="aspect-video rounded-md border border-border bg-muted object-contain"
            />
            <PackageLinks
              github="https://github.com/bhouston/mtlx/blob/main/packages/viewer/README.md"
              npm="https://www.npmjs.com/package/mtlx-viewer"
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>
              <Link to="/extension" className="text-primary underline underline-offset-4">
                VS Code Extension
              </Link>
            </CardTitle>
            <CardDescription>Preview, inspect, and convert MaterialX files right in the editor.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <img
              src="/extension.webp"
              alt="Mtlx Viewer extension screenshot"
              className="aspect-video rounded-md border border-border bg-muted object-contain"
            />
            <PackageLinks github="https://github.com/bhouston/mtlx/blob/main/packages/vscode-extension/README.md" />
          </CardContent>
        </Card>

        <Card className="flex flex-col sm:col-span-2">
          <CardHeader>
            <CardTitle>
              <a href="https://www.npmjs.com/package/mtlx-cli" className="text-primary underline underline-offset-4">
                CLI
              </a>
            </CardTitle>
            <CardDescription>
              Validate, inspect, and convert <code>.mtlx</code> and <code>.mtlx.zip</code> files from the command line.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <CodeBlock code={CLI_EXAMPLE} />
            <PackageLinks
              github="https://github.com/bhouston/mtlx/blob/main/packages/cli/README.md"
              npm="https://www.npmjs.com/package/mtlx-cli"
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col sm:col-span-2">
          <CardHeader>
            <CardTitle>
              <a href="https://www.npmjs.com/package/mtlx-core" className="text-primary underline underline-offset-4">
                Library
              </a>
            </CardTitle>
            <CardDescription>
              Script conversions and transforms with the same code in Node or a browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <CodeBlock code={LIBRARY_EXAMPLE} />
            <PackageLinks
              github="https://github.com/bhouston/mtlx/blob/main/packages/core/README.md"
              npm="https://www.npmjs.com/package/mtlx-core"
            />
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        The library design inspired by Don McCurdy's{' '}
        <a href="https://gltf-transform.dev" className="underline underline-offset-4">
          glTF Transform
        </a>
        .
      </p>
    </main>
  );
}
