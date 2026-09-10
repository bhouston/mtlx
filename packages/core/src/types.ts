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

/**
 * *The in-memory form of a `.mtlx` file, mirroring its XML structure.*
 *
 * `nodes` and `nodeGraphs` are typed views; `elements` is the lossless raw tree that
 * {@link serializeMaterialX} writes back out.
 *
 * @category Parsing
 */
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

/**
 * *A node definition entry in the {@link materialXNodeRegistry}.*
 *
 * @category Validation
 */
export interface MaterialXNodeSpec {
  category: string;
  nodeDefName?: string;
  type?: string;
  inputs: MaterialXNodePortSpec[];
  outputs: MaterialXNodePortSpec[];
  parameters: MaterialXNodePortSpec[];
}

/**
 * *One finding from validation.* Errors make a file unusable; warnings are advisory.
 *
 * @category Validation
 */
export interface MaterialXValidationIssue {
  level: 'error' | 'warning';
  message: string;
  location: string;
}
