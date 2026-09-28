// Build "measurement" emission materials: 4 quadrants, each a float field n_i;
// channel c = 0.1 + 0.6 * (#thresholds T[c][k] exceeded)/4  -> decodable level per channel.
// Levels stay inside [0.1, 0.7] so three's Neutral tone mapping is a constant offset (no cross-channel coupling).
import fs from 'node:fs';

const inp = (name, type, v) =>
  typeof v === 'string' && /^[a-z_]\w*$/i.test(v) && !['true', 'false'].includes(v)
    ? `<input name="${name}" type="${type}" nodename="${v}" />`
    : `<input name="${name}" type="${type}" value="${v}" />`;
export const node = (el, name, type, inputs) =>
  `    <${el} name="${name}" type="${type}">${Object.entries(inputs)
    .map(([k, [t, v]]) => inp(k, t, v))
    .join('')}</${el}>`;

// quads: array of 4 functions (uvNode, i) => { xml, out } ; quadrant order: (u<.5,v<.5), (u>.5,v<.5), (u<.5,v>.5), (u>.5,v>.5)
export function measure(file, quads, T) {
  const L = [];
  L.push(
    `<?xml version="1.0"?>\n<materialx version="1.39" colorspace="lin_rec709">\n  <nodegraph name="NG_m">\n    <texcoord name="uv" type="vector2" />`,
  );
  L.push(
    node('separate2', 'uvs', 'multioutput', { in: ['vector2', 'uv'] }).replace(
      '</separate2>',
      '<output name="outx" type="float" /><output name="outy" type="float" /></separate2>',
    ),
  );
  const chans = [];
  for (let c = 0; c < 3; c++) {
    const qv = [];
    quads.forEach((q, i) => {
      const { xml, out } = q('uv', i);
      if (c === 0) L.push(xml);
      let acc = null;
      T[i][c].forEach((t, k) => {
        const g = `g${i}_${c}_${k}`;
        L.push(
          node('ifgreater', g, 'float', {
            value1: ['float', out],
            value2: ['float', t],
            in1: ['float', 0.15],
            in2: ['float', 0],
          }),
        );
        if (acc) {
          L.push(node('add', `a${g}`, 'float', { in1: ['float', acc], in2: ['float', g] }));
          acc = `a${g}`;
        } else acc = g;
      });
      L.push(node('add', `lv${i}_${c}`, 'float', { in1: ['float', acc], in2: ['float', 0.1] }));
      qv.push(`lv${i}_${c}`);
    });
    // pick quadrant
    L.push(
      `    <ifgreater name="lo${c}" type="float"><input name="value1" type="float" nodename="uvs" output="outx" /><input name="value2" type="float" value="0.5" />${inp('in1', 'float', qv[1])}${inp('in2', 'float', qv[0])}</ifgreater>`,
    );
    L.push(
      `    <ifgreater name="hi${c}" type="float"><input name="value1" type="float" nodename="uvs" output="outx" /><input name="value2" type="float" value="0.5" />${inp('in1', 'float', qv[3])}${inp('in2', 'float', qv[2])}</ifgreater>`,
    );
    L.push(
      `    <ifgreater name="ch${c}" type="float"><input name="value1" type="float" nodename="uvs" output="outy" /><input name="value2" type="float" value="0.5" />${inp('in1', 'float', `hi${c}`)}${inp('in2', 'float', `lo${c}`)}</ifgreater>`,
    );
    chans.push(`ch${c}`);
  }
  L.push(
    node('combine3', 'emit', 'color3', {
      in1: ['float', chans[0]],
      in2: ['float', chans[1]],
      in3: ['float', chans[2]],
    }),
  );
  L.push(`    <output name="emit_out" type="color3" nodename="emit" />\n  </nodegraph>`);
  L.push(`  <standard_surface name="SR_m" type="surfaceshader"><input name="base" type="float" value="0" /><input name="specular" type="float" value="0" /><input name="emission" type="float" value="1" /><input name="emission_color" type="color3" nodegraph="NG_m" output="emit_out" /></standard_surface>
  <surfacematerial name="M_m" type="material"><input name="surfaceshader" type="surfaceshader" nodename="SR_m" /></surfacematerial>\n</materialx>\n`);
  fs.writeFileSync(file, L.join('\n'));
}

// helpers to build a quadrant field
export const scaled = (f) => (uv, i) =>
  node('multiply', `uvf${i}`, 'vector2', { in1: ['vector2', uv], in2: ['float', f] });
export function field(el, type, f, extra = {}, chan = null) {
  return (uv, i) => {
    let xml = scaled(f)(uv, i) + '\n' + node(el, `n${i}`, type, { texcoord: ['vector2', `uvf${i}`], ...extra });
    let out = `n${i}`;
    if (chan) {
      xml += `\n    <extract name="x${i}" type="float"><input name="in" type="${type}" nodename="n${i}" /><input name="index" type="integer" value="${chan}" /></extract>`;
      out = `x${i}`;
    }
    return { xml, out };
  };
}
