import { test } from 'node:test';
import assert from 'node:assert/strict';
import createEphone from '../extension/vendor/ephone/ephone.mjs';
import { tokenize } from '../extension/tts-core.mjs';

test('bundled English pronunciation engine runs offline and preserves punctuation', async () => {
  const engine = await createEphone();
  const ipa = engine.textToIpa('Hello, world. This costs $12.50!');
  assert.match(ipa, /həl/);
  assert.ok(ipa.includes(',') && ipa.includes('.') && ipa.endsWith('!'));
  const ids = tokenize(ipa);
  assert.ok(ids.length > 10);
  assert.equal(ids[0], 0n);
  assert.equal(ids.at(-1), 0n);
});
