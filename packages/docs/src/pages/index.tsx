import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

const packages = [
  {
    name: 'mtlx-core',
    label: 'Document and editing library',
    href: '/docs/core',
    body: 'Parse and validate MaterialX, manage packaged resources, and edit graphs through a headless session.',
  },
  {
    name: 'mtlx-viewer',
    label: 'Web component and React',
    href: '/docs/viewer',
    body: 'Bring the same material preview into your own application, with camera controls, lighting and capture.',
  },
  {
    name: 'mtlx-editor',
    label: 'React graph editor',
    href: '/docs/editor',
    body: 'Build an editor from reusable graph, parameter and toolbar components connected to one session.',
  },
  {
    name: 'mtlx-sdk',
    label: 'MTLX.ai service client',
    href: '/docs/sdk',
    body: 'Use typed operations for hosted materials, users, uploads and authentication.',
  },
];
const workflow = [
  ['Read', 'Loose .mtlx or portable .mtlx.zip'],
  ['Inspect', 'Validation, resources and rendered detail'],
  ['Edit', 'Node graphs, parameters and undo'],
  ['Deliver', 'Editable materials, previews and links'],
];

export default function Home() {
  return (
    <Layout
      title="MaterialX tools for the web, terminal and editor"
      description="View, edit, validate and automate MaterialX with an open-source TypeScript toolkit for browsers, Node and VS Code."
    >
      <header className="home-hero container">
        <div>
          <p className="eyebrow">MaterialX · TypeScript · Open source</p>
          <h1>
            Work with the material.
            <br />
            <em>Keep the source.</em>
          </h1>
          <p className="hero-description">
            See what a MaterialX file looks like, understand its graph, and make it your own. One toolkit connects your
            browser, terminal, code editor and application.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary button--lg" to="/viewer">
              Try the material viewer <span aria-hidden>→</span>
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/quick-start">
              Get started
            </Link>
          </div>
        </div>
        <figure className="hero-preview">
          <Link to="/viewer">
            <img
              src="/img/material-preview.png"
              alt="A copper material under neutral studio lighting in the MaterialX viewer"
              width="960"
              height="700"
            />
          </Link>
        </figure>
      </header>
      <main>
        <section className="workflow-band" aria-label="Material workflow">
          <div className="container workflow-steps">
            {workflow.map(([title, detail], index) => (
              <div key={title}>
                <span className="workflow-number">0{index + 1}</span>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="container story-section editor-story" aria-labelledby="editor-title">
          <figure className="product-shot">
            <img
              src="/img/node-editor.png"
              alt="The MaterialX node editor with a graph, parameter inspector and live copper preview"
              width="1200"
              height="800"
              loading="lazy"
            />
          </figure>
          <div>
            <p className="eyebrow">A graph you can work with</p>
            <h2 id="editor-title">
              Edit the nodes.
              <br />
              See the result.
            </h2>
            <p>
              Open a material, follow its connections and change a parameter. The live preview shares the same renderer
              as the viewer, while the graph stays editable MaterialX.
            </p>
            <ul className="feature-list">
              <li>Inspect parameters and navigate nested graphs.</li>
              <li>Connect nodes with validation and undo/redo.</li>
              <li>Save the material or share an editable snapshot.</li>
            </ul>
            <div className="story-links">
              <Link className="button button--primary" to="/editor">
                Open the node editor
              </Link>
              <Link to="/docs/editor">Build your own editor →</Link>
            </div>
          </div>
        </section>
        <section className="terminal-section">
          <div className="container story-section">
            <div>
              <p className="eyebrow">Repeatable by design</p>
              <h2>
                Move your material
                <br />
                workflow into code.
              </h2>
              <p>
                Inspect and validate before a material reaches your pipeline. Package resources, convert textures, or
                render previews in scripts and agent workflows.
              </p>
              <div className="story-links">
                <Link className="button button--primary" to="/docs/cli">
                  Install the CLI
                </Link>
                <Link to="/docs/agents">Agents and automation →</Link>
              </div>
            </div>
            <div className="terminal-window">
              <div className="terminal-heading">
                <span>● ● ●</span> MaterialX / terminal
              </div>
              <pre>
                <code>{`npm install -g mtlx-cli

# Understand the document
mtlx info copper.mtlx
mtlx check copper.mtlx

# Inspect it in a browser
mtlx view copper.mtlx

# Produce a preview for your pipeline
mtlx render copper.mtlx -o copper.png \\
  --view sphere --ibl studio`}</code>
              </pre>
            </div>
          </div>
        </section>
        <section className="container story-section extension-story">
          <div>
            <p className="eyebrow">Beside your source</p>
            <h2>Stay in VS Code.</h2>
            <p>
              Check a MaterialX document, inspect its graph and keep a live material preview beside the XML. The
              extension uses the same core and rendering packages as the web tools.
            </p>
            <Link className="button button--secondary" to="/docs/vscode">
              Install the extension
            </Link>
          </div>
          <figure className="product-shot">
            <img
              src="/img/extension.gif"
              alt="MaterialX validation and material preview inside Visual Studio Code"
              width="1000"
              height="620"
              loading="lazy"
            />
          </figure>
        </section>
        <section className="embed-section">
          <div className="container story-section">
            <div>
              <p className="eyebrow">Your page. Your material.</p>
              <h2>
                A preview wherever
                <br />
                you need one.
              </h2>
              <p>
                Use a self-contained web component in plain HTML, or the React wrapper in your application. Add an
                accessible description, set the camera, and control lighting independently of the background.
              </p>
              <div className="story-links">
                <Link className="button button--primary" to="/docs/material-viewer">
                  Embed a material
                </Link>
                <Link to="/docs/viewer">React and viewer API →</Link>
              </div>
            </div>
            <pre className="embed-example">
              <code>{`<script type="module"
  src="https://mtlx.ben3d.ca/material-viewer.js">
</script>

<material-viewer
  src="/materials/copper/copper.mtlx"
  alt="Brushed copper with fine grain"
  settings-panel="closed"
  background="white"
  environment-rotation="30"
  style="display:block;height:500px">
</material-viewer>`}</code>
            </pre>
          </div>
        </section>
        <section className="container package-section" aria-labelledby="packages-title">
          <div className="section-heading">
            <p className="eyebrow">Build on the same foundation</p>
            <h2 id="packages-title">Use the part you need.</h2>
            <p>The online tools are one way to use mtlx. Each library has its own guide and generated API reference.</p>
          </div>
          <div className="package-grid">
            {packages.map((pkg) => (
              <article key={pkg.name} className="package-card">
                <p className="package-label">{pkg.label}</p>
                <h3>
                  <code>{pkg.name}</code>
                </h3>
                <p>{pkg.body}</p>
                <pre>
                  <code>{pkg.name === 'mtlx-editor' ? 'Build from this repository' : `npm install ${pkg.name}`}</code>
                </pre>
                <Link to={pkg.href}>Read the guide →</Link>
              </article>
            ))}
          </div>
        </section>
        <section className="container home-callout">
          <div>
            <p className="eyebrow">Start with a real material</p>
            <h2>From a file to a working preview.</h2>
            <p>
              Choose a sample, drop in your own MaterialX file, or follow the quick start for your first validation and
              integration.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="button button--primary button--lg" to="/viewer">
              Open the viewer
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/quick-start">
              Read the quick start
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
