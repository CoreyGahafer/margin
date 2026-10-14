const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function player() {
  const sources = [], states = [];
  class AudioContext {
    constructor() { this.currentTime = 0; this.state = 'running'; }
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    async close() { this.state = 'closed'; }
    createBuffer(_channels, length, rate) { return { duration: length / rate, copyToChannel() {} }; }
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, start(time) { this.startTime = time; }, stop() { this.stopped = true; } };
      sources.push(source);
      return source;
    }
  }
  const context = vm.createContext({ AudioContext });
  vm.runInContext(fs.readFileSync('extension/stream-player.js', 'utf8'), context);
  return { stream: new context.MarginStreamPlayer(state => states.push(state)), sources, states };
}

test('available passages are queued without replaying or overlapping', () => {
  const { stream, sources } = player();
  stream.add(new Float32Array(24000), 1);
  stream.context.currentTime = .5;
  stream.add(new Float32Array(24000), 1);
  assert.equal(sources[0].startTime, .04);
  assert.ok(Math.abs(sources[1].startTime - 1.14) < .0001);
  stream.context.currentTime = 1.5;
  assert.ok(Math.abs(stream.position - 1.46) < .0001);
});

test('buffer underrun resumes at new audio while excluding the gap from position', () => {
  const { stream, sources, states } = player();
  stream.add(new Float32Array(24000), 1);
  sources[0].onended();
  assert.equal(states.at(-1), 'buffering');
  stream.context.currentTime = 5;
  stream.add(new Float32Array(24000), 1);
  assert.equal(sources[1].startTime, 5.04);
  assert.ok(Math.abs(stream.position - 1.1) < .0001);
  assert.equal(states.at(-1), 'playing');
});

test('pause keeps queued passages and stop silences every source', async () => {
  const { stream, sources, states } = player();
  stream.add(new Float32Array(24000), 1.5);
  await stream.toggle();
  assert.equal(stream.paused, true);
  assert.equal(stream.context.state, 'suspended');
  stream.add(new Float32Array(24000), 1.5);
  assert.equal(states.at(-1), 'paused');
  await stream.toggle();
  assert.equal(stream.paused, false);
  assert.equal(stream.context.state, 'running');
  stream.stop();
  assert.ok(sources.every(source => source.stopped));
  assert.equal(stream.context.state, 'closed');
  stream.stop();
});
