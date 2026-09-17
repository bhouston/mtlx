// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeParameterEditor } from './NodeParameterEditor.js';
import {
  ColorParameterEditor,
  FloatParameterEditor,
  Vec3ParameterEditor,
  getParameterEditor,
  EnumParameterEditor,
  parseParameterNumber,
} from './parameter-editors.js';
import { cloneMaterialXDocument, parseMaterialX, serializeMaterialX } from 'mtlx-core';
import { createEditorSession } from 'mtlx-core/session';
import { useEditorSession } from './useEditorSession.js';
import { projectGraph, previewXml } from './model.js';

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function fill(input: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
describe('parameter editing', () => {
  it('rejects incomplete, nonfinite and fractional integer values', () => {
    for (const value of ['', ' ', '-', '1e', 'Infinity', 'NaN', '1, 2', '0xff'])
      expect(parseParameterNumber(value)).toBeUndefined();
    expect(parseParameterNumber('1e-3')).toBe(0.001);
    expect(parseParameterNumber('1.5', true)).toBeUndefined();
  });
  it('sizes the slider by the soft range while the field keeps the hard limits', () => {
    act(() =>
      root.render(
        createElement(FloatParameterEditor, {
          parameter: {
            name: 'ior',
            type: 'float',
            attributes: { uimin: '0', uimax: '10', uisoftmin: '1', uisoftmax: '3' },
          },
          value: '1.5',
          ariaLabel: 'ior',
          onChange: vi.fn(),
        }),
      ),
    );
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    expect([slider.min, slider.max]).toEqual(['1', '3']);
    const field = container.querySelector('input[type="text"]')!;
    fill(field, '8');
    expect(field.getAttribute('aria-invalid')).not.toBe('true');
  });
  it('validates drafts and ranges without committing invalid values', () => {
    const onChange = vi.fn();
    act(() =>
      root.render(
        createElement(FloatParameterEditor, {
          parameter: { name: 'roughness', type: 'float', attributes: { uimin: '0', uimax: '1' } },
          value: '0.5',
          ariaLabel: 'roughness',
          onChange,
        }),
      ),
    );
    const input = container.querySelector('input')!;
    fill(input, '-');
    expect(onChange).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    fill(input, '2');
    expect(onChange).not.toHaveBeenCalled();
    fill(input, '0.75');
    expect(onChange).toHaveBeenLastCalledWith('0.75', { merge: expect.any(String) });
    expect(container.querySelector('input[type="range"]')).not.toBeNull();
  });
  it('edits vector components without changing other channels', () => {
    const onChange = vi.fn();
    act(() =>
      root.render(
        createElement(Vec3ParameterEditor, {
          parameter: { name: 'position', type: 'vector3' },
          value: '1, 2, 3',
          ariaLabel: 'position',
          onChange,
        }),
      ),
    );
    const inputs = container.querySelectorAll('input');
    expect(inputs).toHaveLength(3);
    fill(inputs[1]!, 'invalid');
    expect(onChange).not.toHaveBeenCalled();
    fill(inputs[1]!, '4');
    expect(onChange).toHaveBeenLastCalledWith('1, 4, 3', { merge: expect.any(String) });
  });
  it('selects enum editors for integer metadata', () => {
    expect(getParameterEditor({ name: 'mode', type: 'integer', attributes: { enum: 'A, B' } })).toBe(
      EnumParameterEditor,
    );
  });
  it('shows connections instead of values and restores editing after disconnect', () => {
    let doc = parseMaterialX(
      '<materialx version="1.39"><constant name="a" type="float"><input name="value" type="float" value="0.5"/></constant><constant name="b" type="float"><input name="value" type="float" nodename="a"/></constant><output name="out" type="float" nodename="b"/></materialx>',
    );
    const session = createEditorSession({ document: doc });
    const render = (id: string, editable = true) => {
      session.select([id]);
      root.render(createElement(NodeParameterEditor, { session, editable }));
    };
    act(() => render('b'));
    expect(container.querySelector('.mtlx-field input')).toBeNull();
    expect(container.querySelector('output')?.textContent).toBe('a.out');
    act(() => render('b', false));
    expect(container.querySelector('[aria-label="Disconnect value"]')).toBeNull();
    expect(container.querySelector('output')?.textContent).toBe('a.out');
    act(() => render('a', false));
    expect(container.querySelector('[aria-label="Reset value"]')).toBeNull();
    expect(container.querySelectorAll('.mtlx-field input').length).toBeGreaterThan(0);
    for (const input of container.querySelectorAll('.mtlx-field input')) expect(input.disabled).toBe(true);
    act(() => render('b'));
    act(() => (container.querySelector('[aria-label="Disconnect value"]') as HTMLButtonElement).click());
    expect(container.querySelector('.mtlx-field input')).not.toBeNull();
    expect(container.querySelector('output')).toBeNull();
    act(() => render('out'));
    expect(container.querySelector('.mtlx-field input')).toBeNull();
    expect((container.querySelector('[aria-label="Port type"]') as HTMLSelectElement).value).toBe('float');
  });
});

it('keeps colors compact and validates hex edits while preserving alpha and HDR values', () => {
  const onChange = vi.fn();
  function Host() {
    const [value, setValue] = useState('2, 0.5, 0, 0.25');
    return createElement(ColorParameterEditor, {
      parameter: { name: 'tint', type: 'color4' },
      value,
      ariaLabel: 'tint',
      onChange: (next) => {
        onChange(next);
        setValue(next);
      },
    });
  }
  act(() => root.render(createElement(Host)));
  const swatch = container.querySelector('button')!;
  expect(swatch.getAttribute('aria-expanded')).toBe('false');
  expect(container.querySelector('.mtlx-field input')).toBeNull();
  expect(container.textContent).not.toContain('color4');
  act(() => swatch.click());
  const red = container.querySelector('[aria-label="tint R"]') as HTMLInputElement;
  expect(red.value).toBe('2');
  const hex = container.querySelector('[aria-label="tint hex"]') as HTMLInputElement;
  expect(hex.value).toBe('#ff8000');
  fill(hex, '#xyz');
  act(() => hex.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  expect(onChange).not.toHaveBeenCalled();
  fill(hex, '#0f8');
  act(() => hex.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  expect(onChange).toHaveBeenLastCalledWith('0, 1, 0.533333, 0.25');
  expect(hex.value).toBe('#00ff88');
  expect(red.value).toBe('0');
  act(() => swatch.click());
  expect(container.querySelector('.mtlx-field input')).toBeNull();
  act(() => swatch.click());
  expect((container.querySelector('[aria-label="tint hex"]') as HTMLInputElement).value).toBe('#00ff88');
});

it('distinguishes geometry defaults, literals and connections, including reset and disconnect', () => {
  let doc = parseMaterialX(`<materialx version="1.39">
    <nodedef name="ND_geometry_test" node="geometry_test">
      <input name="normal" type="vector3" defaultgeomprop="Nworld"/>
      <input name="tangent" type="vector3" defaultgeomprop="Tworld"/>
      <input name="custom" type="vector2" defaultgeomprop="customUV"/>
      <output name="out" type="vector3"/>
    </nodedef>
    <geometry_test name="surface" type="vector3" nodedef="ND_geometry_test"/>
    <constant name="direction" type="vector3"><input name="value" type="vector3" value="1, 0, 0"/></constant>
  </materialx>`);
  const session = createEditorSession({ document: doc });
  const render = (editable = true) => {
    session.select(['surface']);
    root.render(createElement(NodeParameterEditor, { session, editable }));
  };
  act(() => render());
  expect(container.querySelectorAll('.mtlx-field input')).toHaveLength(0);
  expect(container.textContent).toContain('World-space normal');
  expect(container.textContent).toContain('World-space tangent');
  expect(container.textContent).toContain('Geometry: customUV');
  act(() => {
    session.graph().setInputValue('surface', 'normal', '0, 0, 0');
    render();
  });
  expect(container.querySelector('[aria-label="normal geometry source"]')).toBeNull();
  expect(container.querySelectorAll('.mtlx-field input')).toHaveLength(3);
  act(() => (container.querySelector('[aria-label="Reset normal"]') as HTMLButtonElement).click());
  expect(container.querySelectorAll('.mtlx-field input')).toHaveLength(0);
  expect(container.querySelector('[aria-label="normal geometry source"]')).not.toBeNull();
  act(() => {
    session.graph().connect({ node: 'direction', output: 'out' }, { node: 'surface', input: 'normal' });
    render();
  });
  expect(container.querySelector('[aria-label="normal geometry source"]')).toBeNull();
  expect(container.querySelector('[aria-label="normal connected to"]')?.textContent).toBe('direction.out');
  act(() => (container.querySelector('[aria-label="Disconnect normal"]') as HTMLButtonElement).click());
  expect(container.querySelector('[aria-label="normal geometry source"]')).not.toBeNull();
  act(() => render(false));
  expect(container.querySelector('[aria-label="normal geometry options"]')).toBeNull();
  expect(container.textContent).toContain('World-space normal');
});

it('chooses a temporary parameter type and authors that type only after a value edit', () => {
  let doc = parseMaterialX(
    '<materialx version="1.39"><tiledimage name="image" type="color3" nodedef="ND_tiledimage_color3"/></materialx>',
  );
  const session = createEditorSession({ document: doc });
  const original = serializeMaterialX(doc);
  const preview = previewXml(doc);
  const current = () => (doc = cloneMaterialXDocument(session.getDocument()));
  function render() {
    session.select(['image']);
    root.render(createElement(NodeParameterEditor, { session }));
  }
  act(render);
  const selector = container.querySelector('[aria-label="Edit as"]') as HTMLSelectElement;
  expect(selector.options).toHaveLength(6);
  act(() => {
    selector.value = 'ND_tiledimage_vector3';
    selector.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(container.querySelectorAll('[aria-label^="image default value"]')).toHaveLength(3);
  expect(session.getSnapshot().canUndo).toBe(false);
  expect(serializeMaterialX(current())).toBe(original);
  expect(previewXml(doc)).toBe(preview);
  expect(projectGraph(doc).nodes[0]?.type).toBeUndefined();
  fill(container.querySelector('[aria-label="image file value"]') as HTMLInputElement, 'texture.png');
  expect(projectGraph(current()).nodes[0]?.type).toBeUndefined();
  const inputs = container.querySelectorAll<HTMLInputElement>('[aria-label^="image default value"]');
  fill(inputs[0]!, '0.5');
  expect(projectGraph(current()).nodes[0]?.type).toBe('vector3');
  expect(doc.nodes[0]?.inputs.find((p) => p.name === 'default')).toMatchObject({
    type: 'vector3',
    value: '0.5, 0.0, 0.0',
  });
  expect(container.querySelector('[aria-label="Edit as"]')).toBeNull();
  expect(container.textContent).not.toContain('View only. Editing a value can determine the node’s type.');
  act(() => (container.querySelector('[aria-label="Reset default"]') as HTMLButtonElement).click());
  expect(projectGraph(current()).nodes[0]?.type).toBeUndefined();
  expect(doc.nodes[0]?.inputs.map((p) => p.name)).toEqual(['file']);
  expect((container.querySelector('[aria-label="Edit as"]') as HTMLSelectElement).value).toBe('ND_tiledimage_vector3');
});

it('labels mixed-input overloads distinctly and falls back when a connection invalidates the temporary choice', () => {
  let doc = parseMaterialX(
    '<materialx version="1.39"><add name="a" type="float"/><output name="out" type="color3"/></materialx>',
  );
  const session = createEditorSession({ document: doc });
  function render() {
    session.select(['a']);
    root.render(createElement(NodeParameterEditor, { session }));
  }
  act(render);
  const selector = container.querySelector('[aria-label="Edit as"]') as HTMLSelectElement;
  expect([...selector.options].filter((o) => o.label.startsWith('color3')).map((o) => o.label)).toEqual([
    'color3 (in2: color3)',
    'color3 (in2: float)',
  ]);
  act(() => {
    selector.value = 'ND_add_float';
    selector.dispatchEvent(new Event('change', { bubbles: true }));
  });
  act(() => {
    session.graph().connect({ node: 'a', output: 'out' }, { node: 'out', input: 'in' });
    render();
  });
  expect(selector.value).toBe('ND_add_color3');
  expect(selector.options).toHaveLength(2);
});

it('shares live state and undo between scripts and parameter controls', () => {
  const session = createEditorSession({
    document: parseMaterialX(
      '<materialx version="1.39"><constant name="value" type="float"><input name="value" type="float" value="0.1"/></constant></materialx>',
    ),
  });
  session.select(['value']);
  function Host() {
    const snapshot = useEditorSession(session);
    return createElement(
      'div',
      null,
      createElement('button', { id: 'undo', disabled: !snapshot.canUndo, onClick: session.undo }, 'Undo'),
      createElement(NodeParameterEditor, { session }),
    );
  }
  act(() => root.render(createElement(Host)));
  const input = () => container.querySelector<HTMLInputElement>('[aria-label="value value value"]')!;
  const undo = container.querySelector<HTMLButtonElement>('#undo')!;
  expect(undo.disabled).toBe(true);
  act(() =>
    session.transaction('Script edits', () => {
      session.graph().setInputValue('value', 'value', 0.3);
      session.graph().setInputValue('value', 'value', 0.7);
    }),
  );
  expect(input().value).toBe('0.7');
  fill(input(), '0.9');
  expect(session.graph().getInputs('value')[0]?.value).toBe('0.9');
  act(() => undo.click());
  expect(input().value).toBe('0.7');
  act(() => undo.click());
  expect(input().value).toBe('0.1');
  expect(undo.disabled).toBe(true);
});
