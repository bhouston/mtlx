import { DropdownMenu } from 'radix-ui';
import { Diamond, Ellipsis, Link2, RefreshCw, Unplug } from 'lucide-react';
import { useId, useState, type ComponentType, type ReactNode } from 'react';
import { RgbColorPicker, RgbaColorPicker } from 'react-colorful';
import type { MaterialXNodePortSpec } from './model.js';

export interface ParameterEditorProps {
  parameter: MaterialXNodePortSpec;
  value: string;
  ariaLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onReset?: () => void;
}
/** Implementations own their layout and use ParameterLabel for consistent labels. */
export type ParameterEditor = ComponentType<ParameterEditorProps>;

export function ParameterLabel({ parameter, htmlFor }: { parameter: MaterialXNodePortSpec; htmlFor: string }) {
  return (
    <label className="mtlx-parameter-label" htmlFor={htmlFor} title={parameter.attributes?.doc ?? parameter.name}>
      <span>{parameter.attributes?.uiname || parameter.name}</span>
    </label>
  );
}
function ResetButton({ props }: { props: ParameterEditorProps }) {
  if (!props.onReset) return null;
  return (
    <button
      type="button"
      className="mtlx-parameter-icon-button"
      title="Reset to default"
      aria-label={`Reset ${props.parameter.name}`}
      onClick={props.onReset}
    >
      <RefreshCw size={14} aria-hidden="true" />
    </button>
  );
}
function Row({ props, id, children }: { props: ParameterEditorProps; id: string; children: ReactNode }) {
  return (
    <div className={`mtlx-parameter-row${props.onReset ? ' mtlx-parameter-row-reset' : ''}`}>
      <ParameterLabel parameter={props.parameter} htmlFor={id} />
      {children}
      <ResetButton props={props} />
    </div>
  );
}

export function parseParameterNumber(value: string, integer = false): number | undefined {
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && (!integer || Number.isSafeInteger(number)) ? number : undefined;
}
function bounds(parameter: MaterialXNodePortSpec) {
  return {
    min: parseParameterNumber(parameter.attributes?.uimin ?? ''),
    max: parseParameterNumber(parameter.attributes?.uimax ?? ''),
  };
}
function NumberField({
  value,
  onChange,
  integer = false,
  min,
  max,
  ...props
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  integer?: boolean;
  min?: number;
  max?: number;
  disabled?: boolean;
  'aria-label': string;
}) {
  const [draft, setDraft] = useState<{ source: string; text: string }>();
  const text = draft?.source === value ? draft.text : value;
  const number = parseParameterNumber(text, integer);
  const valid = number !== undefined && (min === undefined || number >= min) && (max === undefined || number <= max);
  const errorId = useId();
  return (
    <div className="mtlx-number-field">
      <input
        {...props}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        value={text}
        aria-invalid={!valid && text !== ''}
        aria-describedby={!valid && text !== '' ? errorId : undefined}
        onChange={(event) => {
          const next = event.target.value;
          setDraft({ source: value, text: next });
          const n = parseParameterNumber(next, integer);
          if (n !== undefined && (min === undefined || n >= min) && (max === undefined || n <= max)) {
            onChange(String(n));
            setDraft({ source: String(n), text: next });
          }
        }}
        onBlur={() => setDraft(undefined)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' || event.key === 'Enter') {
            setDraft(undefined);
            event.currentTarget.blur();
          }
        }}
      />
      {!valid && text !== '' && (
        <small id={errorId} className="mtlx-parameter-error">
          Enter a valid {integer ? 'integer' : 'number'}
          {min !== undefined ? ` ≥ ${min}` : ''}
          {max !== undefined ? ` ≤ ${max}` : ''}.
        </small>
      )}
    </div>
  );
}
export const FloatParameterEditor: ParameterEditor = (props) => {
  const id = useId();
  const limits = bounds(props.parameter);
  const value = parseParameterNumber(props.value) ?? 0;
  const min = limits.min ?? Math.min(0, value);
  const max = limits.max ?? Math.max(1, value);
  const integer = props.parameter.type === 'integer';
  return (
    <>
      <Row props={props} id={id}>
        <NumberField
          id={id}
          aria-label={props.ariaLabel}
          value={props.value}
          disabled={props.disabled}
          onChange={props.onChange}
          integer={integer}
          {...limits}
        />
      </Row>
      <input
        className="mtlx-parameter-slider"
        type="range"
        aria-label={`${props.ariaLabel} slider`}
        disabled={props.disabled || max <= min}
        min={min}
        max={max}
        step={integer ? 1 : 'any'}
        value={Math.max(min, Math.min(max, value))}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </>
  );
};
export const IntegerParameterEditor: ParameterEditor = (props) => (
  <FloatParameterEditor {...props} parameter={{ ...props.parameter, type: 'integer' }} />
);

function ComponentsEditor(
  props: ParameterEditorProps & { components: string[]; children?: ReactNode; hideLabel?: boolean },
) {
  const id = useId();
  const values = props.value.split(',').map((v) => v.trim());
  return (
    <>
      {!props.hideLabel && (
        <div className="mtlx-parameter-heading">
          <ParameterLabel parameter={props.parameter} htmlFor={`${id}-0`} />
          <ResetButton props={props} />
        </div>
      )}
      <div
        className="mtlx-parameter-components"
        style={{
          gridTemplateColumns: `repeat(${props.components.length > 4 ? Math.sqrt(props.components.length) : props.components.length}, minmax(0, 1fr))`,
        }}
      >
        {props.components.map((component, index) => (
          <div key={component}>
            <label className="mtlx-component-label" htmlFor={`${id}-${index}`}>
              {component}
            </label>
            <NumberField
              id={`${id}-${index}`}
              aria-label={`${props.ariaLabel} ${component}`}
              value={values[index] ?? ''}
              disabled={props.disabled}
              {...bounds(props.parameter)}
              onChange={(value) => {
                const next = props.components.map((_, i) => (i === index ? value : values[i] || '0'));
                if (next.every((v) => parseParameterNumber(v) !== undefined)) props.onChange(next.join(', '));
              }}
            />
          </div>
        ))}
      </div>
      {props.children}
    </>
  );
}
export const Vec2ParameterEditor: ParameterEditor = (props) => <ComponentsEditor {...props} components={['X', 'Y']} />;
export const Vec3ParameterEditor: ParameterEditor = (props) => (
  <ComponentsEditor {...props} components={['X', 'Y', 'Z']} />
);
export const Vec4ParameterEditor: ParameterEditor = (props) => (
  <ComponentsEditor {...props} components={['X', 'Y', 'Z', 'W']} />
);
export const MatrixParameterEditor: ParameterEditor = (props) => {
  const size = props.parameter.type === 'matrix33' ? 3 : 4;
  return (
    <ComponentsEditor
      {...props}
      components={Array.from({ length: size * size }, (_, i) => `${Math.floor(i / size) + 1},${(i % size) + 1}`)}
    />
  );
};
function ColorHexField({
  value,
  disabled,
  ariaLabel,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  ariaLabel: string;
  onChange: (hex: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<{ source: string; text: string }>();
  const text = draft?.source === value ? draft.text : value;
  const valid = /^#?(?:[\da-f]{3}|[\da-f]{6})$/i.test(text);
  const commit = () => {
    if (valid && text !== value) {
      const hex = text.replace(/^#/, '');
      onChange(
        hex.length === 3
          ? hex
              .split('')
              .map((c) => c + c)
              .join('')
          : hex,
      );
    }
    setDraft(undefined);
  };
  return (
    <div className="mtlx-parameter-row">
      <label className="mtlx-component-label" htmlFor={id}>
        Hex
      </label>
      <input
        id={id}
        aria-label={`${ariaLabel} hex`}
        value={text}
        disabled={disabled}
        spellCheck={false}
        aria-invalid={!valid}
        aria-describedby={!valid ? `${id}-error` : undefined}
        onChange={(event) => setDraft({ source: value, text: event.target.value })}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') setDraft(undefined);
        }}
      />
      {!valid && (
        <small id={`${id}-error`} className="mtlx-parameter-error">
          Enter 3 or 6 hex digits.
        </small>
      )}
    </div>
  );
}
export const ColorParameterEditor: ParameterEditor = (props) => {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const alpha = props.parameter.type === 'color4';
  const values = props.value.split(',').map(Number);
  const channel = (index: number) => Math.max(0, Math.min(1, Number.isFinite(values[index]) ? values[index]! : 0));
  const color = { r: channel(0) * 255, g: channel(1) * 255, b: channel(2) * 255, a: channel(3) };
  const hex = '#' + [color.r, color.g, color.b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
  const change = (next: { r: number; g: number; b: number; a?: number }) =>
    props.onChange(
      [next.r / 255, next.g / 255, next.b / 255, ...(alpha ? [next.a ?? values[3] ?? 1] : [])]
        .map((v) => Number(v.toFixed(6)))
        .join(', '),
    );
  return (
    <>
      <Row props={props} id={id}>
        <button
          id={id}
          type="button"
          className="mtlx-color-swatch"
          aria-label={`${props.ariaLabel} color picker`}
          aria-expanded={expanded}
          aria-controls={`${id}-controls`}
          title={`${expanded ? 'Collapse' : 'Edit'} color (${hex})`}
          style={{ backgroundColor: hex }}
          onClick={() => setExpanded(!expanded)}
        />
      </Row>
      {expanded && (
        <div id={`${id}-controls`} className="mtlx-color-picker">
          {!props.disabled &&
            (alpha ? (
              <RgbaColorPicker color={color} onChange={change} />
            ) : (
              <RgbColorPicker color={color} onChange={change} />
            ))}
          <ComponentsEditor {...props} hideLabel components={alpha ? ['R', 'G', 'B', 'A'] : ['R', 'G', 'B']} />
          <ColorHexField
            value={hex}
            ariaLabel={props.ariaLabel}
            disabled={props.disabled}
            onChange={(next) => {
              const rgb = [0, 2, 4].map((offset) =>
                Number((parseInt(next.slice(offset, offset + 2), 16) / 255).toFixed(6)),
              );
              props.onChange([...rgb, ...(alpha ? [props.value.split(',')[3]?.trim() || '1'] : [])].join(', '));
            }}
          />
        </div>
      )}
    </>
  );
};
export const BooleanParameterEditor: ParameterEditor = (props) => {
  const id = useId();
  return (
    <Row props={props} id={id}>
      <input
        id={id}
        type="checkbox"
        aria-label={props.ariaLabel}
        disabled={props.disabled}
        checked={props.value === 'true' || props.value === '1'}
        onChange={(event) => props.onChange(String(event.target.checked))}
      />
    </Row>
  );
};
export const EnumParameterEditor: ParameterEditor = (props) => {
  const id = useId();
  const labels = props.parameter.attributes?.enum?.split(',').map((v) => v.trim()) ?? [];
  const values = props.parameter.attributes?.enumvalues?.split(',').map((v) => v.trim());
  const options = labels.map((label, i) => ({
    label,
    value: values?.[i] ?? (props.parameter.type === 'integer' ? String(i) : label),
  }));
  return (
    <Row props={props} id={id}>
      <select
        id={id}
        aria-label={props.ariaLabel}
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
      >
        {!options.some((o) => o.value === props.value) && (
          <option value={props.value}>{props.value || 'Default'}</option>
        )}
        {options.map((o, i) => (
          <option key={i} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Row>
  );
};
export const TextParameterEditor: ParameterEditor = (props) => {
  const id = useId();
  return (
    <Row props={props} id={id}>
      <input
        id={id}
        aria-label={props.ariaLabel}
        value={props.value}
        disabled={props.disabled}
        placeholder={props.parameter.attributes?.defaultgeomprop ?? 'Default'}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </Row>
  );
};
export const ReadOnlyParameterEditor: ParameterEditor = (props) => <TextParameterEditor {...props} disabled />;

export const parameterEditors: Readonly<Record<string, ParameterEditor>> = {
  float: FloatParameterEditor,
  integer: IntegerParameterEditor,
  boolean: BooleanParameterEditor,
  color3: ColorParameterEditor,
  color4: ColorParameterEditor,
  vector2: Vec2ParameterEditor,
  vector3: Vec3ParameterEditor,
  vector4: Vec4ParameterEditor,
  matrix33: MatrixParameterEditor,
  matrix44: MatrixParameterEditor,
  string: TextParameterEditor,
  filename: TextParameterEditor,
  geomname: TextParameterEditor,
};
export function getParameterEditor(parameter: MaterialXNodePortSpec): ParameterEditor {
  if (parameter.attributes?.enum && ['string', 'integer'].includes(parameter.type ?? '')) return EnumParameterEditor;
  return parameterEditors[parameter.type ?? ''] ?? ReadOnlyParameterEditor;
}

export type ConnectedParameterEditorProps = ParameterEditorProps & {
  source: string;
  onDisconnect: () => void;
};
export function ConnectedParameterEditor(props: ConnectedParameterEditorProps) {
  const id = useId();
  return (
    <div className="mtlx-connected-parameter">
      <ParameterLabel parameter={props.parameter} htmlFor={id} />
      <div className="mtlx-connection-source">
        <Link2 size={16} aria-hidden="true" />
        <output id={id} aria-label={`${props.parameter.name} connected to`}>
          {props.source}
        </output>
        <button
          type="button"
          className="mtlx-parameter-icon-button"
          disabled={props.disabled}
          aria-label={`Disconnect ${props.parameter.name}`}
          title="Disconnect input"
          onClick={props.onDisconnect}
        >
          <Unplug size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const geometrySources: Record<string, { label: string; constant: string }> = {
  Nworld: { label: 'World-space normal', constant: '0, 0, 1' },
  Nobject: { label: 'Object-space normal', constant: '0, 0, 1' },
  Tworld: { label: 'World-space tangent', constant: '1, 0, 0' },
  Tobject: { label: 'Object-space tangent', constant: '1, 0, 0' },
  Bworld: { label: 'World-space bitangent', constant: '0, 1, 0' },
  Bobject: { label: 'Object-space bitangent', constant: '0, 1, 0' },
  Pworld: { label: 'World-space position', constant: '0, 0, 0' },
  Pobject: { label: 'Object-space position', constant: '0, 0, 0' },
  UV0: { label: 'Texture coordinates (UV0)', constant: '0, 0' },
};
/** Starting literals for explicit overrides; these are not evaluated geometry values. */
const geometryConstants: Record<string, string> = {
  float: '0',
  integer: '0',
  boolean: 'false',
  string: '',
  filename: '',
  geomname: '',
  vector2: '0, 0',
  vector3: '0, 0, 0',
  vector4: '0, 0, 0, 0',
  color3: '0, 0, 0',
  color4: '0, 0, 0, 1',
  matrix33: '1, 0, 0, 0, 1, 0, 0, 0, 1',
  matrix44: '1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1',
};

/** An implicit geometry input, before a literal or connection overrides it. */
export const GeometryParameterEditor: ParameterEditor = (props) => {
  const id = useId();
  const source = props.parameter.attributes?.defaultgeomprop ?? '';
  const geometry = geometrySources[source];
  const constant = geometry?.constant ?? geometryConstants[props.parameter.type ?? ''];
  return (
    <div className="mtlx-geometry-parameter">
      <ParameterLabel parameter={props.parameter} htmlFor={id} />
      <div className="mtlx-geometry-source" title={`Geometry default: ${source}`}>
        <Diamond size={14} aria-hidden="true" />
        <output id={id} aria-label={`${props.parameter.name} geometry source`}>
          {geometry?.label ?? `Geometry: ${source}`}
        </output>
      </div>
      {!props.disabled && constant !== undefined && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="mtlx-parameter-icon-button"
              aria-label={`${props.parameter.name} geometry options`}
              title="Geometry input options"
            >
              <Ellipsis size={14} aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="mtlx-context-menu" align="end" sideOffset={4} collisionPadding={8}>
              <DropdownMenu.Item className="mtlx-context-menu-item" onSelect={() => props.onChange(constant)}>
                Override with constant…
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
};
