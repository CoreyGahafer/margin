export const SAMPLE_RATE = 24000;
export const MAX_TEXT = 60000;

// Match the symbol table in KittenTTS's ONNX TextCleaner, including duplicates.
const symbols = ['$']
  .concat([...';:,.!?¡¿—…"«»"" '])
  .concat([...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'])
  .concat([..."ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ"]);
const symbolIds = new Map(symbols.map((symbol, index) => [symbol, index]));

export function tokenize(phonemes) {
  // Python's basic_english_tokenize uses Unicode-aware \w+|[^\w\s].
  const separated = (phonemes.match(/[\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]/gu) || []).join(' ');
  const ids = [...separated].flatMap(char => symbolIds.has(char) ? [BigInt(symbolIds.get(char))] : []);
  return BigInt64Array.from([0n, ...ids, 10n, 0n]);
}

export function chunkText(text, limit = 350) {
  const result = [];
  let current = '';
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    for (let start = 0; start < word.length; start += limit) {
      const part = word.slice(start, start + limit);
      if (current && current.length + part.length + 1 > limit) { result.push(current); current = ''; }
      current = `${current} ${part}`.trim();
      if (/[.!?]["”’]?$/.test(current) && current.length >= limit / 2) { result.push(current); current = ''; }
    }
  }
  if (current) result.push(current);
  return result;
}

export function validateInput({ text, voice, speed }, voices) {
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) throw new Error('Text must contain 1–60,000 characters.');
  if (!Object.hasOwn(voices, voice)) throw new Error('Choose one of the available voices.');
  if (typeof speed !== 'number' || !Number.isFinite(speed) || speed < .75 || speed > 2) throw new Error('Narration speed must be between 0.75× and 2×.');
}

export function encodeWav(segments, speed = 1) {
  const pause = Math.floor(SAMPLE_RATE * .1 / speed);
  const sampleCount = segments.reduce((sum, segment) => sum + segment.length + pause, 0);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const text = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, sampleCount * 2, true);
  let offset = 44;
  for (const segment of segments) {
    for (const sample of segment) {
      view.setInt16(offset, Math.round(Math.max(-1, Math.min(1, Number.isFinite(sample) ? sample : 0)) * 32767), true);
      offset += 2;
    }
    offset += pause * 2;
  }
  return buffer;
}
