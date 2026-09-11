import { assertMaterialXXmlLimits, type MaterialXReadLimits } from './limits.js';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import type {
  MaterialXDocument,
  MaterialXElement,
  MaterialXInput,
  MaterialXNode,
  MaterialXNodeGraph,
  MaterialXOutput,
  MaterialXParameter,
} from './types.js';

type XmlRecord = Record<string, unknown>;

const orderedOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '',
  preserveOrder: true,
  parseTagValue: false,
  trimValues: false,
  commentPropName: '#comment',
  cdataPropName: '#cdata',
};
const parser = new XMLParser(orderedOptions);
const builder = new XMLBuilder({
  ...orderedOptions,
  format: false,
  suppressEmptyNode: true,
  suppressBooleanAttributes: false,
});
const PORT_TAGS = new Set(['input', 'output', 'parameter', '#text', '#comment', '#cdata']);
const asStringRecord = (value: unknown): Record<string, string> =>
  Object.fromEntries(Object.entries((value ?? {}) as XmlRecord).map(([key, entry]) => [key, String(entry)]));

const parseOrdered = (records: XmlRecord[]): MaterialXElement[] =>
  records.flatMap((record) => {
    const name = Object.keys(record).find((key) => key !== ':@');
    if (!name || name.startsWith('?')) return [];
    if (name === '#text') return [{ name, attributes: {}, text: String(record[name]), children: [] }];
    const children = parseOrdered(record[name] as XmlRecord[]);
    return [{ name, attributes: asStringRecord(record[':@']), children }];
  });
const elementToOrdered = (element: MaterialXElement): XmlRecord => {
  if (element.name === '#text') return { '#text': element.text ?? '' };
  const children = element.children.map(elementToOrdered);
  if (element.text !== undefined) children.unshift({ '#text': element.text });
  return { [element.name]: children, ':@': element.attributes };
};

const parsePort = (tagName: string, xml: unknown): MaterialXInput | MaterialXOutput | MaterialXParameter => {
  const attrs = asStringRecord(xml);
  const base = {
    name: attrs.name ?? '',
    type: attrs.type,
    value: attrs.value,
    attributes: attrs,
  };
  if (tagName !== 'input') {
    return base;
  }
  return {
    ...base,
    nodeName: attrs.nodename,
    output: attrs.output,
  };
};

const parseNodeFromElement = (element: MaterialXElement): MaterialXNode => {
  const inputs = element.children
    .filter((entry) => entry.name === 'input')
    .map((entry) => parsePort('input', entry.attributes) as MaterialXInput);
  const outputs = element.children
    .filter((entry) => entry.name === 'output')
    .map((entry) => parsePort('output', entry.attributes) as MaterialXOutput);
  const parameters = element.children
    .filter((entry) => entry.name === 'parameter')
    .map((entry) => parsePort('parameter', entry.attributes) as MaterialXParameter);

  return {
    category: element.name,
    name: element.attributes.name,
    type: element.attributes.type,
    attributes: element.attributes,
    inputs,
    outputs,
    parameters,
  };
};

const parseNodeGraphFromElement = (element: MaterialXElement): MaterialXNodeGraph => {
  const inputs = element.children
    .filter((entry) => entry.name === 'input')
    .map((entry) => parsePort('input', entry.attributes) as MaterialXInput);
  const outputs = element.children
    .filter((entry) => entry.name === 'output')
    .map((entry) => parsePort('output', entry.attributes) as MaterialXOutput);
  const parameters = element.children
    .filter((entry) => entry.name === 'parameter')
    .map((entry) => parsePort('parameter', entry.attributes) as MaterialXParameter);
  const nodes = element.children
    .filter((entry) => !PORT_TAGS.has(entry.name))
    .map((entry) => parseNodeFromElement(entry));

  return {
    name: element.attributes.name,
    attributes: element.attributes,
    inputs,
    outputs,
    parameters,
    nodes,
  };
};

/** Creates a document whose typed views are always derived from its canonical element tree.
 * Edit `attributes` and `elements`; typed views are read-only snapshots of the current tree. */
export const createMaterialXDocument = (
  attributes: Record<string, string> = {},
  elements: MaterialXElement[] = [],
): MaterialXDocument => ({
  attributes,
  elements,
  get nodes() {
    return this.elements
      .filter((entry) => entry.name !== 'nodegraph' && !entry.name.startsWith('#'))
      .map(parseNodeFromElement);
  },
  get nodeGraphs() {
    return this.elements.filter((entry) => entry.name === 'nodegraph').map(parseNodeGraphFromElement);
  },
});

export const cloneMaterialXDocument = (document: MaterialXDocument): MaterialXDocument =>
  createMaterialXDocument({ ...document.attributes }, structuredClone(document.elements));

/**
 * *Parses MaterialX XML text into a {@link MaterialXDocument}.*
 *
 * Preserves ordered elements, explicit attributes, text and comments semantically.
 * Source whitespace, quote style and XML declarations are not preserved byte-for-byte. Throws with line and column on malformed XML
 * or a missing `<materialx>` root.
 *
 * Example:
 *
 * ```ts
 * const document = parseMaterialX(await readFile('material.mtlx', 'utf8'));
 * console.log(document.attributes.version, document.nodeGraphs.length);
 * ```
 *
 * Reference:
 * - [MaterialX Specification](https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/documents/Specification/MaterialX.Specification.md)
 *
 * @category Parsing
 */
export const parseMaterialX = (xml: string, limits?: Partial<MaterialXReadLimits>): MaterialXDocument => {
  assertMaterialXXmlLimits(xml, limits);
  const xmlValidation = XMLValidator.validate(xml);
  if (xmlValidation !== true) {
    const { line, col, msg } = xmlValidation.err;
    throw new Error(`Invalid MaterialX XML at line ${line}, column ${col}: ${msg}`);
  }

  const roots = parseOrdered(parser.parse(xml) as XmlRecord[]).filter((entry) => !entry.name.startsWith('#'));
  const root = roots[0];
  if (roots.length !== 1 || root?.name !== 'materialx') {
    throw new Error('Invalid MaterialX XML: missing <materialx> root');
  }
  return createMaterialXDocument(
    root.attributes,
    root.children.filter((entry) => entry.name !== '#text' || entry.text?.trim()),
  );
};

/**
 * *Serializes a {@link MaterialXDocument} back to XML text.* The inverse of
 * {@link parseMaterialX}; a parse → serialize → parse round trip yields the same document.
 *
 * @category Parsing
 */
export const serializeMaterialX = (document: MaterialXDocument): string => {
  return builder.build([{ materialx: document.elements.map(elementToOrdered), ':@': document.attributes }]);
};
