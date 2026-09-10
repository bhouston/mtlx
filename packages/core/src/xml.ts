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

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: false,
  trimValues: false,
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  format: false,
  indentBy: '  ',
  suppressBooleanAttributes: false,
  suppressEmptyNode: true,
});

const DEFAULT_DOCUMENT_COLOR_SPACE = 'lin_rec709';
const PORT_TAGS = new Set(['input', 'output', 'parameter']);

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const asStringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === '#text') {
      continue;
    }
    if (entry === undefined || entry === null || typeof entry === 'object') {
      continue;
    }
    result[key] = String(entry);
  }
  return result;
};

const parseElement = (name: string, xml: unknown): MaterialXElement => {
  const raw = (xml && typeof xml === 'object' ? (xml as XmlRecord) : {}) as XmlRecord;
  const attributes = asStringRecord(raw);
  const rawText = typeof raw['#text'] === 'string' ? raw['#text'] : undefined;
  const text = rawText && rawText.trim().length > 0 ? rawText : undefined;
  const children: MaterialXElement[] = [];

  for (const [childName, childValue] of Object.entries(raw)) {
    if (childName === '#text') {
      continue;
    }
    if (attributes[childName] !== undefined) {
      continue;
    }
    if (!childValue || typeof childValue !== 'object') {
      continue;
    }
    for (const entry of toArray(childValue)) {
      children.push(parseElement(childName, entry));
    }
  }

  return {
    name,
    attributes,
    text,
    children,
  };
};

const elementToXml = (element: MaterialXElement): XmlRecord => {
  const output: XmlRecord = { ...element.attributes };
  if (element.text !== undefined) {
    output['#text'] = element.text;
  }
  for (const child of element.children) {
    const childXml = elementToXml(child);
    const existing = output[child.name];
    output[child.name] = existing ? [...toArray(existing), childXml] : [childXml];
  }
  return output;
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

const nodeToXml = (node: MaterialXNode): XmlRecord => {
  const output: XmlRecord = { ...node.attributes };
  if (node.inputs.length > 0) {
    output.input = node.inputs.map((entry) => ({ ...entry.attributes }));
  }
  if (node.outputs.length > 0) {
    output.output = node.outputs.map((entry) => ({ ...entry.attributes }));
  }
  if (node.parameters.length > 0) {
    output.parameter = node.parameters.map((entry) => ({ ...entry.attributes }));
  }
  return output;
};

const nodeGraphToXml = (nodeGraph: MaterialXNodeGraph): XmlRecord => {
  const output: XmlRecord = { ...nodeGraph.attributes };
  if (nodeGraph.inputs.length > 0) {
    output.input = nodeGraph.inputs.map((entry) => ({ ...entry.attributes }));
  }
  if (nodeGraph.parameters.length > 0) {
    output.parameter = nodeGraph.parameters.map((entry) => ({ ...entry.attributes }));
  }
  if (nodeGraph.outputs.length > 0) {
    output.output = nodeGraph.outputs.map((entry) => ({ ...entry.attributes }));
  }
  for (const node of nodeGraph.nodes) {
    const existing = output[node.category];
    const next = nodeToXml(node);
    output[node.category] = existing ? [...toArray(existing), next] : [next];
  }
  return output;
};

export const parseMaterialX = (xml: string): MaterialXDocument => {
  const xmlValidation = XMLValidator.validate(xml);
  if (xmlValidation !== true) {
    const { line, col, msg } = xmlValidation.err;
    throw new Error(`Invalid MaterialX XML at line ${line}, column ${col}: ${msg}`);
  }

  const parsed = parser.parse(xml) as XmlRecord;
  const root = parsed.materialx as XmlRecord | undefined;
  if (!root || typeof root !== 'object') {
    throw new Error('Invalid MaterialX XML: missing <materialx> root');
  }

  const attributes: Record<string, string> = {
    colorspace: DEFAULT_DOCUMENT_COLOR_SPACE,
    ...asStringRecord(root),
  };
  const elements: MaterialXElement[] = [];
  for (const [tag, value] of Object.entries(root)) {
    if (tag === '#text') {
      continue;
    }
    if (attributes[tag] !== undefined) {
      continue;
    }
    if (!value || typeof value !== 'object') {
      continue;
    }
    for (const entry of toArray(value)) {
      elements.push(parseElement(tag, entry));
    }
  }
  const nodeGraphs = elements
    .filter((entry) => entry.name === 'nodegraph')
    .map((entry) => parseNodeGraphFromElement(entry));
  const nodes = elements.filter((entry) => entry.name !== 'nodegraph').map((entry) => parseNodeFromElement(entry));

  return {
    attributes,
    nodes,
    nodeGraphs,
    elements,
  };
};

export const serializeMaterialX = (document: MaterialXDocument): string => {
  const root: XmlRecord = { ...document.attributes };
  if (!root.version) {
    root.version = '1.39';
  }

  if (document.elements.length > 0) {
    for (const element of document.elements) {
      const existing = root[element.name];
      const xmlElement = elementToXml(element);
      root[element.name] = existing ? [...toArray(existing), xmlElement] : [xmlElement];
    }
    return builder.build({ materialx: root });
  }

  if (document.nodeGraphs.length > 0) {
    root.nodegraph = document.nodeGraphs.map((entry) => nodeGraphToXml(entry));
  }

  for (const node of document.nodes) {
    const xmlNode = nodeToXml(node);
    const existing = root[node.category];
    root[node.category] = existing ? [...toArray(existing), xmlNode] : [xmlNode];
  }

  return builder.build({ materialx: root });
};
