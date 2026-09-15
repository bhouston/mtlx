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
import { parseMaterialX } from 'mtlx-core';
import { projectGraph, setInputValue, connectNodes } from './model.js';

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
    expect(onChange).toHaveBeenLastCalledWith('0.75');
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
    expect(onChange).toHaveBeenLastCalledWith('1, 4, 3');
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
    const render = (id: string) => {
      const projection = projectGraph(doc);
      root.render(
        createElement(NodeParameterEditor, {
          document: doc,
          projection,
          node: projection.nodes.find((n) => n.id === id),
          editable: true,
          commit: (operation) => {
            doc = operation();
            render(id);
          },
        }),
      );
    };
    act(() => render('b'));
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('output')?.textContent).toBe('a.out');
    act(() => (container.querySelector('[aria-label="Disconnect value"]') as HTMLButtonElement).click());
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.querySelector('output')).toBeNull();
    act(() => render('out'));
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('.mtlx-field')).toBeNull();
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
  expect(container.querySelector('input')).toBeNull();
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
  expect(container.querySelector('input')).toBeNull();
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
  const render = (editable = true) => {
    const projection = projectGraph(doc);
    root.render(
      createElement(NodeParameterEditor, {
        document: doc,
        projection,
        node: projection.nodes.find((n) => n.id === 'surface'),
        editable,
        commit: (operation) => {
          doc = operation();
          render(editable);
        },
      }),
    );
  };
  act(() => render());
  expect(container.querySelectorAll('input')).toHaveLength(0);
  expect(container.textContent).toContain('World-space normal');
  expect(container.textContent).toContain('World-space tangent');
  expect(container.textContent).toContain('Geometry: customUV');
  act(() => {
    doc = setInputValue(doc, 'surface', 'normal', '0, 0, 0');
    render();
  });
  expect(container.querySelector('[aria-label="normal geometry source"]')).toBeNull();
  expect(container.querySelectorAll('input')).toHaveLength(3);
  act(() => (container.querySelector('[aria-label="Reset normal"]') as HTMLButtonElement).click());
  expect(container.querySelectorAll('input')).toHaveLength(0);
  expect(container.querySelector('[aria-label="normal geometry source"]')).not.toBeNull();
  act(() => {
    doc = connectNodes(doc, { source: 'direction', sourceHandle: 'out', target: 'surface', targetHandle: 'normal' });
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
