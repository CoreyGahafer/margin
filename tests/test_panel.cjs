const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

function panel(chrome, extras = {}) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', textContent: '', hidden: true, open: false,
      addEventListener(event, callback) { this[event] = callback; },
      scrollIntoView() {}, focus() {}, pause() {}, firstElementChild: { textContent: '' }
    });
    return elements.get(id);
  }
  const context = vm.createContext({
    document: { getElementById: element, baseURI: 'http://localhost/extension/panel.html' }, chrome, URL, Blob,
    setTimeout, Option: function () {}, console,
    MarginStreamPlayer: class {
      constructor() { this.entries = []; this.position = 0; this.paused = false; }
      add(samples) { this.entries.push(samples); }
      stop() {}
    }, ...extras
  });
  vm.runInContext(fs.readFileSync('extension/panel.js', 'utf8'), context);
  return { element, read: () => element('extract').click() };
}

test('denied tab access offers a site-specific permission request', async () => {
  const ui = panel({
    tabs: { query: async () => [{ id: 12, url: 'https://example.com/article' }] },
    scripting: { executeScript: async () => {
      throw new Error('Cannot access contents of the page. Extension manifest must request permission to access the respective host.');
    } }
  });
  await ui.read();
  assert.equal(ui.element('extract-status').hidden, false);
  assert.match(ui.element('extract-status').textContent, /Allow this site/i);
  assert.equal(ui.element('allow-site').hidden, false);
  assert.equal(ui.element('extract').disabled, false);
});

test('first passage starts streaming before the complete WAV arrives', async () => {
  let worker;
  let played = 0;
  let stopped = false;
  class FakeWorker {
    constructor() { worker = this; }
    postMessage() {}
  }
  const ui = panel(undefined, { Worker: FakeWorker, MarginStreamPlayer: class {
    constructor() { this.position = .5; this.paused = false; this.entries = []; }
    add(samples) { played += samples.length; this.entries.push(samples); }
    stop() { stopped = true; }
  } });
  ui.element('text').value = 'A pasted article.';
  ui.element('voice').value = 'Luna';
  ui.element('speed').value = '1';
  const generating = ui.element('generate').click();
  worker.onmessage({ data: { type: 'chunk', pcm: new Float32Array(24000).buffer, completed: 1, total: 3 } });
  assert.equal(played, 24000);
  assert.equal(ui.element('player').hidden, false);
  assert.equal(ui.element('generate').disabled, true);
  assert.equal(ui.element('download').hidden, true);
  worker.onmessage({ data: { type: 'done', wav: new ArrayBuffer(48044) } });
  await generating;
  assert.equal(stopped, true);
  assert.equal(ui.element('download').hidden, false);
  ui.element('audio').play = async () => {};
  ui.element('audio').loadedmetadata();
  assert.equal(ui.element('audio').currentTime, .5);
});

test('generation uses a worker with selected narration speed and resets playback speed', async () => {
  let input;
  class FakeWorker {
    postMessage(value) {
      input = value;
      queueMicrotask(() => this.onmessage({ data: { type: 'done', wav: new ArrayBuffer(48044) } }));
    }
  }
  const ui = panel(undefined, { Worker: FakeWorker });
  ui.element('text').value = 'A pasted article.';
  ui.element('voice').value = 'Luna';
  ui.element('speed').value = '1.5';
  ui.element('playback-speed').value = '2';
  await ui.element('generate').click();
  assert.equal(input.speed, 1.5);
  assert.equal(input.text, 'A pasted article.');
  assert.equal(ui.element('audio').playbackRate, 1);
  assert.equal(ui.element('playback-speed').value, '1');
  assert.equal(ui.element('player').hidden, false);
  assert.match(ui.element('audio-info').textContent, /1.5× narration/);
  assert.match(ui.element('download').href, /^blob:/);
});

test('cancelling terminates the inference worker and restores the panel', async () => {
  let terminated = false;
  class FakeWorker {
    postMessage() {}
    terminate() { terminated = true; }
  }
  const ui = panel(undefined, { Worker: FakeWorker });
  ui.element('text').value = 'A pasted article.';
  ui.element('voice').value = 'Luna';
  ui.element('speed').value = '1';
  const generating = ui.element('generate').click();
  ui.element('cancel').click();
  await generating;
  assert.equal(terminated, true);
  assert.equal(ui.element('generate').disabled, false);
  assert.match(ui.element('status').textContent, /cancelled/);
});

test('Allow this site requests only the blocked origin and retries extraction', async () => {
  let granted = false;
  let requested;
  const ui = panel({
    tabs: { query: async () => [{ id: 12, url: 'https://example.com/article' }] },
    permissions: { request: async (permissions) => {
      requested = permissions.origins[0]; granted = true; return true;
    } },
    scripting: { executeScript: async ({ files }) => {
      if (!granted) throw new Error('Cannot access contents of the page.');
      return files[0] === 'extract.js'
        ? [{ result: { title: 'My article', text: 'A useful article.', url: 'https://example.com/article' } }]
        : [{ result: null }];
    } }
  });
  await ui.read();
  await ui.element('allow-site').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requested, 'https://example.com/*');
  assert.equal(ui.element('text').value, 'A useful article.');
  assert.equal(ui.element('allow-site').hidden, true);
});

test('successful extraction fills the article and reports the word count', async () => {
  const ui = panel({
    tabs: { query: async () => [{ id: 12 }] },
    scripting: { executeScript: async ({ files }) => files[0] === 'extract.js'
      ? [{ result: { title: 'My article', text: 'A useful article to hear.', url: 'https://example.com/article' } }]
      : [{ result: null }] }
  });
  await ui.read();
  assert.equal(ui.element('text').value, 'A useful article to hear.');
  assert.equal(ui.element('title').textContent, 'My article');
  assert.match(ui.element('meta').textContent, /5 words/);
});

test('preview reports that tab reading requires the installed extension', async () => {
  const ui = panel(undefined);
  await ui.read();
  assert.equal(ui.element('extract-status').hidden, false);
  assert.match(ui.element('extract-status').textContent, /Chrome extension/);
});
