# Bundled components

- KittenTTS Nano 0.8 int8: KittenML, model card declares Apache-2.0.
  Model source: https://huggingface.co/KittenML/kitten-tts-nano-0.8-int8
  Reference pipeline: https://github.com/KittenML/KittenTTS
  `models/voices.bin` and `voices.json` are lossless conversions of `voices.npz`.
- ONNX Runtime Web 1.30.0: Microsoft, MIT. License: `vendor/ort/LICENSE`.
  Source: https://github.com/microsoft/onnxruntime/tree/v1.30.0
- ephone 1.0.2: sjmik and eSpeak NG contributors, GPL-3.0-or-later.
  License: `vendor/ephone/COPYING`.
  Full versioned C/C++ source, language data, and build scripts:
  https://github.com/sjmik/ephone-js/tree/4f6d246c1d3acf67a4d814e20da02fa3967bc92d
  Source archive: https://github.com/sjmik/ephone-js/archive/4f6d246c1d3acf67a4d814e20da02fa3967bc92d.zip
  Rebuild instructions are in the repository README and `emscripten/build.sh`.
- Mozilla Readability 0.6.0: Mozilla/Arc90, Apache-2.0.
  License: `vendor/Readability.LICENSE`.
  Source: https://github.com/mozilla/readability/tree/0.6.0

The extension ZIP contains the application's JavaScript source as well as
bundled runtime assets. Upstream licenses and corresponding-source requirements
continue to apply when redistributing third-party components.

## Margin application source

Copyright (C) 2026 Corey Gahafer. Margin is licensed under GPL-3.0-or-later.
You may redistribute and modify it under GNU GPL version 3 or any later version.
Margin is provided without warranty; see LICENSE for the full terms.
Third-party components retain the licenses listed above.

Application source: https://github.com/CoreyGahafer/margin
Version 0.3.1 matching application and dependency source materials:
https://github.com/CoreyGahafer/margin/releases/download/v0.3.1/margin-source-materials.zip
