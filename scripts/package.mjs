import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
execFileSync('zip', ['-q', '-r', '-FS', '../dist/margin-extension.zip', '.', '-x', '*.DS_Store'], {
  cwd: new URL('../extension/', import.meta.url), stdio: 'inherit'
});
console.log('Packaged dist/margin-extension.zip — unzip and Load unpacked in Chrome.');
