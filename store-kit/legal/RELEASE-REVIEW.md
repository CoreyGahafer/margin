# Public-distribution preparation — build 0.3.1

## Technical findings and changes

The earlier Phonemizer.js wrapper declared Apache-2.0 but embedded a compiled eSpeak engine whose exact C/C++ build-source provenance was not included in the wrapper repository. The public-distribution candidate replaces that wrapper with **ephone 1.0.2**, an eSpeak fork whose release tag includes the C/C++ source, language data, and build scripts. Pronunciation remains local and English-only. The KittenTTS model, eight voice tables, and inference runtime are unchanged.

The bundled ephone release is GPL-3.0-or-later. The source associated with tag `v1.0.2` is pinned to `4f6d246c1d3acf67a4d814e20da02fa3967bc92d`. Its matching source archive is included here. The ONNX runtime's version-matched source is also archived here, with its existing MIT license.

The publisher confirmed GPL-3.0-or-later for Margin’s application source. The repository and extension include the full GPL text and application copyright notice. Matching source materials are published with release v0.3.1 at https://github.com/CoreyGahafer/margin/releases/tag/v0.3.1.

## Bundled source materials

The large archives listed below are provided in the separate `dist/margin-source-materials.zip`; they are omitted from the compact store-kit ZIP.

- `ephone-1.0.2-source.zip`: full tagged ephone/eSpeak C/C++ source, data, and Emscripten build scripts.
- `onnxruntime-1.30.0-source.zip`: ONNX Runtime source for tag v1.30.0. Follow the upstream build instructions; builds also obtain the tag's recorded submodule dependencies.
- `../application-source.zip`: Margin's preferred-form JavaScript/HTML/CSS, tests, build scripts, lockfile, and packaged runtime assets, prepared separately from machine-specific caches.
- `DEPENDENCIES.json`: versions, public source URLs, artifact checksums, and source-archive checksums.

The extension itself includes license notices and direct links to the pinned dependency source. Public source-hosting URLs for the application's source materials must also be made available to users alongside the store listing. Merely retaining a source ZIP on the publisher's computer is not a public source-distribution plan.

## Model provenance

KittenTTS Nano 0.8 int8's model card declares Apache-2.0. The pinned model revision, original NPZ checksum, and checksums of the converted voice tables are recorded in `extension/models/PROVENANCE.json`. Voice conversion preserves the float32 data without quantization or value changes. Do not substitute KittenTTS 2 weights: their license differs from this selected Nano release.

## Permission and network review

- Removed the unused `storage` permission and obsolete server-key cleanup code.
- No required website host permissions; optional site access requests use one current-page origin.
- `tabs` is used only for current-page metadata when the user requests extraction.
- No analytics, ads, crash-report uploads, remote inference, remote JavaScript, or runtime model downloads.
- Synthesis fetches packaged model assets only. The CSP restricts runtime connections and workers to the extension's own origin.
- Store icons and PNG promotional images are generated locally from source. Sample article copy is original content supplied for the demonstration, not a scraped third-party article.

## Publisher release gates

Before public submission, confirm the application license, make the corresponding source materials publicly accessible, host the privacy policy, supply the publisher's support contact, and test the final ZIP in a fresh Chrome profile. The preparation kit does not imply store approval or finalize those publisher decisions.

## References checked

- ephone release source: https://github.com/sjmik/ephone-js/tree/4f6d246c1d3acf67a4d814e20da02fa3967bc92d
- ephone build instructions: https://github.com/sjmik/ephone-js/tree/4f6d246c1d3acf67a4d814e20da02fa3967bc92d/emscripten
- ONNX source: https://github.com/microsoft/onnxruntime/tree/v1.30.0
- GPL source-distribution guidance: https://www.gnu.org/licenses/gpl-faq.html#AnonFTPAndSendSources
- Chrome minimum permissions: https://developer.chrome.com/docs/webstore/program-policies/permissions
- Chrome local data disclosure: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
