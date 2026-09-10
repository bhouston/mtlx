export type MaterialXValueType = string;

export interface MaterialXElement {
  name: string;
  attributes: Record<string, string>;
  text?: string;
  children: MaterialXElement[];
}

export interface MaterialXPort {
  name: string;
  type?: MaterialXValueType;
  value?: string;
  attributes: Record<string, string>;
}

export interface MaterialXInput extends MaterialXPort {
  nodeName?: string;
  output?: string;
}

export interface MaterialXOutput extends MaterialXPort {}

export interface MaterialXParameter extends MaterialXPort {}

export interface MaterialXNode {
  category: string;
  name?: string;
  type?: MaterialXValueType;
  attributes: Record<string, string>;
  inputs: MaterialXInput[];
  outputs: MaterialXOutput[];
  parameters: MaterialXParameter[];
}

export interface MaterialXNodeGraph {
  name?: string;
  attributes: Record<string, string>;
  inputs: MaterialXInput[];
  outputs: MaterialXOutput[];
  parameters: MaterialXParameter[];
  nodes: MaterialXNode[];
}

export interface MaterialXDocument {
  attributes: Record<string, string>;
  nodes: MaterialXNode[];
  nodeGraphs: MaterialXNodeGraph[];
  elements: MaterialXElement[];
}

export interface MaterialXNodePortSpec {
  name: string;
  type?: string;
}

export interface MaterialXNodeSpec {
  category: string;
  nodeDefName?: string;
  type?: string;
  inputs: MaterialXNodePortSpec[];
  outputs: MaterialXNodePortSpec[];
  parameters: MaterialXNodePortSpec[];
}

export interface MaterialXValidationIssue {
  level: 'error' | 'warning';
  message: string;
  location: string;
}
