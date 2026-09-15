/** Compatibility entry point. New headless consumers should import mtlx-core/session. */
export {
  createEditorSession,
  EditorSession,
  EditorError,
  type EditorSessionOptions,
  type EditorSnapshot,
  type EditorGraph,
  type EditorDiagnostic,
  type InputValue,
  type InputRef,
  type OutputRef,
  type DeepReadonly,
  type ReadonlyMaterialXDocument,
} from 'mtlx-core/session';
