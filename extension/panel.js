const $ = (id) => document.getElementById(id);
let audioURL = null, busy = false;
let synthesisWorker = null, cancelGeneration = null;
let streamPlayer = null;
let blockedOrigin = null;
function status(message, type = "") {
  $("status").textContent = message;
  $("indicator").className = `dot ${type}`;
}
function updateMeta() {
  const words = $("text").value.trim().split(/\s+/).filter(Boolean).length;
  $("meta").textContent = `${words.toLocaleString()} words · about ${Math.ceil(words / (155 * Number($("speed").value)))} min audio`;
}
function setBusy(value) {
  busy = value;
  for (const id of ["generate", "extract", "text", "voice", "speed", "playback-speed"]) $(id).disabled = value;
  $("cancel").hidden = !value;
  $("generate").firstElementChild.textContent = value ? "Making your audio…" : "Make audio";
}
function extractionStatus(message, error = false) {
  $("extract-status").textContent = message;
  $("extract-status").hidden = false;
  $("extract-status").className = error ? "extraction-error" : "";
}
$("extract").addEventListener("click", async () => {
  $("extract").disabled = true;
  $("allow-site").hidden = true;
  blockedOrigin = null;
  extractionStatus("Reading the current tab…");
  try {
    if (!globalThis.chrome?.scripting) throw new Error("Load this folder as a Chrome extension to read tabs. You can paste text here for a preview.");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!Number.isInteger(tab?.id)) throw new Error("No active browser tab found. Open your article and try again.");
    if (tab.url && !/^https?:\/\//i.test(tab.url)) throw new Error("Chrome does not allow reading this page. Open an ordinary website article, or paste its text below.");
    if (tab.url) blockedOrigin = `${new URL(tab.url).origin}/*`;
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["vendor/Readability.js"] });
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["extract.js"] });
    const article = result?.result;
    if (!article?.text) throw new Error("No article found. Highlight the passage you want or paste text below.");
    if (article.text.length > 60000) throw new Error("This article exceeds 60,000 characters. Highlight a shorter section.");
    $("title").textContent = article.title;
    $("source").textContent = `${new URL(article.url).hostname}${article.byline ? ` · ${article.byline}` : ""}${article.selected ? " · Selected passage" : ""}`;
    $("text").value = article.text;
    updateMeta();
    extractionStatus("Article loaded. Review the text below or choose Make audio.");
    blockedOrigin = null;
    status("Article ready. Review the text, then make audio.", "ready");
  } catch (error) {
    const denied = /Cannot access contents|must request permission|cannot access a chrome|Missing host permission/i.test(error.message);
    $("allow-site").hidden = !(denied && blockedOrigin);
    const message = denied
      ? blockedOrigin
        ? "Chrome needs your permission to read this website. Choose Allow this site, then approve Chrome’s prompt."
        : "Chrome has blocked access to this page. Reload Margin in chrome://extensions, then reopen the side panel on an ordinary website article."
      : error.message;
    extractionStatus(message, true);
    $("extract-status").scrollIntoView({ block: "nearest" });
    status(message, "error");
    $("text-details").open = true;
  } finally { $("extract").disabled = busy; }
});
$("allow-site").addEventListener("click", async () => {
  if (!blockedOrigin || busy) return;
  $("allow-site").disabled = true;
  try {
    // Call directly from this click, before awaiting, to preserve the user gesture.
    const granted = await chrome.permissions.request({ origins: [blockedOrigin] });
    if (!granted) {
      extractionStatus("Site access was not granted. You can try again or paste the article text below.", true);
      return;
    }
    $("allow-site").hidden = true;
    $("extract").click();
  } catch (error) { extractionStatus(`Could not request site access: ${error.message}`, true); }
  finally { $("allow-site").disabled = false; }
});
$("text").addEventListener("input", updateMeta);
$("speed").addEventListener("change", () => {
  updateMeta();
  if (audioURL) status("Narration speed changed. Make audio again to apply it to the file.");
});
$("playback-speed").addEventListener("change", () => {
  $("audio").playbackRate = Number($("playback-speed").value);
});
function synthesize(input, onChunk) {
  return new Promise((resolve, reject) => {
    synthesisWorker ||= new Worker(new URL("tts-worker.mjs", document.baseURI), { type: "module" });
    const worker = synthesisWorker;
    const finish = (error, wav) => {
      cancelGeneration = null;
      worker.onmessage = null;
      worker.onerror = null;
      if (error) reject(error); else resolve(wav);
    };
    cancelGeneration = () => {
      worker.terminate();
      synthesisWorker = null;
      finish(new Error("Generation cancelled."));
    };
    worker.onerror = (event) => {
      worker.terminate();
      synthesisWorker = null;
      finish(new Error(`The local speech engine could not start: ${event.message || "reload the complete extension folder."}`));
    };
    worker.onmessage = ({ data }) => {
      if (data.type === "loading") status("Loading your local voice…");
      if (data.type === "progress") status(`Making audio · ${data.completed} of ${data.total} passages`);
      if (data.type === "chunk") onChunk?.(new Float32Array(data.pcm), data);
      if (data.type === "error") {
        worker.terminate();
        synthesisWorker = null;
        finish(new Error(data.error));
      }
      if (data.type === "done") finish(null, data.wav);
    };
    worker.postMessage(input);
  });
}
$("generate").addEventListener("click", async () => {
  if (busy) return;
  const text = $("text").value.trim();
  if (!text) { $("text-details").open = true; $("text").focus(); return status("Read an article or paste some text first.", "error"); }
  if (text.length > 60000) return status("Use up to 60,000 characters per listen.", "error");
  setBusy(true);
  streamPlayer?.stop();
  streamPlayer = null;
  $("audio").pause();
  $("audio").hidden = true;
  $("stream-toggle").hidden = true;
  $("download").hidden = true;
  $("playback-speed").value = "1";
  $("player").hidden = true;
  try {
    const speed = Number($("speed").value);
    streamPlayer = new MarginStreamPlayer((state) => {
      $("stream-toggle").textContent = state === 'paused' ? 'Resume listening' : 'Pause listening';
      $("stream-state").textContent = state === 'buffering' ? 'Buffering the next passage…' : state === 'paused' ? 'Listening paused. Generation continues.' : 'Listening while the rest is generated.';
    });
    const wav = await synthesize({ text, voice: $("voice").value, speed }, (samples, info) => {
      streamPlayer.add(samples, speed);
      $("player").hidden = false;
      $("stream-toggle").hidden = false;
      $("stream-state").hidden = false;
      $("audio-info").textContent = `${info.completed} of ${info.total} passages ready · ${$("voice").value} · ${speed}× narration`;
    });
    const position = streamPlayer.position;
    const continuePlaying = !streamPlayer.paused && streamPlayer.entries.length > 0;
    streamPlayer.stop();
    streamPlayer = null;
    const blob = new Blob([wav], { type: "audio/wav" });
    if (audioURL) URL.revokeObjectURL(audioURL);
    audioURL = URL.createObjectURL(blob);
    $("audio").src = audioURL;
    $("audio").hidden = false;
    $("stream-toggle").hidden = true;
    $("stream-state").hidden = true;
    $("playback-speed").value = "1";
    $("audio").playbackRate = 1;
    const seconds = (wav.byteLength - 44) / 48000;
    const minutes = Math.floor(seconds / 60);
    $("audio-info").textContent = `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")} audio · ${$("voice").value} · ${speed}× narration`;
    $("download").href = audioURL;
    $("download").hidden = false;
    $("download").download = `${$("title").textContent.replace(/[^a-z0-9 -]/gi, "").slice(0, 80) || "article"}.wav`;
    $("player").hidden = false;
    const audio = $("audio");
    const completedURL = audioURL;
    audio.addEventListener('loadedmetadata', () => {
      if (audio.src !== completedURL || busy) return;
      audio.currentTime = Math.min(position, seconds);
      if (continuePlaying && position < seconds - .1) audio.play().catch(() => status("Audio ready. Press play to continue.", "ready"));
    }, { once: true });
    status(continuePlaying ? "Audio complete. Listening continues." : "Your audio is ready. Press play to listen.", "ready");
  } catch (error) {
    streamPlayer?.stop();
    streamPlayer = null;
    $("player").hidden = true;
    status(error.message, error.message === "Generation cancelled." ? "" : "error");
  }
  finally { cancelGeneration = null; setBusy(false); }
});
$("cancel").addEventListener("click", () => cancelGeneration?.());
$("stream-toggle").addEventListener("click", () => streamPlayer?.toggle().catch(error => status(error.message, "error")));
status("Ready. Audio is made right here in your browser.", "ready");
