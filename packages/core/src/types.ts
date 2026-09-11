export type MaterialXValueType = string;

export interface MaterialXElement {
  name: string;
  attributes: Record<string, string>;
  text?: string;
  children: MaterialXElement[];
}

export interface MaterialXPort {
  readonly name: string;
  readonly type?: MaterialXValueType;
  readonly value?: string;
  readonly attributes: Readonly<Record<string, string>>;
}

export interface MaterialXInput extends MaterialXPort {
  readonly nodeName?: string;
  readonly output?: string;
}

export interface MaterialXOutput extends MaterialXPort {}

export interface MaterialXParameter extends MaterialXPort {}

export interface MaterialXNode {
  readonly category: string;
  readonly name?: string;
  readonly type?: MaterialXValueType;
  readonly attributes: Readonly<Record<string, string>>;
  readonly inputs: readonly MaterialXInput[];
  readonly outputs: readonly MaterialXOutput[];
  readonly parameters: readonly MaterialXParameter[];
}

export interface MaterialXNodeGraph {
  readonly name?: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly inputs: readonly MaterialXInput[];
  readonly outputs: readonly MaterialXOutput[];
  readonly parameters: readonly MaterialXParameter[];
  readonly nodes: readonly MaterialXNode[];
}

/**
 * *The in-memory form of a `.mtlx` file, mirroring its XML structure.*
 *
 * `nodes` and `nodeGraphs` are derived read-only snapshots; `elements` is the canonical tree that
 * {@link serializeMaterialX} writes back out.
 *
 * @category Parsing
 */
export interface MaterialXDocument {
  attributes: Record<string, string>;
  readonly nodes: readonly MaterialXNode[];
  readonly nodeGraphs: readonly MaterialXNodeGraph[];
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
  /** Stable machine-readable identifier when supplied by the producing rule. */
  code?: string;
  rule?: string;
  level: 'error' | 'warning';
  message: string;
  location: string;
}
