import { expect, it } from 'vitest';
import { parseMaterialX } from 'mtlx-core';
import { autoLayout, visibleInputs } from './auto-layout.js';
import { readGraph } from 'mtlx-core/session';
import { projectGraph } from './model.js';

const xml = `<materialx version="1.39">
  <image name="tex" type="color3"><input name="file" type="filename" value="a.png"/></image>
  <multiply name="mul" type="color3"><input name="in1" type="color3" nodename="tex"/></multiply>
  <standard_surface name="surface" type="surfaceshader"><input name="base_color" type="color3" nodename="mul"/></standard_surface>
  <surfacematerial name="material" type="material"><input name="surfaceshader" type="surfaceshader" nodename="surface"/></surfacematerial>
  <constant name="loose" type="float"/>
</materialx>`;

it('places nodes in data-flow columns and stacks each column without overlap', () => {
  const graph = readGraph(parseMaterialX(xml));
  const positions = autoLayout(graph.nodes, graph.edges);
  expect(positions.tex!.x).toBeLessThan(positions.mul!.x);
  expect(positions.mul!.x).toBeLessThan(positions.surface!.x);
  expect(positions.surface!.x).toBeLessThan(positions.material!.x);
  expect(positions.loose!.x).toBe(positions.tex!.x);
  expect(positions.loose!.y).not.toBe(positions.tex!.y);
});
it('is used as the fallback placement for unpositioned documents', () => {
  const projected = projectGraph(parseMaterialX(xml));
  const at = (id: string) => projected.nodes.find((node) => node.id === id)!.position;
  expect(at('material').x).toBeGreaterThan(at('surface').x);
});
it('shows only authored inputs on a collapsed node', () => {
  const surface = readGraph(parseMaterialX(xml)).nodes.find((node) => node.id === 'surface')!;
  expect(visibleInputs(surface).map((port) => port.name)).toEqual(['base_color']);
});
