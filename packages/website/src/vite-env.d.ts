/// <reference types="vite/client" />

interface Window {
  /** The editor page's live session, for browser-driving agents. Present only while /editor is mounted. */
  mtlx?: import('mtlx-core/session').EditorSession;
}
