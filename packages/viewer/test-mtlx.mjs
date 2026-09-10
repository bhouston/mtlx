import { JSDOM } from '../../node_modules/.pnpm/jsdom@25.0.1/node_modules/jsdom/lib/api.js';
const dom = new JSDOM('');
globalThis.DOMParser = dom.window.DOMParser;

import { MaterialXLoader } from 'three/addons/loaders/MaterialXLoader.js';
import fs from 'fs';

const loader = new MaterialXLoader();
loader.setPath(process.argv[3] || '.');
const buf = fs.readFileSync(process.argv[2]);
try {
  const result = loader.parseBuffer(buf, process.argv[2]);
  console.log('OK', Object.keys(result));
  console.log('errors', result.errors);
  console.log('warnings', result.warnings);
  for (const [name, mat] of Object.entries(result.materials || {})) {
    console.log(name, mat.type, mat.colorNode ? 'has colorNode' : 'NO COLORNODE');
    console.log(mat.colorNode);
  }
} catch (e) {
  console.error('ERROR', e);
}
