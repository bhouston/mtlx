import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/agents')({
  head: () => ({
    meta: [
      { title: 'mtlx — Agent automation' },
      {
        name: 'description',
        content:
          'Let AI coding agents such as Claude Code and Codex author MaterialX materials: edit, validate, render to an image, look, and iterate.',
      },
    ],
  }),
  component: AgentsPage,
});

const LOOP_EXAMPLE = `npm install -g mtlx-cli

# 1. validate the edit; exits non-zero and lists issues on failure
mtlx check material.mtlx --format json

# 2. render the material headlessly to a PNG the agent can look at
mtlx render material.mtlx -o preview.png
mtlx render material.mtlx -o sphere.png --geometry sphere --material Wood --size 512

# 3. inspect the document structure without opening it
mtlx info material.mtlx --format json`;

const SCRIPT_EXAMPLE = `import { readFile, writeFile } from 'node:fs/promises';
import { parseMaterialX } from 'mtlx-core';
import { createEditorSession } from 'mtlx-core/session';

const editor = createEditorSession({ document: parseMaterialX(await readFile('material.mtlx', 'utf8')) });
const graph = editor.graph('');

editor.transaction('Warmer, rougher wood', () => {
  graph.setInputValue('SR_wood1', 'base_color', [0.55, 0.32, 0.18], { type: 'color3' });
  graph.setInputValue('SR_wood1', 'specular_roughness', 0.7);
});

await writeFile('material.mtlx', editor.toXml());`;

const AGENT_INSTRUCTIONS = `# MaterialX materials in this repo

- Materials are .mtlx XML files. Edit them directly, or run a Node script against mtlx-core/session
  for structural changes (adding nodes, connecting inputs).
- After every edit run \`mtlx check <file> --format json\` and fix any error-level issue.
- Render with \`mtlx render <file> -o <png> --geometry sphere\` and look at the image before
  deciding the material is done. Render the totem too when roughness, coat, or metalness matter.
- Node definitions and their inputs are listed by \`mtlx info <file> --format json\`.`;

const BROWSER_EXAMPLE = `// Run in the /editor page (Playwright evaluate, Claude in Chrome, or the devtools console)
const graph = window.mtlx.graph('');
window.mtlx.transaction('Warmer base color', () => {
  const color = graph.addNode({ definition: 'ND_constant_color3' });
  graph.setInputValue(color, 'value', [0.8, 0.2, 0.1], { type: 'color3' });
  graph.connect({ node: color, output: 'out' }, { node: 'surface', input: 'base_color' });
});
window.mtlx.toXml(); // the edited document, ready to save`;

const STEPS = [
  [
    'Edit',
    'The agent changes the .mtlx file: by hand for parameter tweaks, or through a short script for graph edits.',
  ],
  ['Check', 'mtlx check validates the document and reports issues as JSON, so mistakes are caught before rendering.'],
  ['Render', 'mtlx render draws the material with the same viewer as this site and writes a PNG.'],
  ['Look', 'Claude Code and Codex read images natively. The agent compares the render with the goal and edits again.'],
] as const;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="max-w-full overflow-x-auto rounded-md border border-border bg-muted p-4 text-xs">
      <code>{code}</code>
    </pre>
  );
}

function AgentsPage() {
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Agent automation</h1>
        <p className="text-muted-foreground">
          AI coding agents such as Claude Code and Codex can author and refine{' '}
          <a href="https://materialx.org" className="underline underline-offset-4">
            MaterialX
          </a>{' '}
          materials with the mtlx CLI: edit the file, validate it, render it to an image, look at the result, and
          iterate until it matches the brief. No plugin, server, or protocol is needed; the material is a file and the
          agent already knows how to edit files.
        </p>
        <p className="text-sm text-muted-foreground">
          Part of the{' '}
          <Link to="/" className="text-primary underline underline-offset-4">
            Mtlx suite of web-focused MaterialX tools
          </Link>
          .
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">The loop</h2>
        <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
          {STEPS.map(([name, text], index) => (
            <li key={name} className="flex gap-2">
              <span className="w-5 shrink-0 font-semibold text-foreground">{index + 1}.</span>
              <span>
                <strong className="text-foreground">{name}.</strong> {text}
              </span>
            </li>
          ))}
        </ol>
        <CodeBlock code={LOOP_EXAMPLE} />
        <p className="text-sm text-muted-foreground">
          The PNG has a transparent backdrop by default, so the agent sees only the model and never has to separate it
          from the environment; <code>--background environment</code> shows the IBL instead. <code>mtlx render</code>{' '}
          runs headlessly in a Chromium-based browser already on the machine: Google Chrome, then Microsoft Edge, on
          macOS, Windows, and Linux. Nothing is downloaded at install time. Set <code>MTLX_BROWSER</code> or pass{' '}
          <code>--browser</code> to use a specific executable. A material that fails to compile exits non-zero with the
          viewer's error message, so the agent can read it and repair the file.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Structural edits with a script</h2>
        <p className="text-sm text-muted-foreground">
          Parameter changes are easiest as direct XML edits. For adding nodes, connecting inputs, or anything that must
          stay valid, <code>mtlx-core/session</code> gives the agent the same operations the{' '}
          <Link to="/editor" className="text-primary underline underline-offset-4">
            Editor
          </Link>{' '}
          uses, with validation on every step. It runs in plain Node with no DOM or renderer.
        </p>
        <CodeBlock code={SCRIPT_EXAMPLE} />
        <p className="text-sm text-muted-foreground">
          See the{' '}
          <a href="https://www.npmjs.com/package/mtlx-core" className="text-primary underline underline-offset-4">
            mtlx-core
          </a>{' '}
          README for the full session API: adding and removing nodes, connections, diagnostics, undo, and nested graphs.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Telling the agent about it</h2>
        <p className="text-sm text-muted-foreground">
          Drop a few lines into the project's agent instructions file (<code>CLAUDE.md</code>, <code>AGENTS.md</code>,
          or equivalent) so the agent knows the tools exist and checks its own work:
        </p>
        <CodeBlock code={AGENT_INSTRUCTIONS} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Working in the browser instead</h2>
        <p className="text-sm text-muted-foreground">
          Agents that drive a browser, such as Claude Code with the Claude in Chrome extension or any client with a
          Playwright MCP server, can open the{' '}
          <Link to="/editor" className="text-primary underline underline-offset-4">
            Editor
          </Link>{' '}
          and{' '}
          <Link to="/viewer" className="text-primary underline underline-offset-4">
            Viewer
          </Link>{' '}
          here and take screenshots of the preview. The editor page exposes its live session as <code>window.mtlx</code>
          , so an agent can script edits with the same API as above instead of clicking through the graph, and the
          canvas and node graph update as it works.
        </p>
        <CodeBlock code={BROWSER_EXAMPLE} />
        <p className="text-sm text-muted-foreground">
          That works for demos where a person watches along. For repeatable, scriptable results the CLI loop above is
          the recommended path.
        </p>
      </section>
    </main>
  );
}
