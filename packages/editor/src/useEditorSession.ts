import { useSyncExternalStore } from 'react';
import type { EditorSession } from 'mtlx-core/session';

/** Subscribe to committed document and history changes with stable snapshot identities. */
export function useEditorSession(session: EditorSession) {
  return useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
}
