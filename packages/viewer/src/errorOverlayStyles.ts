export const ERROR_OVERLAY_STYLES = `
.error-log {
  position: absolute;
  z-index: 20;
  top: 12px;
  left: 12px;
  width: min(460px, calc(100% - 24px));
  max-height: calc(100% - 24px);
  overflow: auto;
  box-sizing: border-box;
  border: 1px solid rgb(248 113 113 / 30%);
  border-radius: 12px;
  background: rgb(24 18 22 / 88%);
  color: #fca5a5;
  box-shadow:
    0 12px 36px rgb(0 0 0 / 30%),
    inset 0 1px 0 rgb(255 255 255 / 4%);
  backdrop-filter: blur(16px);
  font: 13px/1.5 var(--viewer-font-family, var(--vscode-font-family, system-ui, sans-serif));
  text-align: left;
}
.error-log[hidden] {
  display: none;
}
.error-log-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 12px 0 16px;
}
.error-log-header strong {
  flex: 1;
  font-weight: 600;
}
.error-log-icon {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 1px solid rgb(248 113 113 / 60%);
  border-radius: 50%;
  color: #f87171;
  font-size: 12px;
  font-weight: 700;
}
.error-log-close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #fca5a5;
  font:
    22px/1 system-ui,
    sans-serif;
  cursor: pointer;
}
.error-log-close:hover {
  background: rgb(248 113 113 / 12%);
}
.error-log-close:focus-visible {
  outline: 2px solid #f87171;
  outline-offset: 2px;
}
.error-log-message {
  margin: 8px 16px 12px;
  overflow-wrap: anywhere;
}
.error-log-detail {
  margin: 0;
  padding: 12px 16px;
  border-top: 1px solid rgb(248 113 113 / 16%);
  background: rgb(0 0 0 / 12%);
  color: #f0a0a0;
  font:
    11px/1.7 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  user-select: text;
}
.error-log-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid rgb(248 113 113 / 16%);
  font-size: 11px;
}
.error-log-footer [role='status'] {
  flex: 1;
}
.error-log-copy {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid rgb(248 113 113 / 30%);
  border-radius: 6px;
  background: rgb(248 113 113 / 8%);
  color: #fca5a5;
  font: inherit;
  cursor: pointer;
}
.error-log-copy:hover {
  background: rgb(248 113 113 / 16%);
}
.error-log-copy:focus-visible {
  outline: 2px solid #f87171;
  outline-offset: 2px;
}
.error-log-copy:disabled {
  opacity: 0.6;
  cursor: wait;
}
`;
