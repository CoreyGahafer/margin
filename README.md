# Margin — article audio, entirely inside Chrome

Margin 0.3.1 runs KittenTTS locally **inside the extension**. No Python installation, server, account, pairing key, or model download is needed. The model, eight English voices, pronunciation engine, and ONNX WebAssembly runtime are bundled.

## Install or update

Already loaded this project's `extension` folder? Open `chrome://extensions`, click **Reload** on Margin, then close and reopen its side panel. You can stop the old Python server with Ctrl+C; Margin no longer connects to it.

For a new installation:

1. Unzip `dist/margin-extension.zip` into a permanent folder, or use this project's `extension` folder directly.
2. Open `chrome://extensions` in Chrome 116 or newer.
3. Enable **Developer mode** and choose **Load unpacked**.
4. Select the folder containing `manifest.json`.
5. Pin **Margin — Article Audio** and click its toolbar icon.

Use **Read this tab** to extract the article. If Chrome blocks access, choose **Allow this site** and approve the site-specific permission prompt. Highlighting text is optional: a selection narrates only that passage. You can also paste text under **Review or paste text**.

Choose a voice and **Narration speed**, then **Make audio**. Playback starts automatically after the first passage is ready, while the remaining passages generate. Use **Pause listening** or **Resume listening** during generation. **Save WAV** becomes available when the entire article is ready. The WAV includes your narration speed. The separate **Playback speed** changes listening only and resets to 1× for every newly generated file. It becomes available when generation finishes; during generation, listening uses the chosen narration speed. On completion, Margin switches to the full player at your current position without replaying the beginning. Duration before generation is approximate; the player displays the actual generated duration.

## Privacy and offline operation

All generation happens in a worker owned by the side panel. Article text and audio remain in browser memory; nothing is uploaded. No external network permissions are required for synthesis, and the extension's security policy restricts inference assets to its own packaged files. Website permissions are optional and requested only for article extraction. Revoke those permissions in Chrome's extension settings.

Generation and pasted text work offline immediately. An article must already be open or otherwise accessible to extract it. The complete unpacked extension is approximately 43 MB. The first generation takes extra time to initialize the local model; later generations reuse it while the panel stays open.

Keep the side panel open during generation and playback. Closing it cancels the worker and discards its audio. **Cancel generation** terminates the worker immediately, including during model initialization. Generated audio is saved to disk only when you download it.

## Limits

- Eight English voices: Bella, Jasper, Luna, Bruno, Rosie, Hugo, Kiki, and Leo.
- Narration speed: 0.75×–2×. Change it and generate again to update a saved file.
- Maximum input: 60,000 characters. Long articles are generated in short passages and queued for immediate playback. If generation falls behind listening, playback buffers and resumes when the next passage arrives. Longer articles consume more browser memory.
- Chrome internal pages, the Web Store, PDF viewers, and inaccessible embedded frames cannot be extracted. It does not bypass paywalls.
- Browser pronunciation uses eSpeak's English processing and preserves punctuation. It does not reproduce every advanced date, currency, abbreviation, or text-normalization rule from KittenTTS's Python library.
- Browser CPU generation speed depends on your device. This version uses single-threaded WebAssembly for broad compatibility; it does not require WebGPU.

## Development

The `extension` folder is ready to load as delivered; users don't need a build tool. To reproduce the vendor bundle after changing dependencies:

```sh
npm ci
npm run build
npm test
npm run package
```

Dependencies are pinned in `package-lock.json`. The build copies the matching ONNX Runtime and ephone files from `node_modules`; model and converted voice assets are already included in `extension/models`. `scripts/prepare-model.py` documents their deterministic conversion from the original cached assets.

For browser QA only, `npm run preview` serves the extension at `http://127.0.0.1:4177` with the same CSP on the page **and worker responses**. This development preview can synthesize pasted text but cannot extract browser tabs. The installed extension never requires this server.

The Python companion remains in `server/` solely as a reference implementation. A snapshot of the former server-based extension is preserved in `dist/margin-server-legacy.zip`.

## Verification

Fifteen JavaScript tests cover extraction and permission recovery, generation-speed forwarding, early playback, queue timing, buffering, pause/resume, cancellation, tokenizer parity with the reference Python pipeline, input limits, chunking, and WAV encoding. Real browser QA verifies all eight voices under the extension CSP, actual early playback while inference continues, pause/resume, handoff to the completed file without restarting, multi-passage generation, cancellation, and shorter generated duration at 1.5× (4.77 seconds → 3.23 seconds for the same passage). The unpacked extension's native side panel and site-access prompt require a live Chrome installation check after reload.

## Components

KittenTTS Nano 0.8 int8, ONNX Runtime Web 1.30.0, ephone 1.0.2 (eSpeak NG), and Mozilla Readability 0.6.0. Model provenance and bundled licenses are in `extension/THIRD_PARTY_NOTICES.md` and `extension/models/MODEL_CARD.md`.

## License and public downloads

Copyright (C) 2026 Corey Gahafer. Margin's application source is licensed under
[GPL-3.0-or-later](LICENSE), without warranty. Bundled third-party assets retain
their own licenses; see [component notices](extension/THIRD_PARTY_NOTICES.md).

[Release v0.3.1](https://github.com/CoreyGahafer/margin/releases/tag/v0.3.1) includes
the installable extension, store materials, and matching application/dependency
source archives. Large release archives are not committed to this repository.

[Privacy policy](https://coreygahafer.github.io/margin/privacy.html) ·
[Support](mailto:cgahafer89@gmail.com)
