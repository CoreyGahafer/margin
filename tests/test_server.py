import io
import json
import threading
import time
import unittest
import urllib.error
import urllib.request
import wave

from server.app import Jobs, LocalHTTPServer, chunks, handler_for


class FakeEngine:
    def synthesize(self, text, voice, speed=1.0):
        return b"\0\0" * int(24000 / speed)


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.jobs = Jobs(FakeEngine())
        self.server = LocalHTTPServer(("127.0.0.1", 0), handler_for(self.jobs, "test-key"))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.jobs.pool.shutdown()

    def request(self, path, data=None, method=None, **headers):
        return urllib.request.urlopen(urllib.request.Request(
            self.url + path, data=json.dumps(data).encode() if data is not None else None,
            method=method, headers={"Host": "127.0.0.1:8765", "Authorization": "Bearer test-key", **headers}), timeout=3)

    def test_audio_roundtrip(self):
        with self.request("/jobs", {"text": "An article to listen to. " * 40, "voice": "Luna"}) as response:
            key = json.load(response)["id"]
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline:
            with self.request(f"/jobs/{key}") as response:
                info = json.load(response)
            if info["state"] == "done":
                break
            time.sleep(.01)
        self.assertEqual(info["state"], "done")
        self.assertEqual(info["completed"], info["total"])
        with self.request(f"/jobs/{key}/audio") as response:
            self.assertEqual(response.headers["Content-Type"], "audio/wav")
            audio = response.read()
        with wave.open(io.BytesIO(audio)) as wav:
            self.assertEqual(wav.getframerate(), 24000)
            self.assertEqual(wav.getnchannels(), 1)
            self.assertGreater(wav.getnframes(), 0)

    def test_rejects_unauthenticated_and_web_origins(self):
        for headers, code in [({"Authorization": "Bearer wrong"}, 401),
                              ({"Origin": "https://example.com"}, 403),
                              ({"Host": "evil.example:8765"}, 403)]:
            with self.assertRaises(urllib.error.HTTPError) as caught:
                self.request("/health", **headers)
            self.assertEqual(caught.exception.code, code)
            caught.exception.close()

    def test_invalid_payloads(self):
        for data in [[], {"text": "", "voice": "Luna"},
                     {"text": "a", "voice": "unknown"},
                     {"text": "a" * 60001, "voice": "Luna"}]:
            with self.assertRaises(urllib.error.HTTPError) as caught:
                self.request("/jobs", data)
            self.assertEqual(caught.exception.code, 400)
            caught.exception.close()

    def test_speed_changes_downloaded_audio_duration(self):
        def generate(speed):
            with self.request('/jobs', {'text': 'A short article.', 'voice': 'Luna', 'speed': speed}) as response:
                key = json.load(response)['id']
            deadline = time.monotonic() + 3
            while time.monotonic() < deadline and self.jobs.items[key]['state'] != 'done':
                time.sleep(.01)
            with self.request(f'/jobs/{key}/audio') as response:
                with wave.open(io.BytesIO(response.read())) as wav:
                    return wav.getnframes()
        normal = generate(1.0)
        fast = generate(1.5)
        self.assertLess(fast, normal * .75)

    def test_rejects_invalid_speed(self):
        for speed in [0, -1, 3, '1.5', True, float('nan'), float('inf')]:
            with self.assertRaises(urllib.error.HTTPError) as caught:
                self.request('/jobs', {'text': 'hello', 'voice': 'Luna', 'speed': speed})
            self.assertEqual(caught.exception.code, 400)
            caught.exception.close()

    def test_failure_is_visible(self):
        class BrokenEngine:
            def synthesize(self, *_args):
                raise RuntimeError("missing model")
        self.jobs.engine = BrokenEngine()
        key = self.jobs.create("hello", "Luna")
        self.jobs.pool.shutdown()
        self.assertEqual(self.jobs.items[key]["state"], "failed")
        self.assertIn("missing model", self.jobs.items[key]["error"])

    def test_cancel_and_busy(self):
        started, release = threading.Event(), threading.Event()
        class SlowEngine:
            def synthesize(self, *_args):
                started.set()
                release.wait(2)
                return b"\0\0"
        self.jobs.engine = SlowEngine()
        key = self.jobs.create("A sentence. " * 100, "Luna")
        self.assertTrue(started.wait(1))
        try:
            with self.assertRaises(ValueError):
                self.jobs.create("another", "Luna")
            with self.request(f"/jobs/{key}", method="DELETE") as response:
                self.assertEqual(response.status, 200)
        finally:
            release.set()
        self.jobs.pool.shutdown()
        self.assertEqual(self.jobs.items[key]["state"], "cancelled")
        self.assertIsNone(self.jobs.items[key]["audio"])


class ChunkTests(unittest.TestCase):
    def test_preserves_words_and_bounds_length(self):
        text = "A brief sentence. Another sentence with more words! " * 100
        parts = chunks(text)
        self.assertEqual(" ".join(parts), " ".join(text.split()))
        self.assertTrue(all(0 < len(part) <= 350 for part in parts))

    def test_unbroken_token(self):
        parts = chunks("x" * 1000)
        self.assertTrue(all(len(part) <= 350 for part in parts))
        self.assertEqual("".join(parts), "x" * 1000)


if __name__ == "__main__":
    unittest.main()
