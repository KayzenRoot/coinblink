import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function markdownFiles(directory, out = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = directory + '/' + entry.name;
    if (entry.isDirectory()) markdownFiles(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const files = [...markdownFiles('docs'), ...(existsSync('README.md') ? ['README.md'] : [])];
const missing = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu)) {
    let target = match[1];
    if (/^(https?:|mailto:|tel:|#)/iu.test(target)) continue;
    target = target.split('#')[0].split('?')[0];
    if (target === '') continue;
    const resolved = target.startsWith('/')
      ? '.' + target
      : resolve(dirname(file), target);
    if (!existsSync(resolved)) missing.push(file + ' -> ' + match[1]);
  }
}

test('every local documentation link resolves', () => {
  assert.ok(files.length >= 80, 'the scan must cover the documentation set, found ' + files.length);
  assert.deepEqual(missing, []);
});
