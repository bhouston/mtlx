/** Webview entry: React renders the chrome; scene.ts owns the three.js lifecycle. */
import { createRoot } from 'react-dom/client';
import { PreviewApp } from './App.js';

createRoot(document.getElementById('root')!).render(<PreviewApp />);
