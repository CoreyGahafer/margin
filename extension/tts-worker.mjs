import * as ort from './vendor/ort/ort.wasm.min.mjs';
import createEphone from './vendor/ephone/ephone.mjs';
import { tokenize, chunkText, validateInput, encodeWav } from './tts-core.mjs';

ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
ort.env.wasm.wasmPaths = new URL('./vendor/ort/', import.meta.url).href;
let enginePromise;
let pronunciationPromise;

async function localAsset(name, type = 'json') {
  const response = await fetch(new URL(`./models/${name}`, import.meta.url));
  if (!response.ok) throw new Error(`Bundled model asset is missing: ${name}. Reload the complete extension folder.`);
  return type === 'json' ? response.json() : response.arrayBuffer();
}

async function loadEngine() {
  const [model, config, manifest, voiceBytes] = await Promise.all([
    localAsset('kitten.onnx', 'binary'), localAsset('config.json'),
    localAsset('voices.json'), localAsset('voices.bin', 'binary')
  ]);
  const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  return { session, config, manifest, voices: new Float32Array(voiceBytes) };
}

async function pronunciation(text) {
  pronunciationPromise ||= createEphone();
  const engine = await pronunciationPromise;
  return engine.textToIpa(text);
}

self.onmessage = async ({ data }) => {
  try {
    self.postMessage({ type: 'loading' });
    enginePromise ||= loadEngine();
    const { session, config, manifest, voices } = await enginePromise;
    validateInput(data, config.voice_aliases);
    const { text, voice, speed } = data;
    const parts = chunkText(text);
    const voiceId = config.voice_aliases[voice];
    const entry = manifest[voiceId];
    const segments = [];
    self.postMessage({ type: 'progress', completed: 0, total: parts.length });
    for (const [index, part] of parts.entries()) {
      const ids = tokenize(await pronunciation(part));
      const row = Math.min(part.length, entry.rows - 1);
      const offset = entry.offset + row * entry.width;
      const style = voices.slice(offset, offset + entry.width);
      const result = await session.run({
        input_ids: new ort.Tensor('int64', ids, [1, ids.length]),
        style: new ort.Tensor('float32', style, [1, entry.width]),
        speed: new ort.Tensor('float32', Float32Array.of(speed * (config.speed_priors[voiceId] || 1)), [1])
      });
      const raw = result[session.outputNames[0]].data;
      // Match KittenTTS's trailing-padding removal.
      const audio = Float32Array.from(raw.subarray(0, Math.max(0, raw.length - 5000)));
      if (!audio.length || !audio.some(value => Math.abs(value) > .0001)) throw new Error('The speech model produced empty audio. Try a longer passage.');
      segments.push(audio);
      // Keep the original samples for the complete WAV; transfer a copy to the
      // panel immediately so playback can start before inference finishes.
      const pcm = audio.slice().buffer;
      self.postMessage({ type: 'chunk', pcm, completed: index + 1, total: parts.length }, [pcm]);
      self.postMessage({ type: 'progress', completed: index + 1, total: parts.length });
    }
    const wav = encodeWav(segments, speed);
    self.postMessage({ type: 'done', wav }, [wav]);
  } catch (error) {
    enginePromise = undefined;
    self.postMessage({ type: 'error', error: error.message || String(error) });
  }
};
