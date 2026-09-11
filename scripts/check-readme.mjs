// Compile and execute marked, standalone README examples in the installed tarball consumer.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
export function checkReadmeExamples(consumerDirectory) {
  const examples = [];
  const sourceDirectory = join(consumerDirectory, 'readme-examples');
  mkdirSync(sourceDirectory);
  for (const name of ['core', 'viewer']) {
    const markdown = readFileSync(join(root, 'packages', name, 'README.md'), 'utf8');
    for (const match of markdown.matchAll(/<!-- test:([\w-]+) -->\s*```ts\n([\s\S]*?)```/g)) {
      const fileName = `${name}-${match[1]}.ts`;
      writeFileSync(join(sourceDirectory, fileName), match[2]);
      examples.push(fileName);
    }
  }
  if (examples.length !== 3) throw new Error('Expected three marked README consumer examples');
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules/typescript/bin/tsc'),
      '--strict',
      '--skipLibCheck',
      '--target',
      'es2022',
      '--module',
      'nodenext',
      '--types',
      'node',
      '--typeRoots',
      join(root, 'node_modules/@types'),
      '--outDir',
      join(consumerDirectory, 'readme-output'),
      ...examples.map((name) => join(sourceDirectory, name)),
    ],
    { cwd: consumerDirectory, stdio: 'inherit' },
  );
  for (const example of examples) {
    execFileSync(process.execPath, [join(consumerDirectory, 'readme-output', example.replace(/\.ts$/, '.js'))], {
      cwd: consumerDirectory,
      stdio: 'inherit',
    });
  }
  console.log(`Compiled and ran ${examples.length} README examples against the installed packages.`);
}
