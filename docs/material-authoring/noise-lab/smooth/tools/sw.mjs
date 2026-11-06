// Tiny XML builder for swatch materials: a grid of panels, each panel a node chain ending in a float.
// mode 'emit': panel value shown as unlit grey (emission). mode 'lit': panel value is height in meters.
import fs from 'node:fs';

const isRef = (v) => typeof v === 'string' && /^[a-z_][\w.]*$/i.test(v) && !['true', 'false'].includes(v);
export function n(el, name, type, inputs, comment) {
  const ins = Object.entries(inputs)
    .map(([k, [t, v]]) => {
      if (isRef(v)) {
        const [nn, out] = v.split('.');
        return `<input name="${k}" type="${t}" nodename="${nn}"${out ? ` output="${out}"` : ''} />`;
      }
      return `<input name="${k}" type="${t}" value="${v}" />`;
    })
    .join('');
  const outs =
    type === 'multioutput'
      ? el === 'separate3'
        ? '<output name="outx" type="float" /><output name="outy" type="float" /><output name="outz" type="float" />'
        : '<output name="outx" type="float" /><output name="outy" type="float" />'
      : '';
  return `${comment ? `    <!-- ${comment} -->\n` : ''}    <${el} name="${name}" type="${type}">${ins}${outs}</${el}>`;
}

// panels: [{ label, xml:[lines], out }] laid out cols x rows, row 0 at the bottom (v increases upward)
export function swatch({ file, name, title, cols, rows, panels, mode = 'emit', heightScale = 1, color = null }) {
  const L = [
    `<?xml version="1.0"?>`,
    `<materialx version="1.39" colorspace="lin_rec709">`,
    `  <!-- ${title}`,
    `       UV 0..1 = 1 m. Layout (${cols}x${rows}, row 1 at the bottom = v small, column 1 at the left):`,
  ];
  panels.forEach((p, i) => L.push(`         [r${Math.floor(i / cols) + 1} c${(i % cols) + 1}] ${p.label}`));
  L.push(
    `  -->`,
    `  <nodegraph name="NG_${name}">`,
    `    <texcoord name="uv" type="vector2" />`,
    n('separate2', 'uv_s', 'multioutput', { in: ['vector2', 'uv'] }),
  );
  panels.forEach((p, i) => {
    const r = Math.floor(i / cols),
      c = i % cols,
      id = `p${r + 1}${c + 1}`;
    L.push(`\n    <!-- ===== [r${r + 1} c${c + 1}] ${p.label} ===== -->`);
    // panel-local texcoord: every panel samples the same 0..1/cols x 0..1/rows patch of the pattern
    const uvl = c || r ? `${id}_uv0` : 'uv';
    if (uvl !== 'uv')
      L.push(
        n('subtract', uvl, 'vector2', {
          in1: ['vector2', 'uv'],
          in2: ['vector2', `${(c / cols).toFixed(4)}, ${(r / rows).toFixed(4)}`],
        }),
      );
    const b = p.build(id, uvl);
    p.out = b.out;
    L.push(...b.xml);
  });
  L.push(`\n    <!-- ===== panel selection ===== -->`);
  const rowOut = [];
  for (let r = 0; r < rows; r++) {
    let cur = panels[r * cols].out;
    for (let c = 1; c < cols; c++) {
      const nm = `sel_r${r}_c${c}`;
      L.push(
        n('ifgreater', nm, 'float', {
          value1: ['float', 'uv_s.outx'],
          value2: ['float', (c / cols).toFixed(4)],
          in1: ['float', panels[r * cols + c].out],
          in2: ['float', cur],
        }),
      );
      cur = nm;
    }
    rowOut.push(cur);
  }
  let cur = rowOut[0];
  for (let r = 1; r < rows; r++) {
    const nm = `sel_row${r}`;
    L.push(
      n('ifgreater', nm, 'float', {
        value1: ['float', 'uv_s.outy'],
        value2: ['float', (r / rows).toFixed(4)],
        in1: ['float', rowOut[r]],
        in2: ['float', cur],
      }),
    );
    cur = nm;
  }
  L.push(n('multiply', 'value', 'float', { in1: ['float', cur], in2: ['float', 1] }, 'selected panel value'));
  if (mode === 'emit') {
    L.push(n('convert', 'value_c', 'color3', { in: ['float', 'value'] }));
    L.push(`    <output name="emission_out" type="color3" nodename="value_c" />`, `  </nodegraph>`);
    L.push(
      `  <standard_surface name="SR_${name}" type="surfaceshader"><input name="base" type="float" value="0" /><input name="specular" type="float" value="0" /><input name="emission" type="float" value="1" /><input name="emission_color" type="color3" nodegraph="NG_${name}" output="emission_out" /></standard_surface>`,
    );
  } else {
    L.push(`\n    <!-- ===== height (m) -> normal via the millimeter workaround ===== -->`);
    L.push(n('multiply', 'uv_mm', 'vector2', { in1: ['vector2', 'uv'], in2: ['float', 1000] }));
    L.push(n('multiply', 'height_mm', 'float', { in1: ['float', 'value'], in2: ['float', 1000 * heightScale] }));
    L.push(
      n('heighttonormal', 'n_tangent', 'vector3', {
        in: ['float', 'height_mm'],
        scale: ['float', 16],
        texcoord: ['vector2', 'uv_mm'],
      }),
    );
    L.push(n('normalmap', 'n_world', 'vector3', { in: ['vector3', 'n_tangent'] }));
    L.push(`    <!-- colour: grey concrete-like tone, brighter on highs so relief and value agree -->`);
    L.push(n('multiply', 'h_norm', 'float', { in1: ['float', 'value'], in2: ['float', color ?? 1] }));
    L.push(n('clamp', 'h_c', 'float', { in: ['float', 'h_norm'], low: ['float', -1], high: ['float', 1] }));
    L.push(n('multiply', 'tone_a', 'float', { in1: ['float', 'h_c'], in2: ['float', 0.12] }));
    L.push(n('add', 'tone', 'float', { in1: ['float', 'tone_a'], in2: ['float', 0.38] }));
    L.push(n('convert', 'base_color', 'color3', { in: ['float', 'tone'] }));
    L.push(n('constant', 'rough', 'float', { value: ['float', 0.8] }));
    L.push(n('constant', 'metal', 'float', { value: ['float', 0] }));
    L.push(
      `    <output name="base_color_out" type="color3" nodename="base_color" />`,
      `    <output name="roughness_out" type="float" nodename="rough" />`,
      `    <output name="metalness_out" type="float" nodename="metal" />`,
      `    <output name="normal_out" type="vector3" nodename="n_world" />`,
      `  </nodegraph>`,
    );
    L.push(
      `  <standard_surface name="SR_${name}" type="surfaceshader">`,
      `    <input name="base" type="float" value="1" />`,
      `    <input name="base_color" type="color3" nodegraph="NG_${name}" output="base_color_out" />`,
      `    <input name="specular" type="float" value="0.5" />`,
      `    <input name="specular_IOR" type="float" value="1.5" />`,
      `    <input name="specular_roughness" type="float" nodegraph="NG_${name}" output="roughness_out" />`,
      `    <input name="metalness" type="float" nodegraph="NG_${name}" output="metalness_out" />`,
      `    <input name="normal" type="vector3" nodegraph="NG_${name}" output="normal_out" />`,
      `  </standard_surface>`,
    );
  }
  L.push(
    `  <surfacematerial name="M_${name}" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_${name}" /></surfacematerial>`,
    `</materialx>`,
    ``,
  );
  fs.writeFileSync(file, L.join('\n'));
}

// common panel pieces
export const uvScale = (id, f, off = null, uv = 'uv') => {
  const xml = [
    n('multiply', `${id}_uv`, 'vector2', {
      in1: ['vector2', uv],
      in2: [Array.isArray(f) ? 'vector2' : 'float', Array.isArray(f) ? f.join(', ') : f],
    }),
  ];
  if (off === null) return { xml, uv: `${id}_uv` };
  xml.push(n('add', `${id}_uvo`, 'vector2', { in1: ['vector2', `${id}_uv`], in2: ['vector2', off.join(', ')] }));
  return { xml, uv: `${id}_uvo` };
};
// remap signed x to grey: 0.5 + 0.5*x (then optional posterize is done by caller)
export const grey = (id, src, k = 0.5) => [
  n('multiply', `${id}_g0`, 'float', { in1: ['float', src], in2: ['float', k] }),
  n('add', `${id}_g`, 'float', { in1: ['float', `${id}_g0`], in2: ['float', 0.5] }),
];
// posterize signed x into 5 levels at thresholds -0.4, 0, 0.4, 0.8  -> 0, .25, .5, .75, 1
export const bands = (id, src, T = [-0.4, 0, 0.4, 0.8]) => {
  const xml = [];
  let acc = null;
  T.forEach((t, k) => {
    xml.push(
      n('ifgreater', `${id}_t${k}`, 'float', {
        value1: ['float', src],
        value2: ['float', t],
        in1: ['float', 1 / T.length],
        in2: ['float', 0],
      }),
    );
    if (acc) {
      xml.push(n('add', `${id}_s${k}`, 'float', { in1: ['float', acc], in2: ['float', `${id}_t${k}`] }));
      acc = `${id}_s${k}`;
    } else acc = `${id}_t${k}`;
  });
  return { xml, out: acc };
};
