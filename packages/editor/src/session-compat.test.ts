import { expect, it } from 'vitest';
import { parseMaterialX } from 'mtlx-core';
import * as core from 'mtlx-core/session';
import * as editor from 'mtlx-editor';
import { addNode, projectGraph } from './model.js';

it('keeps editor session and mutation exports bound to the core implementation', () => {
  expect(editor.createEditorSession).toBe(core.createEditorSession);
  expect(editor.EditorSession).toBe(core.EditorSession);
  expect(editor.EditorError).toBe(core.EditorError);
  expect(addNode).toBe(core.addNode);
});

it('adds canvas placement only in the editor projection', () => {
  const document = parseMaterialX(
    '<materialx version="1.39"><constant name="placed" type="float" xpos="12" ypos="34"/><constant name="unplaced" type="float"/></materialx>',
  );
  const semantic = core.readGraph(document);
  const canvas = projectGraph(document);
  expect(canvas.nodes[0]!.position).toEqual({ x: 12, y: 34 });
  // Unplaced nodes receive a data-flow layout position rather than their authored coordinates.
  expect(canvas.nodes[1]!.position).not.toEqual(canvas.nodes[0]!.position);
  expect(Number.isFinite(canvas.nodes[1]!.position.y)).toBe(true);
  expect(canvas.nodes.map(({ position: _position, ...node }) => node)).toEqual(semantic.nodes);
  expect(canvas.edges).toEqual(semantic.edges);
  expect(semantic.nodes.every((node) => !('position' in node))).toBe(true);
  const session = core.createEditorSession({ document });
  expect(session.graph().getNode('placed')).not.toHaveProperty('position');
  expect(session.graph().getNode('placed').element.attributes).toMatchObject({ xpos: '12', ypos: '34' });
  expect(session.graph().getNode('unplaced').element.attributes).not.toHaveProperty('xpos');
});
