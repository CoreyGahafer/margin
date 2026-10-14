import { copyFile, mkdir, stat, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const destination = new URL('extension/vendor/', root);
await mkdir(new URL('ort/', destination), { recursive: true });
for (const name of ['ort.wasm.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  await copyFile(new URL(`node_modules/onnxruntime-web/dist/${name}`, root), new URL(`ort/${name}`, destination));
}
await mkdir(new URL('ephone/lang/', destination), { recursive: true });
await copyFile(new URL('node_modules/ephone/ephone.js', root), new URL('ephone/ephone.mjs', destination));
await copyFile(new URL('node_modules/ephone/lang/en-us.js', root), new URL('ephone/lang/en-us.js', destination));
await copyFile(new URL('node_modules/ephone/COPYING', root), new URL('ephone/COPYING', destination));
// Remove the untraceable legacy engine from the public package.
await rm(new URL('phonemizer.mjs', destination), { force: true });
await rm(new URL('phonemizer.LICENSE', destination), { force: true });
// The ONNX npm package omits its license; the version-matched upstream license
// is included in the repository alongside the generated runtime files.
await stat(new URL('ort/LICENSE', destination));
for (const name of ['kitten.onnx', 'voices.bin', 'voices.json', 'config.json']) {
  await stat(new URL(`extension/models/${name}`, root));
}
console.log('Ready to load extension/ in Chrome. All inference assets are bundled.');
