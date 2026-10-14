"""Loopback-only KittenTTS companion. No web framework required."""
import io
import json
import math
import os
import re
import secrets
import threading
import time
import uuid
import wave
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from socketserver import TCPServer

VOICES = ["Bella", "Jasper", "Luna", "Bruno", "Rosie", "Hugo", "Kiki", "Leo"]
MODEL = "KittenML/kitten-tts-nano-0.8-int8"
MAX_TEXT = 60000


class LocalHTTPServer(ThreadingHTTPServer):
    def server_bind(self):
        # Loopback needs no reverse DNS; it can hang on offline machines.
        TCPServer.server_bind(self)
        self.server_name = "localhost"
        self.server_port = self.server_address[1]

    def get_request(self):
        client, address = super().get_request()
        client.settimeout(15)
        return client, address


def chunks(text, limit=350):
    """Bound sentence-sized inputs, including paragraphs without punctuation."""
    words = text.split()
    result, current = [], ""
    for word in words:
        # Split pathological unbroken tokens too, so the limit always holds.
        for start in range(0, len(word), limit):
            part = word[start:start + limit]
            if current and len(current) + len(part) + 1 > limit:
                result.append(current)
                current = ""
            current = f"{current} {part}".strip()
            if re.search(r'[.!?]["\u201d\u2019]?$', current) and len(current) >= limit // 2:
                result.append(current)
                current = ""
    if current:
        result.append(current)
    return result


class Engine:
    def __init__(self):
        self.model = None

    def synthesize(self, text, voice, speed=1.0):
        import numpy as np
        from kittenml import KittenTTS
        if self.model is None:
            self.model = KittenTTS(MODEL, backend="cpu")
        audio = self.model.generate(text, voice=voice, speed=speed, clean_text=True)
        return (np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes()


class Jobs:
    def __init__(self, engine):
        self.engine = engine
        self.items = {}
        self.lock = threading.Lock()
        self.pool = ThreadPoolExecutor(max_workers=1)

    def create(self, text, voice, speed=1.0):
        with self.lock:
            now = time.time()
            self.items = {k: v for k, v in self.items.items()
                          if v["state"] in ("queued", "running") or now - v["updated"] < 1800}
            if any(v["state"] in ("queued", "running") for v in self.items.values()):
                raise ValueError("A generation is already running. Wait or cancel it first.")
            # At most three completed WAVs in memory.
            while len(self.items) >= 3:
                del self.items[next(iter(self.items))]
            parts = chunks(text)
            key = uuid.uuid4().hex
            self.items[key] = dict(state="queued", completed=0, total=len(parts),
                                   updated=now, cancel=False, audio=None, error=None)
        self.pool.submit(self.run, key, parts, voice, speed)
        return key

    def run(self, key, parts, voice, speed):
        item = self.items[key]
        try:
            item["state"] = "running"
            pcm = bytearray()
            for part in parts:
                if item["cancel"]:
                    item["state"] = "cancelled"
                    return
                pcm.extend(self.engine.synthesize(part, voice, speed))
                pcm.extend(b"\0\0" * int(2400 / speed))  # Scale pauses with narration.
                item["completed"] += 1
            if item["cancel"]:
                item["state"] = "cancelled"
                return
            output = io.BytesIO()
            with wave.open(output, "wb") as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(24000)
                wav.writeframes(pcm)
            item["audio"] = output.getvalue()
            item["state"] = "done"
        except Exception as exc:
            item["error"] = f"KittenTTS could not generate audio: {exc}"
            item["state"] = "failed"
        finally:
            item["updated"] = time.time()


def handler_for(jobs, token):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # Do not log article text or pairing keys.

        def origin_allowed(self):
            origin = self.headers.get("Origin", "")
            return not origin or bool(re.fullmatch(r"chrome-extension://[a-p]{32}", origin))

        def send(self, code, data, content_type="application/json"):
            body = json.dumps(data).encode() if content_type == "application/json" else data
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            if self.origin_allowed() and self.headers.get("Origin"):
                self.send_header("Access-Control-Allow-Origin", self.headers["Origin"])
                self.send_header("Vary", "Origin")
            self.end_headers()
            self.wfile.write(body)

        def authorized(self):
            if self.headers.get("Host") != "127.0.0.1:8765" or not self.origin_allowed():
                self.send(403, {"error": "Only the local Chrome extension can connect."})
                return False
            if not secrets.compare_digest(self.headers.get("Authorization", ""), f"Bearer {token}"):
                self.send(401, {"error": "Invalid pairing key."})
                return False
            return True

        def do_OPTIONS(self):
            if not self.origin_allowed() or self.headers.get("Host") != "127.0.0.1:8765":
                return self.send(403, {"error": "Origin not allowed."})
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", ""))
            self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.end_headers()

        def do_GET(self):
            if not self.authorized():
                return
            if self.path == "/health":
                return self.send(200, {"model": MODEL, "voices": VOICES})
            match = re.fullmatch(r"/jobs/([a-f0-9]{32})(/audio)?", self.path)
            item = jobs.items.get(match[1]) if match else None
            if not item:
                return self.send(404, {"error": "Audio expired. Generate it again."})
            if match[2]:
                if item["state"] != "done":
                    return self.send(409, {"error": "Audio is not ready yet."})
                return self.send(200, item["audio"], "audio/wav")
            self.send(200, {k: item[k] for k in ("state", "completed", "total", "error")})

        def do_POST(self):
            if not self.authorized():
                return
            if self.path != "/jobs":
                return self.send(404, {"error": "Unknown endpoint."})
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 400000:
                    return self.send(413, {"error": "Request is too large or empty."})
                data = json.loads(self.rfile.read(length))
                if not isinstance(data, dict):
                    raise ValueError("Expected a JSON object.")
                text, voice = data.get("text"), data.get("voice")
                if not isinstance(text, str) or not text.strip() or len(text) > MAX_TEXT:
                    raise ValueError("Text must contain 1–60,000 characters.")
                if voice not in VOICES:
                    raise ValueError("Choose one of the available voices.")
                speed = data.get("speed", 1.0)
                if (type(speed) not in (int, float) or not math.isfinite(speed)
                        or not 0.75 <= speed <= 2.0):
                    raise ValueError("Narration speed must be a number between 0.75 and 2.")
                key = jobs.create(text.strip(), voice, speed)
            except (ValueError, TypeError, UnicodeError) as exc:
                return self.send(400, {"error": str(exc)})
            self.send(202, {"id": key})

        def do_DELETE(self):
            if not self.authorized():
                return
            match = re.fullmatch(r"/jobs/([a-f0-9]{32})", self.path)
            item = jobs.items.get(match[1]) if match else None
            if not item:
                return self.send(404, {"error": "Unknown generation."})
            item["cancel"] = True
            self.send(200, {"ok": True})
    return Handler


def main():
    token_path = Path(__file__).with_name(".pairing-key")
    if not token_path.exists():
        fd = os.open(token_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as file:
            file.write(secrets.token_urlsafe(32))
    token = token_path.read_text().strip()
    jobs = Jobs(Engine())
    server = LocalHTTPServer(("127.0.0.1", 8765), handler_for(jobs, token))
    # Bound slow/malformed clients and suppress tracebacks on browser disconnects.
    server.daemon_threads = True
    print(f"Margin is listening at http://127.0.0.1:8765\nPairing key: {token}", flush=True)
    print("The model downloads on first generation. Keep this terminal open.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        for item in jobs.items.values():
            item["cancel"] = True
    finally:
        server.server_close()
        jobs.pool.shutdown(wait=True)


if __name__ == "__main__":
    main()
