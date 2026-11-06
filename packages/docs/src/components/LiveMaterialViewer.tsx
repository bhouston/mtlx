import Head from '@docusaurus/Head';
import type {} from 'mtlx-viewer/react';

/** Use the workspace bundle so documentation previews include changes awaiting publication. */
export default function LiveMaterialViewer() {
  return (
    <>
      <Head>
        <script type="module" src="/material-viewer.js" />
      </Head>
      <material-viewer
        src="https://mtlx.ben3d.ca/materials/copper/copper.mtlx"
        alt="Copper material under neutral studio lighting"
        settings-panel="closed"
        style={{ display: 'block', width: '100%', height: 440 }}
      />
    </>
  );
}
