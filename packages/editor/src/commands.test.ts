import { describe, expect, it } from 'vitest';
import { parseMaterialX } from 'mtlx-core';
import { createEditorSession } from 'mtlx-core/session';
import {
  addNode,
  arrange,
  commandState,
  fitView,
  group,
  redo,
  registerCanvas,
  remove,
  resolveCommands,
  undo,
  type Command,
  type CommandContext,
} from './commands.js';
import { projectGraph } from './model.js';

const context = (overrides: Partial<CommandContext> = {}): CommandContext => {
  const session = createEditorSession({
    document: parseMaterialX('<materialx version="1.39"><constant name="a" type="float"/></materialx>'),
  });
  const snapshot = session.getSnapshot();
  return {
    session,
    snapshot,
    projection: projectGraph(session.getDocument() as never),
    editable: true,
    targets: [],
    ...overrides,
  };
};
const fixed = (id: string, visible: boolean): Command => ({ id, label: id, state: () => ({ visible }), run: () => {} });

describe('command resolution', () => {
  it('drops hidden commands and collapses dividers to one between neighbours', () => {
    const resolved = resolveCommands(
      ['divider', fixed('a', true), 'divider', 'divider', fixed('b', false), 'divider', fixed('c', true), 'divider'],
      context(),
    );
    expect(resolved.map((entry) => (entry === 'divider' ? '|' : entry.id))).toEqual(['a', '|', 'c']);
  });
  it('derives visibility and titles from the session', () => {
    const empty = context();
    expect(commandState(undo, empty)).toMatchObject({ enabled: false, title: 'Undo' });
    expect(commandState(redo, empty)).toMatchObject({ enabled: false });
    expect(commandState(remove, empty).visible).toBe(false);
    expect(commandState(group, context({ targets: ['a'] })).visible).toBe(true);
    expect(commandState(group, context({ targets: ['a'], editable: false })).visible).toBe(false);
    expect(commandState(addNode, empty).visible).toBe(false);
    expect(commandState(arrange, empty)).toMatchObject({ visible: true, enabled: true });
    const fitted: (readonly string[] | undefined)[] = [];
    const canvas = {
      addNode: () => {},
      fitView: (ids?: readonly string[]) => fitted.push(ids),
      zoomIn: () => {},
      zoomOut: () => {},
    };
    const withdraw = registerCanvas(empty.session, canvas);
    expect(commandState(fitView, { ...empty, canvas, editable: false })).toMatchObject({
      visible: true,
      title: 'Fit view',
    });
    expect(commandState(fitView, { ...empty, canvas, targets: ['a'] }).title).toBe('Fit selection');
    fitView.run({ ...empty, canvas, targets: ['a'] });
    expect(fitted).toEqual([['a']]);
    withdraw();
    empty.session.graph().removeNodes(['a']);
    expect(commandState(undo, { ...empty, snapshot: empty.session.getSnapshot() })).toMatchObject({
      enabled: true,
      title: 'Undo delete nodes',
    });
  });
});
