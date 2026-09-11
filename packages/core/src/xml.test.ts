import { describe, expect, it } from 'vitest';
import { parseMaterialX, serializeMaterialX } from './xml.js';
import { validateDocument } from './validate.js';

const SAMPLE_MTLX = `<?xml version="1.0"?>
<materialx version="1.39" colorspace="lin_rec709">
  <nodegraph name="NG_test">
    <image name="albedo" type="color3">
      <input name="file" type="filename" value="textures/albedo.png" />
    </image>
    <output name="out" type="color3" nodename="albedo" />
  </nodegraph>
  <standard_surface name="SR_test" type="surfaceshader">
    <input name="base_color" type="color3" nodegraph="NG_test" output="out" />
  </standard_surface>
  <surfacematerial name="M_test" type="material">
    <input name="surfaceshader" type="surfaceshader" nodename="SR_test" />
  </surfacematerial>
</materialx>
`;

describe('parseMaterialX / serializeMaterialX', () => {
  it('preserves empty elements, ordered categories, comments and mixed extension text', () => {
    const source =
      '<materialx version="1.39"><look/><image name="a"/><look name="b"/><image name="c"/><custom foo="bar">before<empty/>after</custom><!--keep--></materialx>';
    const first = parseMaterialX(source);
    const xml = serializeMaterialX(first);
    expect(xml).toContain('<look/>');
    expect(xml).not.toContain('look=""');
    expect(xml).toContain('before<empty/>after');
    expect(xml).toContain('<!--keep-->');
    expect(parseMaterialX(xml).elements).toEqual(first.elements);
    expect(first.attributes).toEqual({ version: '1.39' });
  });

  it('parses the document into a lossless element tree mirroring the on-disk structure', () => {
    const document = parseMaterialX(SAMPLE_MTLX);

    expect(document.attributes.version).toBe('1.39');
    expect(document.elements.map((element) => element.name)).toEqual([
      'nodegraph',
      'standard_surface',
      'surfacematerial',
    ]);
    expect(document.nodeGraphs).toHaveLength(1);
    expect(document.nodeGraphs[0]?.name).toBe('NG_test');
    expect(document.nodes.map((node) => node.category)).toEqual(['standard_surface', 'surfacematerial']);
  });

  it('round-trips parse -> serialize -> parse to the same logical document', () => {
    const first = parseMaterialX(SAMPLE_MTLX);
    const xml = serializeMaterialX(first);
    const second = parseMaterialX(xml);

    expect(second.attributes.version).toBe(first.attributes.version);
    expect(second.nodes.map((node) => node.category)).toEqual(first.nodes.map((node) => node.category));
    expect(second.nodeGraphs.map((graph) => graph.name)).toEqual(first.nodeGraphs.map((graph) => graph.name));
  });

  it('throws with line/column info on malformed XML', () => {
    expect(() => parseMaterialX('<materialx><unclosed></materialx>')).toThrow(/line/i);
  });
});

describe('validateDocument', () => {
  it('flags a port with no name as an error', () => {
    const document = parseMaterialX(`<?xml version="1.0"?>
<materialx version="1.39">
  <standard_surface name="SR_test" type="surfaceshader">
    <input type="color3" value="1,0,0" />
  </standard_surface>
</materialx>
`);

    const issues = validateDocument(document);
    expect(issues).toContainEqual(
      expect.objectContaining({ level: 'error', message: 'Node has an input with no name' }),
    );
  });

  it('warns on an unknown node category', () => {
    const document = parseMaterialX(`<?xml version="1.0"?>
<materialx version="1.39">
  <totally_made_up_node name="n1" />
</materialx>
`);

    const issues = validateDocument(document);
    expect(issues).toContainEqual(expect.objectContaining({ level: 'warning' }));
  });
});
