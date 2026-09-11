#!/usr/bin/env node
// Splices `mtlx --help` (and each command's help) into packages/cli/README.md between the
// begin:cli_help / end:cli_help markers, so the CLI reference can never drift from the binary.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'packages/cli/bin/cli.js');
const docPath = join(root, 'packages/cli/README.md');

const help = (args) =>
  execFileSync('node', [cli, ...args, '--help'], {
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  }).trim();

const top = help([]);
const commands = [...top.matchAll(/^ {2}mtlx (\w+) /gm)].map((match) => match[1]);
const sections = [top, ...commands.map((command) => help([command]))]
  .map((text) => `\`\`\`text\n${text}\n\`\`\``)
  .join('\n\n');

const doc = readFileSync(docPath, 'utf8');
if (!/<!-- begin:cli_help -->[\s\S]*<!-- end:cli_help -->/.test(doc)) {
  throw new Error('CLI README must contain begin:cli_help and end:cli_help markers');
}
if (!commands.length) throw new Error('No commands found in CLI help output');
const updated = doc.replace(
  /<!-- begin:cli_help -->[\s\S]*<!-- end:cli_help -->/,
  `<!-- begin:cli_help -->\n${sections}\n<!-- end:cli_help -->`,
);
writeFileSync(docPath, updated);
console.log(`Updated ${docPath} with ${commands.length} commands`);
